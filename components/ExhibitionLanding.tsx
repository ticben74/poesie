
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Square, Circle, MoveHorizontal, Shuffle, Save, Edit,
  Layers, Move, Sparkles, Eye, Settings2, RotateCcw, LayoutGrid,
  ChevronDown, MousePointer2, Globe, Compass, Plus, Trash2, Copy, Rocket, Link, ExternalLink, Share2, Map as MapIcon,
  Wand2, CheckCircle2, Download, MousePointerSquareDashed, List, AlignLeft, Star, Monitor
} from 'lucide-react';
import { db, Exhibition, generateExhibitionId, slugify } from '../services/supabase';
import { MediaOverlay } from './MediaOverlay';
import { ExhibitionMap } from './ExhibitionMap';
import { Narrative } from '../types';

type LayoutType = 'sphere' | 'cylinder' | 'ring' | 'random' | 'manual' | 'square' | 'linear';
type UserRole = 'visitor' | 'editor' | 'coordinator';

export const ExhibitionLanding: React.FC<{ 
  exhibitionId: string; 
  role?: UserRole; 
  onClose: () => void 
}> = ({
  exhibitionId,
  role = 'visitor',
  onClose
}) => {
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'stars'>(role === 'visitor' ? 'stars' : 'cards');
  
  // Navigation & Immersive State
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [scrollDepth, setScrollDepth] = useState(0); 
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  
  // Constants for scroll range
  const MIN_DEPTH = -10000;
  const MAX_DEPTH = 2000;
  
  // Operational State
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [activeNarrative, setActiveNarrative] = useState<Narrative | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPopUpActive, setIsPopUpActive] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const isEditorMode = role === 'editor' || role === 'coordinator';

  useEffect(() => { loadData(); }, [exhibitionId]);

  useEffect(() => {
    if (!isRotating || isPopUpActive || role !== 'visitor' || showMap) return;
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.06) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, [isRotating, isPopUpActive, role, showMap]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPopUpActive || showMap) return;
      setMouseTilt({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * -20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPopUpActive, showMap]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isPopUpActive || showMap) return;
      
      // Depth control: Only for roles allowed to edit layout
      if (draggingNodeId !== null && isEditorMode) {
        e.preventDefault();
        const delta = -e.deltaY * 0.5; 
        setExhibition(prev => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map(item => 
              item.id === draggingNodeId ? { ...item, z: (item.z || 0) + delta } : item
            )
          };
        });
      } else {
        setScrollDepth(prev => {
          const newDepth = prev - e.deltaY * 1.5;
          return Math.min(MAX_DEPTH, Math.max(MIN_DEPTH, newDepth)); 
        });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [draggingNodeId, isEditorMode, isPopUpActive, showMap]);

  async function loadData() {
    setLoading(true);
    const data = await db.getExhibition(exhibitionId);
    if (data) {
      const itemsWithZ = data.items.map((item: any, i: number) => ({
        ...item,
        z: item.z !== undefined ? item.z : (Math.sin(i) * 600)
      }));
      setExhibition({ ...data, items: itemsWithZ });
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!exhibition) return;
    setSaving(true);
    await db.saveExhibition(exhibition);
    setSaving(false);
    alert('تم حفظ هندسة الساحة والمحتوى سحابياً.');
  };

  const handleExport = () => {
    if (!exhibition) return;
    const dataStr = JSON.stringify(exhibition, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exhibition.slug || 'exhibition'}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('تم تصدير ملف المعرض بنجاح.');
  };

  const addNewNarrative = () => {
    if (!exhibition || !isEditorMode) return;
    const newItem: Narrative = {
      id: Date.now(),
      title: "قصيدة جديدة",
      poet: "منسق المدن",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1000",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      content: "بانتظار وحي الشاعر...",
      x: 50,
      y: 50,
      z: 0
    };
    setExhibition({ ...exhibition, items: [newItem, ...exhibition.items] });
  };

  const deleteNarrative = (id: number) => {
    if (!exhibition || role === 'visitor') return;
    setExhibition({
      ...exhibition,
      items: exhibition.items.filter(i => i.id !== id)
    });
  };

  const applyGeometry = (type: LayoutType) => {
    if (!exhibition || role !== 'coordinator') return;
    const items = [...exhibition.items];
    const total = items.length;
    items.forEach((item, i) => {
      const angle = (i / total) * 2 * Math.PI;
      if (type === 'sphere') {
        const phi = Math.acos(-1 + (2 * i) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        item.x = 50 + 40 * Math.sin(phi) * Math.cos(theta);
        item.y = 50 + 40 * Math.sin(phi) * Math.sin(theta);
        item.z = 40 * Math.cos(phi) * 15;
      } else if (type === 'cylinder') {
        item.x = 50 + 45 * Math.cos(angle);
        item.y = 10 + (i / total) * 80;
        item.z = 45 * Math.sin(angle) * 15;
      } else if (type === 'ring') {
        item.x = 50 + 42 * Math.cos(angle);
        item.y = 50;
        item.z = 42 * Math.sin(angle) * 15;
      } else if (type === 'square') {
        const side = Math.ceil(Math.sqrt(total));
        const spacing = 70 / (side > 1 ? side - 1 : 1);
        item.x = 15 + (i % side) * spacing;
        item.y = 15 + Math.floor(i / side) * spacing;
        item.z = 0;
      } else if (type === 'linear') {
        item.x = 50;
        item.y = 15 + (i / total) * 70;
        item.z = (i - total / 2) * 500;
      } else if (type === 'random') {
        item.x = 15 + Math.random() * 70;
        item.y = 15 + Math.random() * 70;
        item.z = (Math.random() - 0.5) * 4000;
      }
    });
    setExhibition({ ...exhibition, items });
    setShowLayoutMenu(false);
  };

  const openNarrative = (item: Narrative) => {
    setActiveNarrative(item);
    setIsPopUpActive(true);
    setIsRotating(false);
    if (audioElement) audioElement.pause();
    const audio = new Audio(item.audioUrl);
    audio.play().catch(() => {});
    setAudioElement(audio);
  };

  const closeNarrative = () => {
    setIsPopUpActive(false);
    setActiveNarrative(null);
    setIsRotating(true);
    if (audioElement) { audioElement.pause(); setAudioElement(null); }
  };

  // Calculate scroll progress percentage
  const scrollProgress = ((scrollDepth - MAX_DEPTH) / (MIN_DEPTH - MAX_DEPTH)) * 100;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-stone-950">
      <div className="w-16 h-16 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!hasEntered && role === 'visitor') {
    return (
      <div className="h-screen bg-stone-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000 overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-40">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]"></div>
        </div>
        <div className="space-y-12 max-w-3xl relative z-10">
           <div className="w-24 h-24 bg-blue-600/10 mx-auto rounded-[2rem] flex items-center justify-center border border-blue-600/20 rotate-12">
              <Sparkles className="text-blue-500" size={48} />
           </div>
           <div className="space-y-4">
              <span className="text-blue-500 text-xs font-black uppercase tracking-[0.5em]">مدن الشعر الرقمية</span>
              <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-none">{exhibition?.context.name}</h1>
              <p className="text-stone-500 text-2xl font-amiri italic max-w-xl mx-auto">{exhibition?.context.location}</p>
           </div>
           <button onClick={() => setHasEntered(true)} className="px-16 py-8 bg-white text-stone-950 rounded-full font-black text-3xl hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105 shadow-3xl active:scale-95">دخول الساحة</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-950 text-stone-100 font-amiri overflow-hidden flex flex-col select-none touch-none" dir="rtl">
      
      {/* Scroll Progress Indicator (Left Edge) */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[120] flex flex-col items-center gap-4 group">
        <span className="text-[10px] font-black text-stone-600 uppercase vertical-text tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">عمق القصيد</span>
        <div className="w-1 h-64 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
          <div 
            className="absolute top-0 w-full bg-blue-600/40 transition-all duration-300"
            style={{ height: `${scrollProgress}%` }}
          />
          <div 
            className="absolute w-3 h-3 bg-blue-500 rounded-full left-1/2 -translate-x-1/2 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
            style={{ top: `${scrollProgress}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>
        <span className="text-[10px] font-black text-blue-500/50">{Math.round(scrollProgress)}%</span>
      </div>

      {/* HUD (Heads-Up Display) */}
      <div className="fixed top-10 right-10 z-[120] pointer-events-none flex flex-col gap-6 items-end w-full max-w-sm">
        
        {/* Nav & Role Plate */}
        <div className="pointer-events-auto flex items-center gap-6 bg-stone-900/90 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/10 shadow-3xl w-full">
          <button onClick={onClose} className="p-4 bg-stone-800 hover:bg-red-600 rounded-2xl text-white transition-all shadow-xl active:scale-90"><ArrowLeft size={20}/></button>
          
          <button 
            onClick={() => setShowMap(!showMap)} 
            className={`p-4 rounded-2xl transition-all shadow-xl active:scale-90 flex items-center justify-center ${showMap ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-400 hover:text-blue-500'}`}
            title="موقع الساحة"
          >
            <MapIcon size={20}/>
          </button>

          <div className="h-10 w-px bg-white/10"></div>
          <div className="flex-1">
             <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest leading-none mb-1">
               {role === 'coordinator' ? 'غرفة المنسق' : role === 'editor' ? 'استوديو المحرر' : 'ساحة الزائر'}
             </h4>
             <span className="text-md font-bold block leading-none">
               {role === 'coordinator' ? 'هندسة الفضاء' : role === 'editor' ? 'صياغة الذاكرة' : exhibition?.context.name}
             </span>
          </div>
          {role !== 'visitor' && (
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="p-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white shadow-xl active:scale-90 transition-all"
              title="حفظ التغييرات"
            >
              {saving ? <RotateCcw className="animate-spin" size={20}/> : <Save size={20}/>}
            </button>
          )}
        </div>

        {/* Coordinator Tools (Space Engineering) */}
        {role === 'coordinator' && (
          <div className="pointer-events-auto flex flex-col gap-4 animate-in slide-in-from-right-10 duration-700 w-full">
            <div className="bg-stone-900/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-3xl space-y-6">
               <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3 text-blue-500">
                    <List size={14}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">المسار الحالي</span>
                  </div>
                  <span className="text-xl font-black text-white">{exhibition?.items.length} <span className="text-[8px] text-stone-500">نقطة</span></span>
               </div>

               <div className="flex flex-col gap-3 relative">
                  <div className="flex items-center justify-between opacity-50 px-2 pt-2">
                    <span className="text-[9px] font-black uppercase tracking-widest">التشكيل الهندسي</span>
                    <Compass size={14} />
                  </div>
                  
                  {/* Layout Dropdown Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all flex items-center justify-between active:scale-95 group"
                    >
                      <div className="flex items-center gap-3">
                        <LayoutGrid size={18} className="text-blue-500" />
                        <span className="text-sm font-bold">اختر النمط الهندسي</span>
                      </div>
                      <ChevronDown size={16} className={`text-stone-500 transition-transform ${showLayoutMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showLayoutMenu && (
                      <div className="absolute top-full right-0 left-0 mt-3 bg-stone-900 border border-white/10 rounded-3xl overflow-hidden shadow-3xl z-[150] animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 divide-y divide-white/5">
                          <button onClick={() => applyGeometry('square')} className="w-full px-6 py-4 text-right hover:bg-blue-600/10 flex items-center gap-4 transition-colors">
                            <Square size={16} className="text-stone-500" />
                            <span className="text-sm">تنسيق مربّع (شبكة)</span>
                          </button>
                          <button onClick={() => applyGeometry('ring')} className="w-full px-6 py-4 text-right hover:bg-blue-600/10 flex items-center gap-4 transition-colors">
                            <Circle size={16} className="text-stone-500" />
                            <span className="text-sm">تنسيق دائري (حلقة)</span>
                          </button>
                          <button onClick={() => applyGeometry('linear')} className="w-full px-6 py-4 text-right hover:bg-blue-600/10 flex items-center gap-4 transition-colors">
                            <AlignLeft size={16} className="text-stone-500" />
                            <span className="text-sm">تنسيق خطي (عمق)</span>
                          </button>
                          <button onClick={() => applyGeometry('sphere')} className="w-full px-6 py-4 text-right hover:bg-blue-600/10 flex items-center gap-4 transition-colors">
                            <Globe size={16} className="text-stone-500" />
                            <span className="text-sm">تنسيق كروي (سديم)</span>
                          </button>
                          <button onClick={() => applyGeometry('cylinder')} className="w-full px-6 py-4 text-right hover:bg-blue-600/10 flex items-center gap-4 transition-colors">
                            <Layers size={16} className="text-stone-500" />
                            <span className="text-sm">تنسيق أسطواني</span>
                          </button>
                          <button onClick={() => applyGeometry('random')} className="w-full px-6 py-4 text-right hover:bg-blue-600/10 flex items-center gap-4 transition-colors">
                            <Shuffle size={16} className="text-stone-500" />
                            <span className="text-sm">توزيع عشوائي</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
               </div>

               <div className="h-px bg-white/5"></div>
               <div className="flex flex-col gap-3">
                 <button 
                   onClick={() => setViewMode(viewMode === 'cards' ? 'stars' : 'cards')}
                   className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${viewMode === 'stars' ? 'bg-amber-600 text-white' : 'bg-white/5 text-stone-300 border border-white/5 hover:bg-white/10'}`}
                 >
                   {viewMode === 'stars' ? <Monitor size={18}/> : <Eye size={18}/>}
                   <span>{viewMode === 'stars' ? 'العودة للمحرر' : 'معاينة الزائر'}</span>
                 </button>
                 <button 
                   onClick={addNewNarrative}
                   className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/20"
                 >
                   <Plus size={18}/>
                   <span>إضافة قصيدة للمسار</span>
                 </button>
                 <button 
                   onClick={handleExport}
                   className="w-full py-4 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/5 shadow-lg"
                 >
                   <Download size={16}/>
                   <span>تصدير الديوان (JSON)</span>
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Main 3D Stage */}
      <main 
        ref={containerRef}
        className="flex-1 relative perspective-[2000px] overflow-hidden bg-black"
        style={{ perspectiveOrigin: `${50 + mouseTilt.x * 0.4}% ${50 + mouseTilt.y * -0.4}%` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#020617_0%,#000000_100%)] opacity-90"></div>
        
        {/* Stellar Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
           <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-white rounded-full blur-[1px] animate-pulse"></div>
           <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-blue-400 rounded-full blur-[1px] animate-pulse delay-500"></div>
           <div className="absolute bottom-1/4 left-2/3 w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse delay-1000"></div>
        </div>

        <div 
          className="relative w-full h-full preserve-3d transition-all duration-[1000ms] ease-out"
          style={{ 
            transform: `translate3d(0, 0, ${scrollDepth}px) rotateX(${mouseTilt.y * 0.5}deg) rotateY(${rotation + mouseTilt.x * 0.5}deg)`, 
            filter: (isPopUpActive || showMap) ? 'blur(40px) brightness(0.1)' : 'none' 
          }}
        >
          {exhibition?.items.map((item) => {
            const billY = -(rotation + mouseTilt.x * 0.5);
            const billX = -(mouseTilt.y * 0.5);
            const isDragging = draggingNodeId === item.id;
            const dist = (item.z || 0) + scrollDepth;
            const opacity = Math.max(0, Math.min(1, (dist + 6000) / 6000));
            const blur = Math.max(0, Math.min(10, Math.abs(dist) / 1000));

            return (
              <div 
                key={item.id}
                onPointerDown={(e) => {
                  if (isEditorMode && viewMode === 'cards') {
                    const target = e.currentTarget as HTMLElement;
                    target.setPointerCapture(e.pointerId);
                    setDraggingNodeId(item.id);
                    setIsRotating(false);
                  }
                }}
                onPointerUp={(e) => {
                  if (draggingNodeId === item.id) {
                    const target = e.currentTarget as HTMLElement;
                    target.releasePointerCapture(e.pointerId);
                    setDraggingNodeId(null);
                    setIsRotating(true);
                  }
                }}
                onPointerMove={(e) => {
                  if (isDragging && isEditorMode && containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setExhibition(prev => prev ? ({...prev, items: prev.items.map(it => it.id === item.id ? {...it, x, y} : it)}) : null);
                  }
                }}
                onClick={() => !isDragging && openNarrative(item)}
                className={`absolute transform-gpu preserve-3d transition-all ${isEditorMode && viewMode === 'cards' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isDragging ? 'duration-0 scale-110 z-[500]' : 'duration-700'}`}
                style={{ 
                  left: `${item.x}%`, top: `${item.y}%`, 
                  transform: `translate3d(-50%, -50%, ${item.z || 0}px) rotateY(${billY}deg) rotateX(${billX}deg)`,
                  zIndex: Math.round(item.z || 0) + 10000,
                  opacity: isDragging ? 1 : opacity,
                  filter: isDragging ? 'none' : `blur(${blur}px)`,
                  pointerEvents: opacity < 0.05 ? 'none' : 'auto'
                }}
              >
                <div className="relative group flex items-center justify-center">
                   
                   {/* Role specific quick controls */}
                   {role === 'editor' && !isDragging && viewMode === 'cards' && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-[110] animate-in slide-in-from-bottom-2 duration-300">
                         <button onClick={(e) => { e.stopPropagation(); openNarrative(item); }} className="p-3 bg-blue-600 rounded-xl text-white shadow-xl hover:scale-110 transition-transform"><Edit size={16}/></button>
                         <button onClick={(e) => { e.stopPropagation(); if(confirm('حذف؟')) deleteNarrative(item.id); }} className="p-3 bg-red-600 rounded-xl text-white shadow-xl hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                      </div>
                   )}

                   {isEditorMode && !isDragging && viewMode === 'cards' && (
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-stone-900/80 px-4 py-2 rounded-lg border border-white/5 text-[8px] font-black uppercase tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">اسحب لتنسيق البيت</div>
                   )}

                   {/* Point visual for "Stars" mode / Visitor view */}
                   {viewMode === 'stars' ? (
                     <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] group-hover:scale-150 transition-transform duration-500 border border-white/20"></div>
                        <div className="absolute inset-0 w-12 h-12 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-all duration-700 animate-pulse"></div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                           <span className="text-xs font-bold text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">{item.title}</span>
                        </div>
                     </div>
                   ) : (
                     /* Visual Plate for Editor/Coordinator */
                     <div className={`w-40 h-56 md:w-64 md:h-80 rounded-[3rem] overflow-hidden border-2 transition-all duration-700 shadow-3xl ${isDragging ? 'border-blue-500 ring-8 ring-blue-500/10' : 'border-white/5 group-hover:border-blue-500/50'}`}>
                        <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-10 inset-x-6 text-center">
                           <h4 className="text-white text-[10px] font-black uppercase tracking-widest truncate">{item.title}</h4>
                        </div>
                     </div>
                   )}

                   {/* Coordinator Detail Overlays */}
                   {isDragging && (
                      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-blue-600 px-5 py-3 rounded-2xl text-[10px] font-black text-white shadow-2xl flex items-center gap-3 animate-pulse">
                         <MoveHorizontal size={14}/>
                         <span>عمق الأثر: {Math.round(item.z || 0)}</span>
                      </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Overlays */}
      {showMap && exhibition?.context.lat && exhibition?.context.lng && (
        <ExhibitionMap 
          lat={exhibition.context.lat} 
          lng={exhibition.context.lng} 
          name={exhibition.context.name} 
          onClose={() => setShowMap(false)} 
        />
      )}

      {isPopUpActive && activeNarrative && (
        <MediaOverlay 
          item={activeNarrative} 
          onClose={closeNarrative} 
          role={role}
          onUpdate={(updated) => {
             const newItems = exhibition!.items.map(i => i.id === updated.id ? updated : i);
             setExhibition({ ...exhibition!, items: newItems });
          }}
          onDelete={role === 'editor' ? deleteNarrative : undefined}
        />
      )}

      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
};

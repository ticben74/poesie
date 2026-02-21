
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Square, Circle, MoveHorizontal, Shuffle, Save, Edit,
  Layers, Move, Sparkles, Eye, Settings2, RotateCcw, LayoutGrid,
  ChevronDown, MousePointer2, Globe, Compass, Plus, Trash2, Copy, Rocket, Link, ExternalLink, Share2, Map as MapIcon,
  Wand2, CheckCircle2, Download, MousePointerSquareDashed, List, AlignLeft, Star, Monitor, X, Palette, QrCode, Navigation, Settings, Camera, Check,
  Type, Layout, SaveAll, Maximize, MousePointer, Box, Info, Zap, Sparkle
} from 'lucide-react';
import { db, Exhibition, generateExhibitionId, slugify } from '../services/supabase';
import { MediaOverlay } from './MediaOverlay';
import { ExhibitionMap } from './ExhibitionMap';
import { Narrative } from '../types';
import { getLiteraryInsights, generateExhibitionContent } from '../services/geminiService';
import PoetryBabylonStage from './PoetryBabylonStage';

type LayoutType = 'sphere' | 'cylinder' | 'ring' | 'random' | 'manual' | 'square' | 'linear';
type UserRole = 'visitor' | 'editor' | 'coordinator';

export const ExhibitionLanding: React.FC<{ 
  exhibitionId: string; 
  role?: UserRole; 
  onClose: (name: string, role: UserRole) => void 
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
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isIncepting, setIsIncepting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'stars'>(role === 'visitor' ? 'stars' : 'cards');
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [locationInsights, setLocationInsights] = useState<{text: string, sources: any[]} | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [scrollDepth, setScrollDepth] = useState(0); 
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  
  const MIN_DEPTH = -100;
  const MAX_DEPTH = 100;
  
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [activeNarrative, setActiveNarrative] = useState<Narrative | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPopUpActive, setIsPopUpActive] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isEditorMode = role === 'editor' || role === 'coordinator';

  useEffect(() => { 
    const params = new URLSearchParams(window.location.search);
    if (params.has('ex') || params.has('id')) {
      setHasEntered(true);
    }
    loadData(); 
  }, [exhibitionId]);

  useEffect(() => {
    if (!isRotating || isPopUpActive || role !== 'visitor' || showMap || showContextModal || showPublishModal || isPhotoMode || showAIModal) return;
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.06) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, [isRotating, isPopUpActive, role, showMap, showContextModal, showPublishModal, isPhotoMode, showAIModal]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPopUpActive || showMap || showContextModal || showPublishModal || isPhotoMode || showAIModal) return;
      setMouseTilt({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * -20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPopUpActive, showMap, showContextModal, showPublishModal, isPhotoMode, showAIModal]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isPopUpActive || showMap || showContextModal || showPublishModal || isPhotoMode || showAIModal) return;
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
          const newDepth = prev + e.deltaY * 0.05;
          return Math.min(MAX_DEPTH, Math.max(MIN_DEPTH, newDepth)); 
        });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [draggingNodeId, isEditorMode, isPopUpActive, showMap, showContextModal, showPublishModal, isPhotoMode, showAIModal]);

  async function loadData() {
    setLoading(true);
    const data = await db.getExhibition(exhibitionId);
    if (data) {
      const itemsWithZ = data.items.map((item: any, i: number) => ({
        ...item,
        type: item.type || 'poem',
        z: item.z !== undefined ? item.z : (Math.sin(i) * 600),
        opacity: item.opacity !== undefined ? item.opacity : 1,
        style: item.style || 'urban'
      }));
      setExhibition({ ...data, items: itemsWithZ });
    }
    setLoading(false);
  }

  const handleInception = async () => {
    if (!exhibition || !aiPrompt) return;
    setIsIncepting(true);
    try {
      const result = await generateExhibitionContent(exhibition.context.location, aiPrompt);
      if (result.items) {
        const newItems: Narrative[] = result.items.map((item: any, i: number) => {
          const angle = (i / result.items.length) * Math.PI * 2;
          const radius = 30;
          return {
            id: Date.now() + i,
            title: item.title,
            poet: item.poet,
            content: item.content,
            type: item.type || 'poem',
            style: item.style || 'urban',
            x: 50 + radius * Math.cos(angle),
            y: 50 + radius * Math.sin(angle),
            z: i * 200,
            opacity: item.type === 'mural' ? 0.8 : 1,
            image: item.type === 'mural' 
              ? `https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1000&seed=${i}`
              : `https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1000&seed=${i}`,
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          };
        });
        
        const updatedEx = { ...exhibition, items: [...newItems, ...exhibition.items] };
        setExhibition(updatedEx);
        await handleSave(updatedEx);
        setShowAIModal(false);
        setAiPrompt('');
      }
    } catch (e) {
      console.error(e);
      alert("عذراً، تعذر استنطاق المكان حالياً.");
    } finally {
      setIsIncepting(false);
    }
  };

  const fetchInsights = async () => {
    if (locationInsights || !exhibition) return;
    setLoadingInsights(true);
    try {
      const insights = await getLiteraryInsights(exhibition.context.location, exhibition.context.lat, exhibition.context.lng);
      setLocationInsights(insights);
    } catch (e) {
      console.error("Failed to fetch insights", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const toggleMap = () => {
    const nextState = !showMap;
    setShowMap(nextState);
    if (nextState) fetchInsights();
  };

  const handleSave = async (customExhibition?: Exhibition) => {
    const target = customExhibition || exhibition;
    if (!target) return;
    setSaving(true);
    await db.saveExhibition(target);
    setSaving(false);
  };

  const handleExportJSON = () => {
    if (!exhibition) return;
    const dataStr = JSON.stringify(exhibition, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exhibition.slug || slugify(exhibition.context.name)}-data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!exhibition || role !== 'coordinator') return;
    const updated = { ...exhibition, status: 'published' as const };
    setExhibition(updated);
    await handleSave(updated);
    alert('تم نشر الساحة بنجاح!');
  };

  const reorderNarrative = async (id: number, direction: 'up' | 'down') => {
    if (!exhibition || role !== 'coordinator') return;
    const items = [...exhibition.items];
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const itemA = { ...items[index] };
    const itemB = { ...items[newIndex] };
    
    const tempX = itemA.x;
    const tempY = itemA.y;
    const tempZ = itemA.z;
    
    itemA.x = itemB.x;
    itemA.y = itemB.y;
    itemA.z = itemB.z;
    
    itemB.x = tempX;
    itemB.y = tempY;
    itemB.z = tempZ;

    items[index] = itemB;
    items[newIndex] = itemA;

    const updatedEx = { ...exhibition, items };
    setExhibition(updatedEx);
    if (activeNarrative?.id === id) {
      setActiveNarrative(items[newIndex]);
    }
    await db.saveExhibition(updatedEx);
  };

  const handleUpdateContext = async (newContext: any) => {
    if (!exhibition) return;
    const updated = { ...exhibition, context: { ...exhibition.context, ...newContext } };
    setExhibition(updated);
    await handleSave(updated);
    setShowContextModal(false);
  };

  const addNewItem = (type: 'poem' | 'mural') => {
    if (!exhibition || !isEditorMode) return;
    const newItem: Narrative = {
      id: Date.now(),
      title: type === 'poem' ? "قصيدة جديدة" : "رسم جداري",
      poet: role === 'coordinator' ? "المنسق" : "الفنان",
      image: type === 'poem' 
        ? "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1000"
        : "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1000",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      content: type === 'poem' ? "بانتظار وحي الشاعر..." : "صوت الشارع هنا...",
      x: 50,
      y: 50,
      z: 0,
      opacity: type === 'mural' ? 0.7 : 1,
      type: type,
      style: type === 'mural' ? 'urban' : undefined
    };
    const updatedEx = { ...exhibition, items: [newItem, ...exhibition.items] };
    setExhibition(updatedEx);
    handleSave(updatedEx);
  };

  const deleteNarrative = (id: number) => {
    if (!exhibition || role === 'visitor') return;
    const updatedEx = {
      ...exhibition,
      items: exhibition.items.filter(i => i.id !== id)
    };
    setExhibition(updatedEx);
    handleSave(updatedEx);
  };

  const applyGeometry = (type: LayoutType) => {
    if (!exhibition || role !== 'coordinator') return;
    const items = [...exhibition.items];
    const total = items.length;
    items.forEach((item, i) => {
      if (type === 'sphere') {
        const phi = Math.acos(-1 + (2 * i) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        item.x = 50 + 40 * Math.sin(phi) * Math.cos(theta);
        item.y = 50 + 40 * Math.sin(phi) * Math.sin(theta);
        item.z = 40 * Math.cos(phi) * 15;
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
    const updatedEx = { ...exhibition, items };
    setExhibition(updatedEx);
    handleSave(updatedEx);
  };

  const openNarrative = (item: Narrative) => {
    if (isPhotoMode || showAIModal) return;
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

  const handleManualClose = () => {
    if (exhibition) {
      onClose(exhibition.context.name, role);
    }
  };

  const publicUrl = exhibition ? `${window.location.origin}${window.location.pathname}?ex=${exhibition.slug || exhibition.id}` : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}&bgcolor=1c1917&color=ffffff`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      
      {!isPhotoMode && (
        <div className="fixed top-8 left-8 right-8 z-[120] pointer-events-none flex items-center justify-between">
          <div className="pointer-events-auto flex items-center gap-4 bg-stone-900/80 backdrop-blur-3xl p-3 rounded-full border border-white/10 shadow-3xl">
            <button onClick={handleManualClose} className="p-4 bg-stone-800 hover:bg-red-600 rounded-full text-white transition-all active:scale-90" title="العودة"><ArrowLeft size={18}/></button>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="px-4">
               <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">
                 {role === 'coordinator' ? 'المنسق' : role === 'editor' ? 'المحرر' : 'الزائر'}
               </h4>
               <span className="text-sm font-bold block leading-none text-stone-200">
                 {exhibition?.context.name}
               </span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <button 
              onClick={toggleMap} 
              className={`p-4 rounded-full transition-all flex items-center justify-center ${showMap ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-stone-800 text-stone-400 hover:text-blue-500'}`}
              title="موقع الساحة"
            >
              <MapIcon size={18}/>
            </button>
            
            {role === 'visitor' && (
              <button 
                onClick={() => setViewMode(viewMode === 'stars' ? 'cards' : 'stars')} 
                className={`p-4 rounded-full transition-all flex items-center justify-center ${viewMode === 'cards' ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)]' : 'bg-stone-800 text-stone-400 hover:text-amber-500'}`}
                title={viewMode === 'stars' ? 'عرض اللوحات' : 'عرض النجوم'}
              >
                {viewMode === 'stars' ? <LayoutGrid size={18}/> : <Star size={18}/>}
              </button>
            )}

            <button 
              onClick={() => setShowPublishModal(true)} 
              className="p-4 bg-stone-800 hover:bg-blue-600 rounded-full text-stone-400 hover:text-white transition-all flex items-center justify-center"
              title="مشاركة الساحة"
            >
              <Share2 size={18}/>
            </button>
            {role === 'visitor' && (
              <button 
                onClick={() => setIsPhotoMode(true)} 
                className="p-4 bg-stone-800 hover:bg-white hover:text-black rounded-full text-stone-400 transition-all flex items-center gap-2 group"
                title="وضع التصوير"
              >
                <Camera size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">وضع السيلفي</span>
              </button>
            )}
          </div>

          {isEditorMode && (
            <div className="pointer-events-auto flex items-center gap-3">
               <button 
                  onClick={() => setShowToolsPanel(!showToolsPanel)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-3xl border-2 active:scale-90 ${showToolsPanel ? 'bg-amber-600 border-amber-400 text-white' : 'bg-stone-900 border-white/10 text-stone-400 hover:text-white hover:border-blue-500/50'}`}
               >
                  {showToolsPanel ? <X size={24}/> : <Wand2 size={24}/>}
               </button>
            </div>
          )}
        </div>
      )}

      {isEditorMode && (
        <div 
          className={`fixed right-8 top-32 z-[130] w-80 transition-all duration-500 ease-out transform ${showToolsPanel ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-20 opacity-0 scale-90 pointer-events-none'}`}
        >
          <div className="bg-stone-900/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col gap-10">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === 'coordinator' ? 'bg-amber-600/20 text-amber-500' : 'bg-blue-600/20 text-blue-500'}`}>
                    <Box size={20} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">حقيبة الأدوات</h5>
                    <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">{role === 'coordinator' ? 'صلاحيات كاملة' : 'صلاحيات المحرر'}</p>
                  </div>
               </div>
               <button onClick={() => setShowToolsPanel(false)} className="text-stone-600 hover:text-white transition-colors">
                 <X size={16} />
               </button>
            </div>

            {role === 'coordinator' && (
              <div className="space-y-4">
                 <span className="text-[8px] font-black text-amber-500 uppercase tracking-[0.3em] mr-2">ذكاء المكان</span>
                 <button 
                    onClick={() => { setShowAIModal(true); setShowToolsPanel(false); }}
                    className="w-full py-4 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-500/20 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                 >
                    <Zap size={18} className="group-hover:animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">استبصار سردي (AI)</span>
                 </button>
              </div>
            )}

            <div className="space-y-4">
              <span className="text-[8px] font-black text-stone-600 uppercase tracking-[0.3em] mr-2">إضافة عناصر</span>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => addNewItem('poem')}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 rounded-2xl text-stone-400 hover:text-white transition-all group"
                >
                  <Type size={20} className="group-hover:scale-110 transition-transform"/>
                  <span className="text-[9px] font-black uppercase">قصيدة</span>
                </button>
                <button 
                  onClick={() => addNewItem('mural')}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 rounded-2xl text-stone-400 hover:text-white transition-all group"
                >
                  <Palette size={20} className="group-hover:scale-110 transition-transform"/>
                  <span className="text-[9px] font-black uppercase">جدارية</span>
                </button>
              </div>
            </div>

            {role === 'coordinator' && (
              <div className="space-y-4">
                <span className="text-[8px] font-black text-stone-600 uppercase tracking-[0.3em] mr-2">الهندسة الفراغية</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: 'sphere', icon: <Globe size={16}/>, label: 'كروي' },
                    { type: 'linear', icon: <AlignLeft size={16}/>, label: 'خطي' },
                    { type: 'square', icon: <LayoutGrid size={16}/>, label: 'مربع' },
                    { type: 'random', icon: <Shuffle size={16}/>, label: 'عشوائي' }
                  ].map((geo) => (
                    <button 
                      key={geo.type}
                      onClick={() => applyGeometry(geo.type as LayoutType)}
                      className="p-3 bg-white/5 hover:bg-amber-600/20 border border-white/5 hover:border-amber-500/30 rounded-xl text-stone-500 hover:text-amber-500 transition-all flex items-center justify-center"
                      title={geo.label}
                    >
                      {geo.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <span className="text-[8px] font-black text-stone-600 uppercase tracking-[0.3em] mr-2">نمط العرض</span>
              <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setViewMode('stars')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl transition-all ${viewMode === 'stars' ? 'bg-white/10 text-white shadow-lg' : 'text-stone-600 hover:text-stone-400'}`}
                >
                  <Star size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">نجوم</span>
                </button>
                <button 
                  onClick={() => setViewMode('cards')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-white/10 text-white shadow-lg' : 'text-stone-600 hover:text-stone-400'}`}
                >
                  <LayoutGrid size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">لوحات</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
              {role === 'coordinator' && exhibition?.status !== 'published' && (
                <button 
                  onClick={handlePublish}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-900/40"
                >
                  <Rocket size={16}/>
                  <span>نشر الساحة للعموم</span>
                </button>
              )}
              
              <button 
                onClick={() => handleSave()}
                disabled={saving}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/40"
              >
                {saving ? <RotateCcw className="animate-spin" size={16}/> : <SaveAll size={16}/>}
                <span>{saving ? 'جاري الحفظ...' : 'حفظ حالة الساحة'}</span>
              </button>

              {role === 'coordinator' && (
                <button 
                  onClick={handleExportJSON}
                  className="w-full py-4 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"
                >
                  <Download size={14} />
                  <span>تصدير البيانات (JSON)</span>
                </button>
              )}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowContextModal(true)}
                  className="flex-1 py-4 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all"
                >
                  إرساء الساحة
                </button>
                <button 
                  onClick={() => setScrollDepth(0)}
                  className="px-4 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-2xl transition-all"
                  title="تصفير العمق"
                >
                  <Maximize size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main 
        ref={containerRef}
        className={`flex-1 relative overflow-hidden bg-black ${isPhotoMode ? 'cursor-none' : ''}`}
      >
        <div className="absolute inset-0">
          <PoetryBabylonStage
            items={exhibition?.items || []}
            role={role}
            onSelectItem={openNarrative}
            selectedId={activeNarrative?.id}
            scrollDepth={scrollDepth}
            mouseTilt={mouseTilt}
            onUpdateItem={(id, x, y, z) => {
              if (!exhibition) return;
              const updated = { ...exhibition, items: exhibition.items.map(i => i.id === id ? {...i, x, y, z} : i) };
              setExhibition(updated);
            }}
            isBlurred={isPopUpActive || showMap || showPublishModal || showContextModal || showAIModal}
            viewMode={viewMode}
          />
        </div>
      </main>

      {/* AI Inception Modal */}
      {showAIModal && exhibition && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="max-w-2xl w-full bg-stone-900 border border-white/10 rounded-[4rem] p-12 space-y-10 shadow-3xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent)]"></div>
              <button onClick={() => setShowAIModal(false)} className="absolute top-8 right-8 text-stone-500 hover:text-white transition-colors z-20"><X size={24}/></button>
              
              <div className="space-y-6 relative z-10">
                 <div className={`w-20 h-20 bg-amber-600/10 mx-auto rounded-3xl flex items-center justify-center border border-amber-500/20 shadow-2xl ${isIncepting ? 'animate-pulse scale-110' : ''}`}>
                    <Zap className="text-amber-500" size={40} />
                 </div>
                 <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">استبصار سردي للمكان</h3>
                 <p className="text-stone-500 text-sm font-bold uppercase tracking-widest max-w-sm mx-auto">صف رؤيتك لقرية {exhibition.context.location} وسيقوم Gemini بتوليد المعرض كاملاً</p>
              </div>

              <div className="relative z-10">
                 <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="مثال: أريد شعارات جرافيتي عن الحرية وقصائد تحكي تاريخ الزيتون في هذه الساحة..."
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-white font-amiri text-2xl outline-none focus:border-amber-500 transition-all resize-none shadow-inner"
                 />
              </div>

              <button 
                onClick={handleInception}
                disabled={isIncepting || !aiPrompt}
                className={`w-full py-7 rounded-3xl font-black text-2xl flex items-center justify-center gap-4 transition-all active:scale-95 relative z-10 overflow-hidden ${isIncepting ? 'bg-amber-900/40 text-amber-500' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-2xl shadow-amber-900/40'}`}
              >
                {isIncepting ? (
                   <>
                    <RotateCcw className="animate-spin" size={24} />
                    <span>جاري استنطاق المكان...</span>
                   </>
                ) : (
                   <>
                    <Sparkle size={24} />
                    <span>تفعيل المحاكاة السردية</span>
                   </>
                )}
              </button>
           </div>
        </div>
      )}

      {/* Floating Mini-Map Toggle (Bottom-Right) */}
      {!isPhotoMode && !isPopUpActive && (
        <div className="fixed bottom-10 right-10 z-[120]">
           <button 
            onClick={toggleMap}
            className={`flex items-center gap-4 px-6 py-4 bg-stone-900/80 backdrop-blur-2xl rounded-full border border-white/10 shadow-3xl transition-all hover:scale-105 active:scale-95 group ${showMap ? 'border-blue-500/50' : ''}`}
           >
              <div className={`p-2 rounded-xl transition-colors ${showMap ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-400 group-hover:text-blue-500'}`}>
                <Compass size={20} className={showMap ? 'animate-spin-slow' : ''} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">خرائط الساحة</span>
           </button>
        </div>
      )}

      {/* Map Experience Modal */}
      {showMap && exhibition?.context.lat && exhibition?.context.lng && (
        <ExhibitionMap 
          lat={exhibition.context.lat} 
          lng={exhibition.context.lng} 
          name={exhibition.context.name} 
          insights={locationInsights}
          loadingInsights={loadingInsights}
          onClose={() => setShowMap(false)} 
        />
      )}

      {showPublishModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="max-w-md w-full bg-stone-900 border border-white/10 rounded-[4rem] p-12 text-center space-y-10 shadow-3xl relative">
              <button onClick={() => setShowPublishModal(false)} className="absolute top-8 right-8 text-stone-500 hover:text-white transition-colors"><X size={20}/></button>
              
              <div className="space-y-4">
                 <div className="w-16 h-16 bg-blue-600/10 mx-auto rounded-3xl flex items-center justify-center border border-blue-500/20 mb-4">
                    <QrCode className="text-blue-500" size={32} />
                 </div>
                 <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">شارك هذه الساحة</h3>
                 <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">امسح الرمز أو انسخ الرابط لدعوة الآخرين</p>
              </div>

              <div className="p-8 bg-stone-950 rounded-[3rem] border border-white/5 flex flex-col items-center gap-6">
                 <img src={qrUrl} alt="QR Code" className="w-full aspect-square rounded-2xl shadow-2xl border border-white/10" />
                 <div className="w-full flex items-center gap-3 bg-black/40 border border-white/5 p-4 rounded-2xl">
                    <Link size={14} className="text-stone-700 shrink-0" />
                    <span className="text-[10px] font-mono text-stone-400 truncate text-left dir-ltr flex-1">{publicUrl}</span>
                 </div>
              </div>

              <button 
                onClick={copyLink} 
                className={`w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-95 ${copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {copied ? <Check size={24}/> : <Copy size={24}/>}
                <span>{copied ? 'تم النسخ' : 'نسخ رابط الساحة'}</span>
              </button>
           </div>
        </div>
      )}

      {isPopUpActive && activeNarrative && (
        <MediaOverlay 
          item={activeNarrative} 
          onClose={closeNarrative} 
          role={role}
          totalItems={exhibition?.items.length || 0}
          currentIndex={exhibition?.items.findIndex(i => i.id === activeNarrative.id) || 0}
          onReorder={role === 'coordinator' ? reorderNarrative : undefined}
          onUpdate={async (updated) => {
             const newItems = exhibition!.items.map(i => i.id === updated.id ? updated : i);
             const updatedExhibition = { ...exhibition!, items: newItems };
             setExhibition(updatedExhibition);
             if (isEditorMode) await db.saveExhibition(updatedExhibition);
          }}
          onDelete={isEditorMode ? deleteNarrative : undefined}
        />
      )}

      {showContextModal && exhibition && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="max-w-2xl w-full bg-stone-900 border border-white/10 rounded-[4rem] p-12 space-y-10 shadow-3xl">
             <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                <div className="p-5 bg-amber-600 rounded-3xl text-white shadow-xl">
                   <Settings2 size={32}/>
                </div>
                <div>
                   <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-1">إرساء الساحة</h3>
                </div>
             </div>
             <div className="pt-6 border-t border-white/5 flex gap-4">
                <button onClick={() => setShowContextModal(false)} className="flex-1 py-6 bg-emerald-600 text-white rounded-3xl font-black text-xl">حفظ وإغلاق</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

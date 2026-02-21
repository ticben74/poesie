
import React, { useState, useEffect } from 'react';
import { Poem } from '../types';
import { 
  X, Save, Edit, Share2, Volume2, Image as ImageIcon, Wand2, 
  Sparkles, RotateCcw, Eye, Music, Trash2, Type, Sliders, PenTool, 
  Check, Palette, Zap, Download, Move, User, 
  FileText, Brush, History, Ghost, ChevronUp, ChevronDown, Hash
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface MediaOverlayProps {
  item: Poem;
  onClose: () => void;
  role: 'visitor' | 'editor' | 'coordinator';
  totalItems?: number;
  currentIndex?: number;
  onUpdate?: (updated: Poem) => Promise<void> | void;
  onDelete?: (id: number) => void;
  onReorder?: (id: number, direction: 'up' | 'down') => Promise<void> | void;
}

export const MediaOverlay: React.FC<MediaOverlayProps> = ({ 
  item, 
  onClose, 
  role, 
  onUpdate, 
  onDelete, 
  onReorder,
  totalItems = 0,
  currentIndex = 0
}) => {
  const isAuthorized = role === 'editor' || role === 'coordinator';
  const isCoordinator = role === 'coordinator';
  const isMural = item.type === 'mural';
  
  const [editData, setEditData] = useState<Poem>({
    ...item,
    opacity: item.opacity ?? (isMural ? 0.8 : 1),
    style: item.style || 'urban',
    x: item.x,
    y: item.y,
    z: item.z || 0
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setEditData({ 
      ...item, 
      opacity: item.opacity ?? (item.type === 'mural' ? 0.8 : 1),
      style: item.style || (item.type === 'mural' ? 'urban' : undefined),
      x: item.x,
      y: item.y,
      z: item.z || 0
    });
  }, [item]);

  const handleManualSave = async () => {
    if (onUpdate) {
      setSaveStatus('saving');
      try {
        await onUpdate(editData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        if (role === 'visitor') onClose();
      } catch (e) {
        console.error("Save error:", e);
        setSaveStatus('idle');
        alert('حدث خطأ أثناء محاولة الحفظ.');
      }
    }
  };

  const handleAIUrbanSlogan = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = editData.type === 'mural' 
        ? `حول هذه العبارة إلى شعار جرافيتي قصير جداً ومتمرد باللهجة التونسية: "${editData.content || editData.title}". أعد لي الشعار فقط بدون مقدمات.`
        : `أكمل أو حسن هذه الأبيات الشعرية بأسلوب بليغ: "${editData.content}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      if (response.text) {
        setEditData(prev => ({ ...prev, content: response.text.trim() }));
      }
    } catch (e) {
      alert('عطل في معالجة النص عبر الذكاء الاصطناعي.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    try {
      const imageUrl = editData.image || item.image;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${editData.title || 'art-piece'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('لا يمكن تحميل هذه الصورة مباشرة بسبب قيود الحماية.');
    }
  };

  const handleDownloadText = () => {
    const content = editData.content || '';
    const title = editData.title || 'poetry';
    const poet = editData.poet || '';
    const textBlob = new Blob([`${title}\nبكلمات: ${poet}\n\n${content}`], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(textBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getMuralStyle = (style?: string) => {
    switch(style) {
      case 'stencil': 
        return { 
          filter: 'contrast(2) brightness(0.8) grayscale(1)', 
          textShadow: '2px 2px 0px #000',
          blendMode: 'mix-blend-multiply' as any
        };
      case 'neon': 
        return { 
          filter: 'hue-rotate(90deg) brightness(1.5) saturate(2)', 
          textShadow: '0 0 20px #60a5fa, 0 0 40px #60a5fa',
          blendMode: 'mix-blend-screen' as any
        };
      case 'ancient': 
        return { 
          filter: 'sepia(0.8) contrast(0.9) brightness(1.1)', 
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          blendMode: 'mix-blend-overlay' as any
        };
      default: // urban
        return { 
          filter: 'contrast(1.2) brightness(1.1) grayscale(0.2)', 
          textShadow: '0 0 15px rgba(168,85,247,0.8)',
          blendMode: 'mix-blend-screen' as any
        };
    }
  };

  if (role === 'visitor') {
    const visual = isMural ? getMuralStyle(item.style) : null;
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-700">
        <div className="absolute top-10 right-10 flex gap-4">
          <button onClick={handleDownloadText} className="p-5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/10 active:scale-90 shadow-2xl group" title="تحميل النص">
            <FileText size={28} />
          </button>
          <button onClick={handleDownloadImage} className="p-5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/10 active:scale-90 shadow-2xl group" title="تحميل الصورة">
            <Download size={28} />
          </button>
          <button onClick={onClose} className="p-5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/10 active:scale-90 shadow-2xl group" title="إغلاق">
            <X size={28} />
          </button>
        </div>

        <div className="max-w-4xl w-full text-center space-y-12 animate-in slide-in-from-bottom-12 duration-1000">
           <div className="space-y-4">
              <span className={`text-sm font-black uppercase tracking-[0.5em] block animate-pulse ${isMural ? 'text-purple-500' : 'text-blue-500'}`}>
                {isMural ? `بصمة جدارية (${item.style})` : 'صدى فضائي'}
              </span>
              <h1 className={`text-5xl md:text-8xl font-black text-white leading-tight tracking-tighter ${isMural ? 'italic rotate-[-1deg]' : ''}`} style={visual?.textShadow ? { textShadow: visual.textShadow } : {}}>
                {item.title}
              </h1>
              <p className="text-stone-500 text-xl font-bold uppercase tracking-widest">{item.poet}</p>
           </div>
           <p className={`text-white font-amiri leading-[1.8] whitespace-pre-line tracking-wide ${isMural ? 'text-4xl md:text-7xl font-black uppercase' : 'text-3xl md:text-5xl italic'}`} style={visual?.textShadow ? { textShadow: visual.textShadow } : {}}>
             {item.content}
           </p>
        </div>
        <div className="absolute inset-0 -z-10 cursor-zoom-out" onClick={onClose}></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-[40px] animate-in fade-in duration-500">
      <div className="relative max-w-[95vw] w-full flex flex-col md:flex-row bg-stone-900 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_80px_150px_rgba(0,0,0,1)] border border-white/10 h-[92vh]">
        
        <div className="absolute top-6 left-6 z-50 flex gap-3">
          <button onClick={onClose} className="p-4 bg-black/60 hover:bg-red-600 rounded-2xl text-white transition-all border border-white/10 active:scale-90 shadow-2xl group">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 flex-col md:flex-row h-full overflow-hidden">
          <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-stone-950/40 border-r border-white/5 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-12 pb-12">
              
              <div className="flex items-center gap-6">
                <div className={`p-5 border rounded-3xl ${editData.type === 'mural' ? 'bg-purple-600/10 border-purple-500/20 text-purple-500' : 'bg-blue-600/10 border-blue-500/20 text-blue-500'}`}>
                  {editData.type === 'mural' ? <Palette size={32}/> : <PenTool size={32}/>}
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-1">
                    لوحة التحكّم
                  </h2>
                  <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">تعديل الوسائط والسرديات</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-4">
                   <button 
                    onClick={() => setEditData({...editData, type: 'poem'})} 
                    className={`p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 ${editData.type === 'poem' ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105' : 'bg-stone-900 border-white/5 text-stone-500'}`}
                   >
                     <Type size={14} /> <span>قصيدة</span>
                   </button>
                   <button 
                    onClick={() => setEditData({...editData, type: 'mural'})} 
                    className={`p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 ${editData.type === 'mural' ? 'bg-purple-600 border-purple-400 text-white shadow-xl scale-105' : 'bg-stone-900 border-white/5 text-stone-500'}`}
                   >
                     <Palette size={14} /> <span>جدارية</span>
                   </button>
                </div>

                {editData.type === 'mural' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
                    <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest mr-4">نمط الرسم الجداري</label>
                    <div className="grid grid-cols-4 gap-3 bg-black/40 p-3 rounded-[2rem] border border-white/5">
                      {[
                        { id: 'urban', icon: <Brush size={14}/>, label: 'Urban' },
                        { id: 'stencil', icon: <Ghost size={14}/>, label: 'Stencil' },
                        { id: 'neon', icon: <Sparkles size={14}/>, label: 'Neon' },
                        { id: 'ancient', icon: <History size={14}/>, label: 'Ancient' }
                      ].map((s) => (
                        <button 
                          key={s.id}
                          onClick={() => setEditData({...editData, style: s.id as any})}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${editData.style === s.id ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-lg' : 'bg-transparent border-transparent text-stone-600 hover:text-stone-400'}`}
                        >
                          {s.icon}
                          <span className="text-[8px] font-black uppercase tracking-widest">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest mr-4">عنوان النقطة</label>
                    <div className="relative">
                      <Edit className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-700" size={16} />
                      <input 
                        type="text" 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-amber-500 transition-all"
                        value={editData.title}
                        onChange={e => setEditData({...editData, title: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest mr-4">الشاعر / الفنان</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-700" size={16} />
                      <input 
                        type="text" 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-amber-500 transition-all"
                        value={editData.poet}
                        onChange={e => setEditData({...editData, poet: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-stone-900/40 p-8 rounded-[2.5rem] border border-white/5">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest">رابط الصورة (URL)</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-700" size={16} />
                          <input 
                            type="text" 
                            className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-stone-400 font-mono text-xs outline-none focus:border-blue-500 transition-all"
                            value={editData.image}
                            onChange={e => setEditData({...editData, image: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest">رابط الصوت (MP3 URL)</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-700" size={16} />
                          <input 
                            type="text" 
                            className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-stone-400 font-mono text-xs outline-none focus:border-blue-500 transition-all"
                            value={editData.audioUrl}
                            onChange={e => setEditData({...editData, audioUrl: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest mr-4">المحتوى السردي (الشعر)</label>
                    <button 
                      onClick={handleDownloadText}
                      className="flex items-center gap-2 text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10"
                    >
                      <FileText size={12} />
                      <span>تحميل النص</span>
                    </button>
                  </div>
                  <div className="relative">
                    <textarea 
                      rows={5}
                      className={`w-full bg-stone-900 border border-white/10 rounded-[2.5rem] p-10 text-stone-100 outline-none focus:bg-stone-800 transition-all resize-none shadow-2xl ${editData.type === 'mural' ? 'font-black uppercase italic text-3xl' : 'font-amiri leading-[1.8] text-2xl'}`}
                      value={editData.content}
                      onChange={e => setEditData({...editData, content: e.target.value})}
                    />
                    <button 
                      onClick={handleAIUrbanSlogan} 
                      disabled={isGenerating} 
                      className="absolute bottom-8 left-8 p-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white shadow-xl transition-all active:scale-90 disabled:opacity-50"
                      title="تحسين بالذكاء الاصطناعي"
                    >
                      {isGenerating ? <RotateCcw className="animate-spin" size={20}/> : <Zap size={20}/>}
                    </button>
                  </div>
                </div>

                {isCoordinator && (
                  <div className="bg-amber-600/5 p-8 rounded-[3rem] border border-amber-500/10 space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                         <Move size={14}/>
                         <span>التنصيب الفراغي الدقيق</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <label className="text-[9px] text-stone-600 uppercase">الشفافية</label>
                          <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={editData.opacity} 
                            onChange={e => setEditData({...editData, opacity: parseFloat(e.target.value)})}
                            className="w-24 accent-amber-500"
                          />
                       </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] text-stone-700 uppercase font-black text-center block">X (أفقي)</label>
                        <input type="number" step="1" value={Math.round(editData.x)} onChange={e => setEditData({...editData, x: parseInt(e.target.value)})} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-mono text-center text-lg"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] text-stone-700 uppercase font-black text-center block">Y (رأسي)</label>
                        <input type="number" step="1" value={Math.round(editData.y)} onChange={e => setEditData({...editData, y: parseInt(e.target.value)})} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-mono text-center text-lg"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] text-stone-700 uppercase font-black text-center block">Z (عمق)</label>
                        <input type="number" step="10" value={Math.round(editData.z || 0)} onChange={e => setEditData({...editData, z: parseInt(e.target.value)})} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-mono text-center text-lg text-amber-500"/>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleManualSave} 
                  disabled={saveStatus === 'saving'}
                  className={`flex-[2] py-8 rounded-[2.5rem] text-white font-black text-2xl flex items-center justify-center gap-4 transition-all shadow-3xl active:scale-95 ${editData.type === 'mural' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                  {saveStatus === 'saving' ? <RotateCcw className="animate-spin" /> : <Check size={28}/>}
                  <span>{saveStatus === 'saved' ? 'تم التثبيت بنجاح' : 'تثبيت التعديلات'}</span>
                </button>
                
                {onDelete && (
                  <button 
                    onClick={() => { if(confirm('هل تريد حذف هذه النقطة نهائياً من الساحة؟')) { onDelete(item.id); onClose(); } }}
                    className="flex-1 py-8 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-[2.5rem] font-black transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={24}/>
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-[450px] bg-black p-10 flex flex-col border-l border-white/5 overflow-y-auto custom-scrollbar">
             <div className="flex flex-col items-center gap-8 py-10">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-600">معاينة المحاكاة</span>
                
                <div className="relative w-full aspect-[3/4.5] rounded-[4rem] overflow-hidden border border-white/10 bg-stone-950 shadow-2xl flex items-center justify-center group">
                   <img 
                    src={editData.image} 
                    className={`w-full h-full object-cover transition-all duration-700`} 
                    style={{
                      opacity: editData.type === 'mural' ? 0.6 : 0.4,
                      ... (editData.type === 'mural' ? getMuralStyle(editData.style) : {})
                    }}
                   />
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                      <h4 
                        className={`text-white transition-all duration-500 ${editData.type === 'mural' ? 'text-4xl font-black italic rotate-[-2deg] leading-tight' : 'text-2xl font-bold italic font-amiri'}`}
                        style={editData.type === 'mural' ? { textShadow: getMuralStyle(editData.style).textShadow } : {}}
                      >
                        {editData.content || editData.title}
                      </h4>
                      <p className="mt-4 text-[10px] font-black text-white/40 uppercase tracking-widest">{editData.poet}</p>
                   </div>
                </div>

                {isCoordinator && onReorder && (
                  <div className="w-full bg-amber-600/10 p-6 rounded-[2rem] border border-amber-500/20 space-y-4">
                    <div className="flex items-center gap-3">
                       <Hash className="text-amber-500" size={16} />
                       <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">ترتيب السردية</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 p-2 rounded-2xl">
                       <button 
                        disabled={currentIndex === 0}
                        onClick={() => onReorder(item.id, 'up')}
                        className="p-4 bg-stone-800 hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-stone-800 text-white rounded-xl transition-all active:scale-90"
                       >
                         <ChevronUp size={20} />
                       </button>
                       <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-white">{currentIndex + 1}</span>
                          <span className="text-[8px] font-bold text-stone-500 uppercase">من أصل {totalItems}</span>
                       </div>
                       <button 
                        disabled={currentIndex === totalItems - 1}
                        onClick={() => onReorder(item.id, 'down')}
                        className="p-4 bg-stone-800 hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-stone-800 text-white rounded-xl transition-all active:scale-90"
                       >
                         <ChevronDown size={20} />
                       </button>
                    </div>
                  </div>
                )}

                <div className="w-full bg-stone-900/50 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
                    <Volume2 size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest truncate">{editData.audioUrl.split('/').pop()}</p>
                    <div className="h-1 w-full bg-stone-800 mt-2 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

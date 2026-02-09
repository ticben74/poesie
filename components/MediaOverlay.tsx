
import React, { useState } from 'react';
import { Poem } from '../types';
import { X, Save, Edit, Share2, Volume2, Image as ImageIcon, Languages, Wand2, Sparkles, RotateCcw, Eye, Music, Trash2, Type } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface MediaOverlayProps {
  item: Poem;
  onClose: () => void;
  role: 'visitor' | 'editor' | 'coordinator';
  onUpdate?: (updated: Poem) => void;
  onDelete?: (id: number) => void;
}

export const MediaOverlay: React.FC<MediaOverlayProps> = ({ item, onClose, role, onUpdate, onDelete }) => {
  const isAuthorized = role === 'editor' || role === 'coordinator';
  const [isEditing, setIsEditing] = useState(isAuthorized);
  const [editData, setEditData] = useState<Poem>(item);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentFontSize, setContentFontSize] = useState(24); // القيمة الافتراضية لحجم الخط

  const handleManualSave = () => {
    if (onUpdate) {
      onUpdate(editData);
      if (role === 'visitor') setIsEditing(false);
      else alert('تم حفظ القصيدة في ديوان المدينة.');
    }
  };

  const handleAIFormalization = async () => {
    if (!editData.title || editData.title === "قصيدة جديدة") {
      alert("يرجى وضع عنوان للقصيدة ليتمكن المساعد من اقتراح أبيات مناسبة.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `بصفتك شاعراً عربياً قديراً، اكتب بيتين من الشعر الفصيح يمثلان روح قصيدة بعنوان "${editData.title}". ركز على الصور الجمالية والبلاغة.`,
      });
      if (response.text) {
        setEditData(prev => ({ ...prev, content: response.text.trim() }));
      }
    } catch (e) {
      alert('حدث عطل في المساعد الشعري.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Visitor View: Floating text without a solid background
  if (role === 'visitor') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-700">
        <div className="absolute top-10 right-10">
          <button onClick={onClose} className="p-5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/10 active:scale-90 shadow-2xl">
            <X size={28}/>
          </button>
        </div>

        <div className="max-w-4xl w-full text-center space-y-12 animate-in slide-in-from-bottom-12 duration-1000">
           <div className="space-y-4">
              <span className="text-blue-500 text-sm font-black uppercase tracking-[0.5em] block animate-pulse">صدى من ديوان الفضاء</span>
              <h1 className="text-5xl md:text-8xl font-black text-white leading-tight tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{item.title}</h1>
              <p className="text-stone-400 text-2xl font-amiri italic">للشاعر: {item.poet}</p>
           </div>

           <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mx-auto"></div>

           <div className="relative">
              <p className="text-white text-3xl md:text-5xl font-amiri italic leading-[1.8] whitespace-pre-line tracking-wide drop-shadow-2xl">
                {item.content}
              </p>
           </div>

           <div className="pt-12 flex flex-col items-center gap-6">
              <div className="flex items-center gap-6 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                 <div className="p-5 bg-blue-600 rounded-2xl text-white animate-bounce-slow">
                   <Volume2 size={32}/>
                 </div>
                 <div className="text-right">
                    <p className="text-white font-bold text-xl leading-none">إلقاء مباشر</p>
                    <p className="text-stone-500 text-[10px] uppercase tracking-widest mt-2">استمع لروح القصيدة</p>
                 </div>
              </div>
              <span className="text-stone-600 text-[10px] font-black uppercase tracking-[0.5em]">انقر في أي مكان للإغلاق</span>
           </div>
        </div>

        {/* Global close interaction */}
        <div className="absolute inset-0 -z-10 cursor-zoom-out" onClick={onClose}></div>
      </div>
    );
  }

  // Editor/Coordinator View: Structured studio interface
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-black/98 backdrop-blur-[60px] animate-in fade-in duration-500">
      <div className="relative max-w-[95vw] w-full flex flex-col md:flex-row bg-stone-900 rounded-[4rem] overflow-hidden shadow-[0_80px_150px_rgba(0,0,0,1)] border border-white/10 h-[90vh]">
        
        <div className="absolute top-8 left-8 z-50 flex gap-4">
          <button onClick={onClose} className="p-4 bg-black/60 hover:bg-red-600 rounded-2xl text-white transition-all border border-white/10 active:scale-90 shadow-2xl"><X size={24}/></button>
          {role === 'editor' && onDelete && (
            <button 
              onClick={() => { if(window.confirm('حذف نهائي؟')) { onDelete(item.id); onClose(); } }} 
              className="p-4 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 active:scale-90"
            >
              <Trash2 size={24}/>
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col md:flex-row h-full overflow-hidden">
          <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-stone-950/50 border-r border-white/5 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-10">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-blue-600 rounded-xl text-white"><Languages size={20}/></div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">استوديو الشاعر</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mr-2">مطلع القصيدة / العنوان</label>
                  <input 
                    type="text" 
                    className="w-full bg-stone-900 border border-white/10 rounded-2xl p-6 text-blue-500 font-bold text-2xl outline-none focus:border-blue-500 transition-all"
                    value={editData.title}
                    onChange={e => setEditData({...editData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1 px-2">
                    <div className="flex items-center gap-4">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">أبيات القصيدة</label>
                      <div className="flex items-center gap-3 bg-stone-900/50 px-3 py-1.5 rounded-xl border border-white/5">
                        <Type size={14} className="text-stone-500" />
                        <input 
                          type="range" 
                          min="14" 
                          max="64" 
                          value={contentFontSize} 
                          onChange={(e) => setContentFontSize(parseInt(e.target.value))}
                          className="w-24 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-[10px] font-bold text-stone-400 w-6">{contentFontSize}</span>
                      </div>
                    </div>
                    <button onClick={handleAIFormalization} disabled={isGenerating} className="text-[10px] font-black text-blue-400 hover:text-white flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-lg transition-all">
                      {isGenerating ? <RotateCcw className="animate-spin" size={12}/> : <Wand2 size={12}/>}
                      المساعد الشعري
                    </button>
                  </div>
                  <textarea 
                    rows={5}
                    className="w-full bg-stone-900 border border-white/10 rounded-2xl p-6 text-stone-300 font-amiri leading-relaxed outline-none focus:border-blue-500 transition-all resize-none"
                    style={{ fontSize: `${contentFontSize}px` }}
                    value={editData.content}
                    onChange={e => setEditData({...editData, content: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mr-2">اسم الشاعر</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-900 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all"
                      value={editData.poet}
                      onChange={e => setEditData({...editData, poet: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mr-2">رابط الإلقاء الصوتي</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-900 border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/50 outline-none focus:border-blue-500 transition-all"
                      value={editData.audioUrl}
                      onChange={e => setEditData({...editData, audioUrl: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button onClick={handleManualSave} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl text-white font-black text-xl flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95">
                <Save size={24}/> إرساء القصيدة في الفضاء
              </button>
            </div>
          </div>

          <div className="w-full md:w-[450px] bg-black p-8 flex flex-col border-l border-white/5">
             <div className="flex items-center justify-between mb-8 opacity-40">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">معاينة الزائر</span>
                <Eye size={16}/>
             </div>
             <div className="flex-1 flex flex-col rounded-[2.5rem] overflow-hidden border border-white/5 bg-stone-900 shadow-3xl">
                <div className="h-1/2 relative">
                  <img src={editData.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent"></div>
                </div>
                <div className="p-8 space-y-4 text-center">
                  <h3 className="text-2xl font-black text-white leading-tight">{editData.title}</h3>
                  <p className="text-stone-500 font-amiri text-lg italic leading-relaxed">{editData.content}</p>
                  <p className="text-blue-500 font-bold text-xs">بصوت الشاعر</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

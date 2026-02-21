
import React, { useState } from 'react';
import { X, MapPin, Compass, Globe, Info, Sparkles, ExternalLink, RotateCcw } from 'lucide-react';

interface ExhibitionMapProps {
  lat: number;
  lng: number;
  name: string;
  insights?: { text: string; sources: any[] } | null;
  loadingInsights?: boolean;
  onClose: () => void;
}

export const ExhibitionMap: React.FC<ExhibitionMapProps> = ({ lat, lng, name, insights, loadingInsights, onClose }) => {
  const [mapType, setMapType] = useState<'k' | 'm'>('k'); // k for satellite, m for map

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-[60px] animate-in fade-in zoom-in duration-500">
      <div className="relative w-full max-w-7xl h-[85vh] bg-stone-900/40 rounded-[4rem] border border-white/10 overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,1)] flex flex-col md:flex-row">
        
        {/* Immersive Map Area */}
        <div className="flex-1 relative bg-black group">
          <iframe
            title={`Map of ${name}`}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0, filter: 'contrast(1.1) brightness(0.9) saturate(1.2)' }}
            src={`https://www.google.com/maps?q=${lat},${lng}&hl=ar&z=17&t=${mapType}&output=embed`}
            allowFullScreen
          ></iframe>
          
          {/* Map Controls */}
          <div className="absolute top-8 left-8 flex flex-col gap-4">
            <button 
              onClick={() => setMapType(mapType === 'k' ? 'm' : 'k')}
              className="p-4 bg-stone-900/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-3 group"
            >
              <div className={`p-2 rounded-lg transition-colors ${mapType === 'k' ? 'bg-amber-600' : 'bg-blue-600'}`}>
                {mapType === 'k' ? <Globe size={18}/> : <MapPin size={18}/>}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">تبديل الرؤية</span>
            </button>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-stone-900/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-3 group"
            >
              <div className="p-2 rounded-lg bg-stone-800 text-stone-400 group-hover:text-blue-500 transition-colors">
                <ExternalLink size={18}/>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">خرائط Google</span>
            </a>
          </div>

          {/* Pulse Marker Indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
             <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 bg-amber-500 rounded-full animate-ping opacity-75"></div>
                <div className="absolute w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)]"></div>
             </div>
          </div>

          {/* Location Legend */}
          <div className="absolute bottom-10 left-10 p-6 bg-stone-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl pointer-events-none max-w-xs">
            <div className="flex items-center gap-4 mb-2">
               <Compass className="text-amber-500" size={24} />
               <div>
                  <h4 className="text-lg font-black text-white leading-none">{name}</h4>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">مركز إرساء القصيدة</p>
               </div>
            </div>
            <div className="pt-4 border-t border-white/5">
              <span className="text-[9px] font-mono text-stone-400">Lat: {lat.toFixed(6)} / Lng: {lng.toFixed(6)}</span>
            </div>
          </div>
        </div>

        {/* AI Sidebar - Literary Insights */}
        <div className="w-full md:w-[450px] bg-stone-950 border-r border-white/10 flex flex-col overflow-hidden">
           <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <Sparkles size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">صدى المكان</h3>
                    <p className="text-[9px] font-bold text-stone-600 uppercase tracking-widest">تحليل أدبي عبر Gemini</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-4 bg-stone-900 hover:bg-red-600 text-white rounded-2xl transition-all active:scale-90"
              >
                <X size={20} />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                   <RotateCcw className="text-blue-500 animate-spin" size={40} />
                   <p className="text-stone-500 font-bold uppercase tracking-[0.2em] text-[10px] text-center">جاري استنطاق ذاكرة المكان التاريخية...</p>
                </div>
              ) : insights ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="h-px flex-1 bg-gradient-to-l from-blue-500/50 to-transparent"></div>
                         <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">السردية التاريخية</span>
                         <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                      </div>
                      <p className="text-stone-300 font-amiri text-2xl leading-relaxed italic whitespace-pre-line">
                        {insights.text}
                      </p>
                   </div>

                   {insights.sources && insights.sources.length > 0 && (
                     <div className="space-y-4">
                        <span className="text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">المصادر التوثيقية</span>
                        <div className="grid grid-cols-1 gap-3">
                           {insights.sources.map((source: any, i: number) => (
                             <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-[10px] font-black text-stone-500">{i + 1}</div>
                                <span className="text-[10px] text-stone-400 truncate flex-1 font-bold">{source.title || "مرجع توثيقي"}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-40">
                   <Info size={40} className="text-stone-700" />
                   <p className="text-stone-600 text-xs font-bold leading-relaxed">انقر على الخريطة أو انتظر قليلاً لتحميل البيانات التاريخية لهذا الموقع.</p>
                </div>
              )}
           </div>

           {/* Footer Instruction */}
           <div className="p-6 bg-black/40 border-t border-white/5 text-center">
              <p className="text-stone-600 text-[9px] font-black uppercase tracking-[0.3em]">استخدم الفأرة للتحجيم أو اللمس للتحريك داخل الساحة</p>
           </div>
        </div>
      </div>
    </div>
  );
};

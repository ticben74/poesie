
import React, { useState, useEffect } from 'react';
import { ExhibitionsDashboard } from './components/ExhibitionsDashboard';
import { ExhibitionLanding } from './components/ExhibitionLanding';
import { db, Exhibition } from './services/supabase';
import { Book, ArrowRight, Quill as PenQuill, LayoutGrid, Sparkles, Edit3, Settings, Languages } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'portal' | 'exhibition' | 'admin' | 'editor'>('portal');
  const [selectedExId, setSelectedExId] = useState<string | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortalData();
  }, []);

  async function loadPortalData() {
    setLoading(true);
    const data = await db.getExhibitions();
    setExhibitions(data as Exhibition[]);
    setLoading(false);
  }

  if (view === 'admin' || view === 'editor') {
    return (
      <div className="animate-in fade-in duration-700">
        <div className="fixed top-6 right-6 z-[100] flex gap-4">
          <button 
            onClick={() => { setView('portal'); loadPortalData(); }}
            className="px-6 py-3 bg-stone-900/90 backdrop-blur-md text-stone-300 rounded-full hover:text-blue-500 transition-all border border-stone-800 shadow-2xl flex items-center gap-2"
          >
            <LayoutGrid size={18} />
            <span className="font-bold">العودة للديوان العام</span>
          </button>
        </div>
        <ExhibitionsDashboard defaultMode={view === 'editor' ? 'editor' : 'admin'} />
      </div>
    );
  }

  if (view === 'exhibition' && selectedExId) {
    return (
      <div className="animate-in zoom-in duration-700">
        <ExhibitionLanding 
          exhibitionId={selectedExId} 
          onClose={() => { setView('portal'); setSelectedExId(null); }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-amiri overflow-x-hidden selection:bg-blue-500/30">
      {/* Hero Section: Poetry Portal */}
      <section className="relative h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-900/10 blur-[150px] rounded-full"></div>
        </div>

        <nav className="absolute top-0 w-full p-10 flex justify-between items-center max-w-7xl z-20">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/40">
                 <Languages className="text-white" size={28} />
              </div>
              <span className="text-4xl font-black text-white tracking-tighter uppercase">مدن الشعر</span>
           </div>
           
           <div className="flex items-center gap-4">
             <button 
              onClick={() => setView('editor')}
              className="flex items-center gap-3 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-stone-400 hover:text-blue-400 transition-all hover:bg-white/10 group"
             >
               <Edit3 size={20} className="group-hover:scale-110 transition-transform" />
               <span className="text-sm font-bold uppercase tracking-widest">بوابة الشاعر</span>
             </button>

             <button 
              onClick={() => setView('admin')}
              className="flex items-center gap-3 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-stone-400 hover:text-indigo-500 transition-all hover:bg-white/10 group"
             >
               <Settings size={20} className="group-hover:scale-110 transition-transform" />
               <span className="text-sm font-bold uppercase tracking-widest">منسق المدن</span>
             </button>
           </div>
        </nav>

        <div className="relative z-10 text-center space-y-12 max-w-6xl">
          <div className="inline-block px-8 py-3 bg-blue-600/10 border border-blue-600/20 rounded-full animate-bounce-slow">
            <span className="text-blue-500 text-sm font-black uppercase tracking-[0.5em]">منصة إرساء القصائد الفراغية</span>
          </div>
          <h1 className="text-8xl md:text-[14rem] font-black text-white leading-[0.8] tracking-tighter">
            ديوان <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600">الذاكرة</span>
          </h1>
          <p className="text-3xl md:text-4xl text-stone-400 max-w-4xl mx-auto leading-relaxed italic font-amiri px-4">
            "تجول في عواصم القوافي، حيث تتجسد الكلمات في الفضاء، وتتحول الأبيات إلى معالم يمكنك المشي بين ثناياها."
          </p>
          <div className="pt-16">
            <button 
              onClick={() => document.getElementById('cities')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-20 py-8 bg-white text-stone-950 rounded-full font-black text-3xl hover:bg-blue-600 hover:text-white transition-all shadow-[0_30px_80px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95"
            >
              استكشف المدن الشعرية
            </button>
          </div>
        </div>

        <div className="absolute bottom-16 flex flex-col items-center gap-6 text-stone-700">
           <span className="text-[12px] uppercase tracking-[0.5em]">انزل للأعماق</span>
           <div className="w-px h-24 bg-gradient-to-b from-blue-600 to-transparent"></div>
        </div>
      </section>

      {/* City Gallery */}
      <section id="cities" className="py-48 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-10">
          <div className="space-y-6">
             <h2 className="text-7xl font-bold text-white tracking-tighter">عواصم القصيد</h2>
             <p className="text-stone-500 text-3xl max-w-2xl font-amiri leading-relaxed">اختر مدينة لتدخل ديوانها الافتراضي، حيث كل ركن يحكي ملحمة، وكل زاوية تردد صدى شاعر.</p>
          </div>
          <div className="text-blue-500 font-black text-2xl border-b-8 border-blue-500/10 pb-6 px-4">
            {exhibitions.length} مدينة شعرية
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
            {[1,2,3].map(i => (
              <div key={i} className="h-[700px] bg-stone-900/40 rounded-[5rem] animate-pulse border border-stone-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
            {exhibitions.map((ex) => (
              <div 
                key={ex.id}
                onClick={() => { setSelectedExId(ex.id); setView('exhibition'); }}
                className="group relative h-[750px] rounded-[5rem] overflow-hidden border border-stone-800 hover:border-blue-500/50 transition-all duration-1000 cursor-pointer shadow-3xl"
              >
                <img 
                  src={ex.items[0]?.image} 
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-80 group-hover:scale-110 transition-all duration-1000 grayscale group-hover:grayscale-0" 
                  alt={ex.context.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent"></div>
                
                <div className="absolute bottom-0 p-16 w-full space-y-8">
                   <h3 className="text-6xl font-bold text-white group-hover:text-blue-400 transition-colors leading-none tracking-tighter">{ex.context.name}</h3>
                   <p className="text-stone-400 line-clamp-2 text-2xl italic font-amiri opacity-0 group-hover:opacity-100 transition-all transform translate-y-12 group-hover:translate-y-0 duration-700 delay-100">
                    {ex.context.description}
                   </p>
                   <div className="pt-10 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-white text-2xl font-bold tracking-tighter">{ex.items.length} قصيدة</span>
                        <span className="text-stone-600 text-[12px] font-bold uppercase tracking-widest">إرساء مكاني نشط</span>
                      </div>
                      <div className="w-20 h-20 bg-white text-stone-950 rounded-[2rem] flex items-center justify-center -translate-x-16 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-700 shadow-[0_30px_60px_rgba(255,255,255,0.2)]">
                        <ArrowRight size={36} />
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="py-48 border-t border-stone-900 bg-black/40 text-center space-y-12">
         <p className="text-stone-500 text-2xl font-amiri max-w-2xl mx-auto leading-relaxed px-6">
           "مدن الشعر" هي مبادرة رقمية لإعادة تعريف القراءة وتجسيد التراث الأدبي العربي في العصر الرقمي.
         </p>
         <div className="text-stone-700 text-sm font-black uppercase tracking-[0.6em]">Digital Poetry Cities © 2024</div>
      </footer>
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { 
  Plus, Eye, Search, BarChart, TrendingUp, CheckCircle, Clock, MapPin, Edit3, Trash2, Settings, Compass, Layers
} from 'lucide-react';
import { db, Exhibition, generateExhibitionId, slugify } from '../services/supabase';
import { INITIAL_EXHIBITION } from '../constants';
import { ExhibitionLanding } from './ExhibitionLanding';
import { Narrative } from '../types';

interface ExhibitionsDashboardProps {
  defaultMode?: 'admin' | 'editor';
}

export const ExhibitionsDashboard: React.FC<ExhibitionsDashboardProps> = ({ defaultMode = 'admin' }) => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExhibition, setSelectedExhibition] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { loadExhibitions(); }, []);

  async function loadExhibitions() {
    setLoading(true);
    const data = await db.getExhibitions();
    setExhibitions(data as Exhibition[]);
    setLoading(false);
  }

  async function handleCreate(name: string, location: string, story: string, pointsCount: number) {
    // Generate initial narratives distributed in a spiral
    const generatedItems: Narrative[] = Array.from({ length: pointsCount }).map((_, i) => {
      const angle = 0.5 * i;
      const radius = 10 + (i * 1.5);
      return {
        id: Date.now() + i,
        title: `نقطة سردية ${i + 1}`,
        poet: "بانتظار المحرر", // Standardized field name
        image: `https://picsum.photos/seed/ex-${Date.now()}-${i}/800/1000`,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        content: "هذه النقطة تم توليدها هندسياً بواسطة المنسق. يرجى تعديل المحتوى.", // Standardized field name
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        z: i * 100
      };
    });

    const newEx: Exhibition = {
      ...INITIAL_EXHIBITION,
      id: generateExhibitionId(),
      slug: slugify(name),
      context: { name, location, description: story, story },
      items: generatedItems,
      createdAt: Date.now(),
      status: 'published'
    };
    
    await db.saveExhibition(newEx);
    setExhibitions(prev => [newEx, ...prev]);
    setShowCreateModal(false);
    setSelectedExhibition(newEx.id);
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا المعرض؟ لا يمكن التراجع عن هذه الخطوة.')) {
      await db.deleteExhibition(id);
      loadExhibitions();
    }
  };

  const filtered = exhibitions.filter(ex => 
    ex.context.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.context.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedExhibition) {
    return (
      <ExhibitionLanding 
        exhibitionId={selectedExhibition} 
        role={defaultMode === 'admin' ? 'coordinator' : 'editor'}
        onClose={() => { setSelectedExhibition(null); loadExhibitions(); }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-amiri p-8 md:p-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div className="flex items-center gap-6">
           <div className={`p-5 rounded-3xl ${defaultMode === 'admin' ? 'bg-amber-600 text-white shadow-amber-900/40' : 'bg-blue-600 text-white shadow-blue-900/40'} shadow-2xl`}>
             {defaultMode === 'admin' ? <Settings size={40} /> : <Edit3 size={40} />}
           </div>
           <div>
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase">
                {defaultMode === 'admin' ? 'بوابة المنسق' : 'بوابة المحرر'}
              </h1>
              <p className="text-stone-500 text-xl italic">
                {defaultMode === 'admin' 
                  ? 'هندسة المسارات الفراغية وتوزيع السرديات' 
                  : 'تحرير السرديات وصياغة ذاكرة الساحة'}
              </p>
           </div>
        </div>
        {defaultMode === 'admin' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-3 px-10 py-5 bg-amber-600 rounded-[2rem] hover:bg-amber-500 transition shadow-[0_20px_50px_rgba(217,119,6,0.2)] font-bold text-lg active:scale-95"
          >
            <Plus /> <span>تنسيق ساحة جديدة</span>
          </button>
        )}
      </header>

      {/* Main List Container */}
      <div className="bg-stone-900/30 p-10 rounded-[4rem] border border-stone-800 shadow-3xl">
        <div className="relative mb-12">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-600" />
          <input 
            type="text" 
            placeholder="ابحث في سجلات القرى..." 
            className="w-full bg-black/40 border border-stone-800 rounded-3xl p-6 pr-16 text-white font-amiri text-2xl outline-none focus:border-amber-500 transition-all placeholder:text-stone-700 shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-32 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-amber-500 text-2xl font-bold">جاري استرجاع سجلات الساحات...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-stone-800 rounded-[3rem]">
            <p className="text-stone-600 text-2xl">لا توجد ساحات مطابقة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map(ex => (
              <div 
                key={ex.id}
                onClick={() => setSelectedExhibition(ex.id)}
                className="group relative h-[450px] rounded-[3rem] overflow-hidden border border-stone-800 hover:border-amber-500/50 transition-all duration-700 cursor-pointer shadow-2xl"
              >
                <img src={ex.items[0]?.image} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                
                {defaultMode === 'admin' && (
                  <button 
                    onClick={(e) => handleDelete(e, ex.id)}
                    className="absolute top-8 left-8 p-4 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all z-20 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={20} />
                  </button>
                )}

                <div className="absolute bottom-0 p-10 w-full">
                   <div className="flex items-center gap-2 text-amber-500 text-sm mb-2 opacity-60">
                      <MapPin size={14} /> <span>{ex.context.location}</span>
                   </div>
                   <h3 className="text-4xl font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">{ex.context.name}</h3>
                   <div className="flex justify-between items-center mt-6">
                      <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">{ex.items.length} نقطة مسار</p>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${defaultMode === 'editor' ? 'bg-blue-600' : 'bg-amber-600'} text-white shadow-xl group-hover:scale-110`}>
                        {defaultMode === 'editor' ? <Edit3 size={24} /> : <Compass size={24} />}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateModal onSave={handleCreate} onCancel={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

const CreateModal: React.FC<{ onSave: (n:string, l:string, s:string, p:number) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [story, setStory] = useState('');
  const [points, setPoints] = useState(12);
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
       <div className="bg-stone-900 max-w-4xl w-full p-12 rounded-[4rem] border border-stone-800 shadow-[0_50px_100px_rgba(0,0,0,1)] space-y-8 overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-amber-500 tracking-tighter">هندسة ساحة جديدة</h2>
            <p className="text-stone-500 text-lg italic">حدد النطاق الجغرافي وكثافة السرديات للبدء.</p>
          </div>
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-stone-500 text-xs uppercase tracking-widest mr-2">اسم المعرض / القرية</label>
                   <input type="text" placeholder="مثال: ساحة الكاف" className="w-full bg-black/40 border border-stone-800 rounded-3xl p-6 text-white font-amiri text-2xl outline-none focus:border-amber-500 transition-all" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                   <label className="text-stone-500 text-xs uppercase tracking-widest mr-2">الموقع</label>
                   <input type="text" placeholder="مثال: الشمال الغربي، تونس" className="w-full bg-black/40 border border-stone-800 rounded-3xl p-6 text-white font-amiri text-2xl outline-none focus:border-amber-500 transition-all" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
             </div>

             {/* Path Planning Config */}
             <div className="bg-stone-800/30 p-8 rounded-[3rem] border border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-600/20 text-amber-500 rounded-xl"><Layers size={20}/></div>
                      <h4 className="text-xl font-bold text-white">تخطيط كثافة المسار</h4>
                   </div>
                   <span className="text-4xl font-black text-amber-500">{points} <span className="text-xs text-stone-600 uppercase">سردية</span></span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  step="1"
                  className="w-full h-3 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[10px] font-black text-stone-600 uppercase tracking-widest px-2">
                   <span>نقطة واحدة (تركيز عالٍ)</span>
                   <span>50 نقطة (تعددية سردية)</span>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-stone-500 text-xs uppercase tracking-widest mr-2">الرؤية الفنية للساحة</label>
                <textarea placeholder="اكتب المقدمة التي سيراها الزوار عند الدخول..." rows={4} className="w-full bg-black/40 border border-stone-800 rounded-3xl p-6 text-white font-amiri text-xl leading-relaxed outline-none focus:border-amber-500 transition-all" value={story} onChange={e => setStory(e.target.value)} />
             </div>
          </div>
          <div className="flex gap-4 pt-4">
             <button onClick={() => onSave(name, location, story, points)} className="flex-[2] bg-amber-600 hover:bg-amber-500 py-6 rounded-3xl text-white font-black text-xl shadow-2xl transition-all active:scale-95">بدء الهندسة الفراغية</button>
             <button onClick={onCancel} className="flex-1 bg-stone-800 hover:bg-stone-700 py-6 rounded-3xl text-stone-400 font-bold transition-all">إلغاء</button>
          </div>
       </div>
    </div>
  );
};

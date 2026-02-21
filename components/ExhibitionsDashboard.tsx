
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, MapPin, Edit3, Trash2, Settings, Compass, Layers, Link, Copy, ExternalLink, Zap, Navigation, Map as MapIcon, Share2, QrCode, X, Check, Smartphone
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
  const [shareEx, setShareEx] = useState<Exhibition | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadExhibitions(); }, []);

  async function loadExhibitions() {
    setLoading(true);
    const data = await db.getExhibitions();
    setExhibitions(data as Exhibition[]);
    setLoading(false);
  }

  async function handleCreate(name: string, location: string, story: string, pointsCount: number, lat?: number, lng?: number) {
    const generatedItems: Narrative[] = Array.from({ length: pointsCount }).map((_, i) => {
      const angle = 0.5 * i;
      const radius = 10 + (i * 1.5);
      return {
        id: Date.now() + i,
        title: `نقطة سردية ${i + 1}`,
        poet: "بانتظار المحرر",
        image: `https://picsum.photos/seed/ex-${Date.now()}-${i}/800/1000`,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        content: "هذه النقطة تم توليدها هندسياً بواسطة المنسق.",
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        z: i * 100
      };
    });

    const newEx: Exhibition = {
      ...INITIAL_EXHIBITION,
      id: generateExhibitionId(),
      slug: slugify(name),
      context: { 
        name, location, description: story, story,
        lat: lat || INITIAL_EXHIBITION.context.lat,
        lng: lng || INITIAL_EXHIBITION.context.lng
      },
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
    if (window.confirm('هل أنت متأكد من حذف هذا المعرض؟')) {
      await db.deleteExhibition(id);
      loadExhibitions();
    }
  };

  const openShareModal = (e: React.MouseEvent, ex: Exhibition) => {
    e.stopPropagation();
    setShareEx(ex);
  };

  const getPublicLink = (ex: Exhibition) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?ex=${ex.slug || ex.id}`;
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen bg-stone-950 text-stone-100 font-amiri p-8 md:p-12 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div className="flex items-center gap-6">
           <div className={`p-5 rounded-3xl ${defaultMode === 'admin' ? 'bg-amber-600 text-white shadow-amber-900/40' : 'bg-blue-600 text-white shadow-blue-900/40'} shadow-2xl`}>
             {defaultMode === 'admin' ? <Settings size={40} /> : <Edit3 size={40} />}
           </div>
           <div>
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase">
                {defaultMode === 'admin' ? 'بوابة المنسق' : 'بوابة المحرر'}
              </h1>
              <p className="text-stone-500 text-xl italic">إدارة الساحات والسرديات كـ PWA</p>
           </div>
        </div>
        <div className="flex gap-4">
          <div className="hidden lg:flex items-center gap-2 px-6 py-4 bg-stone-900/50 rounded-2xl border border-white/5 text-stone-500">
             <Smartphone size={18}/>
             <span className="text-xs font-bold uppercase tracking-widest">تطبيق جاهز للتثبيت</span>
          </div>
          {defaultMode === 'admin' && (
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-3 px-10 py-5 bg-amber-600 rounded-[2rem] hover:bg-amber-500 transition font-bold text-lg active:scale-95 shadow-xl">
              <Plus /> <span>تنسيق ساحة جديدة</span>
            </button>
          )}
        </div>
      </header>

      <div className="bg-stone-900/30 p-10 rounded-[4rem] border border-stone-800 shadow-3xl">
        <div className="relative mb-12">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-600" />
          <input 
            type="text" 
            placeholder="ابحث في عواصم القصيد..." 
            className="w-full bg-black/40 border border-stone-800 rounded-3xl p-6 pr-16 text-white font-amiri text-2xl outline-none focus:border-amber-500 shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-32 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map(ex => (
              <div 
                key={ex.id}
                onClick={() => setSelectedExhibition(ex.id)}
                className="group relative h-[500px] rounded-[3rem] overflow-hidden border border-stone-800 hover:border-amber-500/50 transition-all duration-700 cursor-pointer shadow-2xl"
              >
                <img src={ex.items[0]?.image} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                
                {/* Quick Share Button */}
                <button 
                  onClick={(e) => openShareModal(e, ex)}
                  className="absolute top-8 left-8 p-5 bg-black/60 hover:bg-amber-600 rounded-2xl text-white transition-all border border-white/10 backdrop-blur-xl opacity-0 group-hover:opacity-100 z-10 shadow-2xl scale-90 group-hover:scale-100"
                  title="توليد رمز QR والمشاركة"
                >
                  <QrCode size={24} />
                </button>

                <div className="absolute bottom-0 p-10 w-full">
                   <div className="flex items-center gap-2 text-amber-500 text-sm mb-2 opacity-60">
                      <MapPin size={14} /> <span>{ex.context.location}</span>
                   </div>
                   <h3 className="text-4xl font-bold text-white group-hover:text-amber-400 leading-tight">{ex.context.name}</h3>
                   <div className="flex justify-between items-center mt-6">
                      <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">{ex.items.length} نقطة سردية</p>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${defaultMode === 'editor' ? 'bg-blue-600' : 'bg-amber-600'} text-white shadow-xl`}>
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

      {/* Enhanced PWA-Style Share Modal */}
      {shareEx && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
           <div className="max-w-md w-full bg-stone-900 border border-white/10 rounded-[4rem] p-12 text-center space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative">
              <button onClick={() => setShareEx(null)} className="absolute top-8 right-8 text-stone-500 hover:text-white transition-colors bg-white/5 p-3 rounded-full"><X size={20}/></button>
              
              <div className="space-y-4">
                 <div className="w-20 h-20 bg-amber-600/10 mx-auto rounded-[2rem] flex items-center justify-center border border-amber-500/20 mb-4 shadow-inner">
                    <Share2 className="text-amber-500" size={36} />
                 </div>
                 <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">مشاركة الساحة</h3>
                 <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">المفتاح الرقمي لـ {shareEx.context.name}</p>
              </div>

              <div className="p-10 bg-black/50 rounded-[3.5rem] border border-white/5 flex flex-col items-center gap-8 shadow-inner">
                 <div className="relative p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(217,119,6,0.2)]">
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getPublicLink(shareEx))}&bgcolor=ffffff&color=000000`} 
                     alt="QR Code" 
                     className="w-full aspect-square rounded-xl" 
                   />
                   <div className="absolute inset-0 border-[10px] border-white rounded-2xl pointer-events-none"></div>
                 </div>
                 <div className="w-full flex items-center gap-3 bg-stone-900 border border-white/10 p-5 rounded-2xl overflow-hidden">
                    <Link size={16} className="text-amber-600 shrink-0" />
                    <span className="text-[10px] font-mono text-stone-400 truncate text-left dir-ltr flex-1">{getPublicLink(shareEx)}</span>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => copyLink(getPublicLink(shareEx))} 
                  className={`w-full py-7 rounded-[2rem] font-black text-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl ${copied ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}
                >
                  {copied ? <Check size={28}/> : <Copy size={28}/>}
                  <span>{copied ? 'تم النسخ' : 'نسخ رابط الساحة'}</span>
                </button>
                <p className="text-[9px] text-stone-600 font-black uppercase tracking-[0.3em]">يمكنك طباعة هذا الرمز لتعليقه في الساحة الفعلية</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const CreateModal: React.FC<{ onSave: (n:string, l:string, s:string, p:number, lat?: number, lng?: number) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [story, setStory] = useState('');
  const [points, setPoints] = useState(12);
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-10">
       <div className="bg-stone-900 max-w-4xl w-full p-12 rounded-[4rem] border border-stone-800 shadow-3xl space-y-8 overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-5xl font-black text-amber-500 tracking-tighter">هندسة ساحة جديدة</h2>
            <div className="w-12 h-12 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-600/20">
               <Zap size={24} />
            </div>
          </div>
          
          <div className="space-y-6 text-right">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-stone-600 text-[10px] font-black uppercase tracking-widest mr-4">اسم الساحة</label>
                   <input type="text" placeholder="مثلاً: ساحة الزيتون الكبرى" className="w-full bg-black/40 border border-stone-800 rounded-2xl p-6 text-white text-xl outline-none focus:border-amber-500" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                   <label className="text-stone-600 text-[10px] font-black uppercase tracking-widest mr-4">الموقع الجغرافي</label>
                   <input type="text" placeholder="تونس، القرية العتيقة" className="w-full bg-black/40 border border-stone-800 rounded-2xl p-6 text-white text-xl outline-none focus:border-amber-500" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-stone-600 text-[10px] font-black uppercase tracking-widest mr-4">الرؤية السردية</label>
                <textarea placeholder="صف القصة التي تريد إرساءها هنا..." rows={4} className="w-full bg-black/40 border border-stone-800 rounded-3xl p-6 text-white text-xl outline-none focus:border-amber-500" value={story} onChange={e => setStory(e.target.value)} />
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-stone-600 text-[10px] font-black uppercase tracking-widest mr-4">خط العرض (Lat)</label>
                  <input type="number" step="0.000001" placeholder="36.8065" className="w-full bg-black/40 border border-stone-800 rounded-2xl p-4 text-white font-mono" value={lat} onChange={e => setLat(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-stone-600 text-[10px] font-black uppercase tracking-widest mr-4">خط الطول (Lng)</label>
                  <input type="number" step="0.000001" placeholder="10.1815" className="w-full bg-black/40 border border-stone-800 rounded-2xl p-4 text-white font-mono" value={lng} onChange={e => setLng(e.target.value)} />
                </div>
             </div>
          </div>
          <div className="flex gap-4 pt-4">
             <button onClick={() => onSave(name, location, story, points, parseFloat(lat), parseFloat(lng))} className="flex-[2] bg-amber-600 py-7 rounded-3xl text-white font-black text-2xl active:scale-95 shadow-2xl hover:bg-amber-500 transition-colors">بدء الهندسة الفراغية</button>
             <button onClick={onCancel} className="flex-1 bg-stone-800 py-7 rounded-3xl text-stone-400 font-bold hover:bg-stone-700 transition-colors">إلغاء</button>
          </div>
       </div>
    </div>
  );
};

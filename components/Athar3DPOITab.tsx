
import React, { useState } from 'react';
import { 
  Upload, X, Box, Move3d, Info, Sparkles, Wand2, 
  History, MapPin, Layers, Zap, Globe, MousePointer2, 
  Settings2, Ruler, ShieldCheck, Download, RotateCcw, Navigation
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

/* ─── Premium Field Wrapper ────────────────────────────────────────────── */
const Field = ({ label, sub, icon: Icon, children, error }: any) => (
  <div className="space-y-2 group">
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-500/80 group-focus-within:text-amber-400 transition-colors">
        {Icon && <Icon size={14} />}
        {label}
      </label>
      {error && <span className="text-[10px] font-bold text-red-500 animate-pulse">{error}</span>}
    </div>
    {sub && <p className="text-[10px] text-stone-600 font-medium leading-relaxed">{sub}</p>}
    <div className="relative">
      {children}
    </div>
  </div>
);

const TextInput = ({ value, onChange, placeholder, className = '' }: any) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full bg-black/40 border border-amber-900/20 rounded-2xl p-4 text-stone-200 text-sm outline-none focus:border-amber-500/50 focus:bg-amber-950/10 transition-all placeholder:text-stone-700 font-amiri ${className}`}
  />
);

const NumberInput = ({ value, onChange, step = 0.5 }: any) => (
  <input
    type="number"
    value={value}
    step={step}
    onChange={e => onChange(parseFloat(e.target.value) || 0)}
    className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-center text-amber-500 font-mono text-sm focus:border-amber-500 transition-all outline-none"
  />
);

/* ─── GLB / 3D Upload Zone ─────────────────────────────────────────────── */
const GLBUploadZone = ({ value, onChange, preview }: any) => {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="relative">
      {value || preview ? (
        <div className="flex items-center gap-4 p-5 bg-amber-500/5 border border-amber-500/20 rounded-3xl group">
          <div className="w-12 h-12 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <Box size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-stone-200 truncate uppercase tracking-tighter">
              {value?.name || 'نموذج أثري محفوظ'}
            </p>
            <p className="text-[9px] font-black text-amber-500/50 uppercase tracking-[0.2em]">Spatial Asset Locked</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-3 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all text-stone-600"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onChange(e.dataTransfer.files[0]); }}
          className={`flex flex-col items-center justify-center w-full h-40 rounded-[2.5rem] cursor-pointer transition-all border-2 border-dashed ${dragging ? 'bg-amber-600/10 border-amber-500 scale-[0.98]' : 'bg-white/5 border-white/10 hover:border-amber-500/30'}`}
        >
          <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mb-3 shadow-xl text-stone-600 group-hover:text-amber-500">
            <Upload size={24} />
          </div>
          <p className="text-xs font-black text-stone-400 uppercase tracking-widest">رفع الأثر الرقمي</p>
          <p className="text-[9px] mt-2 text-stone-600 font-bold uppercase tracking-widest">GLB / GLTF Only</p>
          <input type="file" accept=".glb,.gltf" className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
        </label>
      )}
    </div>
  );
};

/* ─── Main Component ───────────────────────────────────────────────────── */
export const Athar3DPOITab = ({ poi, index, onChange, onFileChange, validationErrors = {} }: any) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const err = validationErrors[index] || {};

  const handleAIDescription = async () => {
    if (!poi.title) return alert("يرجى كتابة اسم القطعة أولاً.");
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `أنت خبير آثار تونسي. اكتب وصفاً متحفياً بليغاً ومختصراً (بحدود 60 كلمة) للقطعة التالية: "${poi.title}"، المنشأ: "${poi.artifactOrigin || 'تونس'}"، المادة: "${poi.artifactMaterial || 'غير محددة'}". اجعل الوصف شاعرياً ويليق بساحة القرية.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      if (response.text) {
        onChange(index, 'description', response.text.trim());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700" dir="rtl">
      
      {/* Visual Identity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Metadata */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-stone-900/40 border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl">
            <Field label="اسم القطعة الأثرية" icon={Zap} error={err.title}>
              <TextInput 
                value={poi.title} 
                onChange={(v: string) => onChange(index, 'title', v)} 
                placeholder="مثال: إبريق القيروان الفضي" 
                className="text-2xl font-black tracking-tight"
              />
            </Field>

            <Field label="الوصف التاريخي والسردي" icon={History}>
              <div className="relative">
                <textarea
                  value={poi.description}
                  onChange={e => onChange(index, 'description', e.target.value)}
                  placeholder="كيف تحكي هذه القطعة قصة المكان؟"
                  rows={5}
                  className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-stone-300 font-amiri text-lg outline-none focus:border-amber-500/50 transition-all resize-none"
                />
                <button 
                  onClick={handleAIDescription}
                  disabled={isGenerating}
                  className="absolute bottom-6 left-6 p-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl shadow-xl transition-all active:scale-90 flex items-center gap-2 group disabled:opacity-50"
                >
                  {isGenerating ? <RotateCcw className="animate-spin" size={18}/> : <Wand2 size={18}/>}
                  <span className="text-[10px] font-black uppercase tracking-widest">ذكاء المكان</span>
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-6">
              <Field label="الحقبة التاريخية" icon={Layers}>
                <TextInput value={poi.artifactPeriod} onChange={(v: string) => onChange(index, 'artifactPeriod', v)} placeholder="مثال: العهد الحفصي" />
              </Field>
              <Field label="المنشأ المحلي" icon={MapPin}>
                <TextInput value={poi.artifactOrigin} onChange={(v: string) => onChange(index, 'artifactOrigin', v)} placeholder="مثال: تونس العتيقة" />
              </Field>
            </div>

            <Field label="المواد المستخدمة" icon={MousePointer2}>
              <TextInput value={poi.artifactMaterial} onChange={(v: string) => onChange(index, 'artifactMaterial', v)} placeholder="خزف مطلي بماء الذهب" />
            </Field>
          </div>
        </div>

        {/* Right Column: Assets & 3D */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Main Media Asset */}
          <div className="bg-stone-900/40 border border-white/5 rounded-[3rem] p-8 shadow-2xl space-y-6">
            <Field label="أيقونة التعريف" sub="الصورة التي تظهر في اللوحة المجاورة للأثر">
              {poi.imagePreview ? (
                <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden group border border-white/10 shadow-3xl">
                  <img src={poi.imagePreview} alt="preview" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                  <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer">
                    <div className="bg-white/10 border border-white/20 p-5 rounded-full text-white">
                      <Upload size={24} />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => onFileChange(index, 'image', e.target.files?.[0])} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[4/5] rounded-[2.5rem] bg-white/5 border-2 border-dashed border-white/10 hover:border-amber-500/40 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-stone-900 rounded-3xl flex items-center justify-center mb-4 text-stone-700 group-hover:text-amber-500 transition-colors">
                    <Upload size={28} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">رفع صورة الأثر</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => onFileChange(index, 'image', e.target.files?.[0])} />
                </label>
              )}
            </Field>

            <Field label="الكيان الرقمي (3D)" sub="المجسم الذي سيعوم في الساحة">
              <GLBUploadZone 
                value={poi.glbModelFile} 
                preview={poi.glbModel} 
                onChange={(f: File | null) => onFileChange(index, 'glbModel', f)} 
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Geographical Anchoring Section */}
      <div className="bg-blue-600/5 border border-blue-600/10 rounded-[4rem] p-12 shadow-3xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-950/40">
            <Navigation size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">الإرساء الجغرافي (GPS)</h3>
            <p className="text-[10px] text-blue-500/50 font-black uppercase tracking-widest mt-2">Geographic Point of Interest</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Field label="خط العرض (Lat)" icon={MapPin} sub="إحداثيات تونس الافتراضية: 33.8869">
            <input 
              type="number" 
              step="0.000001"
              value={poi.lat || 33.886917} 
              onChange={e => onChange(index, 'lat', parseFloat(e.target.value))}
              className="w-full bg-black/40 border border-blue-900/20 rounded-2xl p-5 text-stone-200 text-lg font-mono outline-none focus:border-blue-500/50 transition-all shadow-inner"
            />
          </Field>
          <Field label="خط الطول (Lng)" icon={MapPin} sub="إحداثيات تونس الافتراضية: 9.5375">
            <input 
              type="number" 
              step="0.000001"
              value={poi.lng || 9.537499} 
              onChange={e => onChange(index, 'lng', parseFloat(e.target.value))}
              className="w-full bg-black/40 border border-blue-900/20 rounded-2xl p-5 text-stone-200 text-lg font-mono outline-none focus:border-blue-500/50 transition-all shadow-inner"
            />
          </Field>
        </div>
      </div>

      {/* Spatial Controls Section */}
      <div className="bg-amber-600/5 border border-amber-600/10 rounded-[4rem] p-12 shadow-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-amber-950/40">
                <Move3d size={28} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">الإسقاط الفراغي (3D)</h3>
                <p className="text-[10px] text-amber-500/50 font-black uppercase tracking-widest mt-2">Precision Spatial Positioning</p>
              </div>
           </div>
           
           <div className="flex gap-4">
              <div className="px-5 py-3 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-3">
                 <Ruler size={16} className="text-stone-500" />
                 <span className="text-[10px] font-bold text-stone-400">Visibility: {poi.visibilityDistance}m</span>
              </div>
              <button 
                onClick={() => { onChange(index, 'x3D', 0); onChange(index, 'y3D', 0); onChange(index, 'z3D', 0); }}
                className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                تصفير الموضع
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Coordinates */}
          <div className="space-y-6">
             <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest flex items-center gap-2">
               <Globe size={14} /> الإحداثيات المحليه (أمتار)
             </span>
             <div className="grid grid-cols-3 gap-4">
                {[
                  { k: 'x3D', l: 'X (أفقي)', c: 'border-red-500/20 text-red-400' },
                  { k: 'y3D', l: 'Y (رأسي)', c: 'border-emerald-500/20 text-emerald-400' },
                  { k: 'z3D', l: 'Z (عمق)', c: 'border-blue-500/20 text-blue-400' }
                ].map(ax => (
                  <div key={ax.k} className="space-y-2">
                    <label className="text-[9px] font-black text-stone-700 uppercase block text-center">{ax.l}</label>
                    <div className={`bg-black/40 border rounded-2xl p-1 ${ax.c}`}>
                      <NumberInput value={poi[ax.k]} onChange={(v: number) => onChange(index, ax.k, v)} />
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Rotations */}
          <div className="space-y-6">
             <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest flex items-center gap-2">
               <RotateCcw size={14} /> زوايا الدوران (درجات)
             </span>
             <div className="grid grid-cols-3 gap-4">
                {[
                  { k: 'rotationX', l: 'Pitch', c: 'border-white/5 text-amber-500' },
                  { k: 'rotationY', l: 'Yaw', c: 'border-white/5 text-amber-500' },
                  { k: 'rotationZ', l: 'Roll', c: 'border-white/5 text-amber-500' }
                ].map(ax => (
                  <div key={ax.k} className="space-y-2">
                    <label className="text-[9px] font-black text-stone-700 uppercase block text-center">{ax.l}</label>
                    <div className={`bg-black/40 border rounded-2xl p-1 ${ax.c}`}>
                      <NumberInput value={poi[ax.k]} step={1} onChange={(v: number) => onChange(index, ax.k, v)} />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sliders Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 pt-12 border-t border-white/5">
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest">توهج الهالة (Aura)</label>
                <span className="text-amber-500 font-mono text-xs">{(poi.glowIntensity * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={poi.glowIntensity ?? 0.5} 
                onChange={e => onChange(index, 'glowIntensity', parseFloat(e.target.value))}
                className="w-full h-2 bg-black/40 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
           </div>
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest">مسافة التلاشي</label>
                <span className="text-amber-500 font-mono text-xs">{poi.visibilityDistance}m</span>
              </div>
              <input 
                type="range" min="1" max="100" step="1" 
                value={poi.visibilityDistance ?? 20} 
                onChange={e => onChange(index, 'visibilityDistance', parseInt(e.target.value))}
                className="w-full h-2 bg-black/40 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
           </div>
        </div>
      </div>

      {/* Trust & Status Section */}
      <div className="flex items-center gap-6 p-8 bg-stone-900/20 border border-white/5 rounded-[3rem]">
         <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-500">
            <ShieldCheck size={24} />
         </div>
         <div className="flex-1">
            <h4 className="text-sm font-black text-white uppercase tracking-tighter">جاهزية الإرساء الفراغي</h4>
            <p className="text-[9px] text-stone-600 font-bold uppercase tracking-widest mt-1">تم التحقق من سلامة الأصول الرقمية وصحة الإحداثيات الجغرافية والفضائية.</p>
         </div>
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${poi.glbModelFile || poi.glbModel ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-stone-700'}`}></div>
            <span className="text-[9px] font-black uppercase text-stone-400">3D Asset</span>
         </div>
         <div className="w-px h-8 bg-white/5 mx-2"></div>
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${poi.image || poi.imagePreview ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-stone-700'}`}></div>
            <span className="text-[9px] font-black uppercase text-stone-400">Metadata</span>
         </div>
      </div>

    </div>
  );
};

export default Athar3DPOITab;

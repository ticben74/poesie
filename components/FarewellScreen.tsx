
import React, { useState } from 'react';
import { Share2, Star, MessageSquare, ArrowRight, Heart, Copy, Check, QrCode } from 'lucide-react';

interface FarewellScreenProps {
  exhibitionName: string;
  shareUrl: string;
  onRestart?: () => void;
}

export const FarewellScreen: React.FC<FarewellScreenProps> = ({ exhibitionName, shareUrl, onRestart }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=1c1917&color=ffffff`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6 text-center animate-in fade-in duration-1000 relative overflow-hidden" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-3xl w-full space-y-12 relative z-10">
        <div className="space-y-6">
          <div className="w-20 h-20 bg-blue-600/10 mx-auto rounded-3xl flex items-center justify-center border border-blue-500/20 mb-8 animate-bounce-slow">
            <Heart className="text-blue-500" size={40} fill="currentColor" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">شكرًا لزيارتك</h1>
          <p className="text-stone-500 text-3xl font-amiri italic">لقد كنت جزءًا من صدى ساحة "{exhibitionName}"</p>
        </div>

        {!submitted ? (
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 space-y-12 shadow-3xl">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-stone-600 uppercase tracking-[0.4em]">ما مدى تأثرك بالتجربة؟</span>
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    className="transition-all transform hover:scale-125 active:scale-90"
                  >
                    <Star
                      size={48}
                      className={`${(hover || rating) >= star ? 'text-amber-500 fill-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-stone-800'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اترك انطباعك الأخير هنا..."
                className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-white font-amiri text-xl outline-none focus:border-blue-500 transition-all h-24"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={handleSubmit}
                className="flex-[2] py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl"
              >
                <MessageSquare size={20} />
                <span>إرسال الانطباع</span>
              </button>
              
              <div className="flex-1 flex gap-2">
                 <div className="p-3 bg-stone-900 border border-white/10 rounded-2xl flex items-center justify-center">
                    <img src={qrUrl} alt="QR" className="w-12 h-12 rounded-sm" />
                 </div>
                 <button
                   onClick={handleCopy}
                   className="flex-1 bg-stone-800 hover:bg-stone-700 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95"
                 >
                   {copied ? <Check className="text-emerald-500" /> : <Copy size={20} />}
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[4rem] p-16 animate-in zoom-in duration-500 space-y-8">
            <h4 className="text-4xl font-black text-emerald-400 mb-4">تم حفظ انطباعك بنجاح</h4>
            <div className="flex flex-col items-center gap-6">
                <img src={qrUrl} alt="QR" className="w-48 h-48 rounded-3xl border border-emerald-500/20 shadow-2xl" />
                <button
                  onClick={onRestart}
                  className="px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-black text-2xl flex items-center gap-4 shadow-lg transition-all active:scale-95"
                >
                  <ArrowRight size={24} className="rotate-180" />
                  <span>العودة للساحة</span>
                </button>
            </div>
          </div>
        )}

        <div className="pt-10">
          <p className="text-stone-800 text-[10px] font-black uppercase tracking-[0.8em]">مدن الشعر الرقمية - الذاكرة الحية</p>
        </div>
      </div>
    </div>
  );
};

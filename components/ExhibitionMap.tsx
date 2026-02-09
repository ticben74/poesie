
import React from 'react';
import { X, MapPin, Compass } from 'lucide-react';

interface ExhibitionMapProps {
  lat: number;
  lng: number;
  name: string;
  onClose: () => void;
}

export const ExhibitionMap: React.FC<ExhibitionMapProps> = ({ lat, lng, name, onClose }) => {
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${process.env.API_KEY || ''}&center=${lat},${lng}&zoom=15&maptype=satellite`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-3xl animate-in fade-in">
      <div className="relative w-full max-w-6xl aspect-video md:aspect-auto md:h-[80vh] bg-stone-900 rounded-[3rem] border border-stone-800 overflow-hidden shadow-3xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-stone-800 flex justify-between items-center bg-stone-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-500">
              <Compass size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white leading-none">موقع الساحة الجغرافي</h3>
              <p className="text-stone-500 text-sm mt-1">{name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-stone-800 hover:bg-red-600 text-white rounded-2xl transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Map Frame */}
        <div className="flex-1 relative bg-stone-950">
          <iframe
            title={`Map of ${name}`}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.google.com/maps?q=${lat},${lng}&hl=ar&z=15&t=k&output=embed`}
            allowFullScreen
          ></iframe>
          
          {/* Legend / Overlay */}
          <div className="absolute bottom-6 right-6 p-4 bg-stone-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-none">
            <div className="flex items-center gap-3">
              <MapPin className="text-amber-500" size={18} />
              <span className="text-xs font-bold text-white uppercase tracking-widest">إحداثيات: {lat.toFixed(4)}, {lng.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-stone-900/30 text-center">
          <p className="text-stone-600 text-[10px] font-bold uppercase tracking-[0.2em]">يمكنك التكبير والتحريك لاستكشاف المحيط العمراني والزراعي للقرية</p>
        </div>
      </div>
    </div>
  );
};

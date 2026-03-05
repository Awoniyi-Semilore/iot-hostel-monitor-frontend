import { Wind } from 'lucide-react';

export default function SensorReading({ rawValue, voltage }) {
  return (
    <div className="bg-slate-900/60 border border-white/5 p-5 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-bottom-4">
      <Wind className="text-slate-500 shrink-0" size={20} />
      <div className="flex-1 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Sensor Reading</p>
          <p className="text-sm font-bold font-mono">{rawValue} <span className="text-slate-500 font-sans text-xs">PPM</span></p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Voltage</p>
          <p className="text-sm font-bold font-mono">{voltage} <span className="text-slate-500 font-sans text-xs">V</span></p>
        </div>
      </div>
    </div>
  );
}

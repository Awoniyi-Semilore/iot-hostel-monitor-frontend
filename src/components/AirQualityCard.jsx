import { Wind, Sparkles } from 'lucide-react';
import { getStatusColor, getGlowColor, formatTime } from '../utils/statusColors';

export default function AirQualityCard({ status, isLive, lastSync, isMaintenance, timeLeft, onCancelMaintenance }) {
  const statusColor = getStatusColor(status, isLive, isMaintenance);
  const glowColor = getGlowColor(status, isLive, isMaintenance);

  return (
    <div className={`text-center py-12 px-8 rounded-[3.5rem] border shadow-2xl relative overflow-hidden transition-all duration-700 ${isMaintenance ? 'bg-purple-950/20 border-purple-500/20' : 'bg-slate-900/40 border-white/5'}`}>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 blur-[100px] rounded-full opacity-20 transition-colors duration-1000 ${glowColor}`} />
      <div className="relative z-10">
        {isMaintenance ? (
          <div className="animate-in fade-in zoom-in duration-500">
            <Sparkles className="mx-auto mb-4 text-purple-400" size={56} />
            <h1 className="text-7xl font-black font-mono italic tracking-tighter mb-4 text-purple-400">{formatTime(timeLeft)}</h1>
            <button
              onClick={onCancelMaintenance}
              className="bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase py-2 px-6 rounded-xl"
            >
              Resume Now
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <Wind className={`mx-auto mb-6 transition-all duration-700 ${statusColor}`} size={64} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Air Quality</p>
            <h1 className={`text-6xl font-black italic uppercase tracking-tighter mb-6 ${statusColor}`}>
              {isLive ? status : '----'}
            </h1>
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl py-3 px-6 inline-flex items-center gap-2 border border-white/5">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
              <p className="text-sm font-bold">
                {isLive ? `Live @ ${lastSync?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'OFFLINE'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

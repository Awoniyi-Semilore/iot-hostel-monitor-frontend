import { Activity, WifiOff, Timer, RefreshCw } from 'lucide-react';

export default function SystemHealth({ isMaintenance, isLive, loading, onRefresh }) {
  return (
    <div className={`flex justify-between items-center p-4 rounded-3xl border transition-all ${isMaintenance ? 'bg-purple-500/10 border-purple-500/30' : isLive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-2xl ${isMaintenance ? 'bg-purple-500' : isLive ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {isMaintenance
            ? <Timer size={20} className="text-white" />
            : isLive
              ? <Activity size={20} className="animate-pulse" />
              : <WifiOff size={20} />}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">System Health</p>
          <h2 className="text-sm font-bold tracking-tight">
            {isMaintenance ? 'OVERRIDE ACTIVE' : isLive ? 'NODE_01 ACTIVE' : 'RECONNECTING...'}
          </h2>
        </div>
      </div>
      <button
        onClick={onRefresh}
        className={`p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors ${loading ? 'animate-spin' : ''}`}
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
}

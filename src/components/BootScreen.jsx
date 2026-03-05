import { Server } from 'lucide-react';

export default function BootScreen({ bootMessage }) {
  return (
    <div className="bg-slate-900/80 border border-blue-500/30 rounded-[3.5rem] p-12 text-center animate-in fade-in zoom-in duration-700 shadow-[0_0_50px_rgba(59,130,246,0.15)] mt-12">
      <div className="relative mx-auto w-24 h-24 mb-8">
        <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin duration-1000"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Server className="text-blue-400 animate-pulse" size={32} />
        </div>
      </div>
      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-blue-400 mb-3">System Booting</h2>
      <p className="text-xs font-mono text-slate-400 h-4">{bootMessage}</p>
      <div className="mt-8 bg-blue-950/30 rounded-full h-1 w-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-[progress_3s_ease-in-out_infinite] w-1/3"></div>
      </div>
    </div>
  );
}

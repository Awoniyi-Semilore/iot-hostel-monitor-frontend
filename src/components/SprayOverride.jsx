import { Sparkles, ArrowRight } from 'lucide-react';

export default function SprayOverride({ onStart }) {
  return (
    <button
      onClick={onStart}
      className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-[2rem] flex items-center justify-between group transition-all"
    >
      <div className="flex items-center gap-3 text-indigo-400">
        <div className="bg-indigo-500/20 p-2 rounded-xl"><Sparkles size={18} /></div>
        <div className="text-left">
          <p className="text-sm font-bold">Just Cleaned</p>
          <p className="text-[10px] opacity-60 uppercase tracking-widest font-black">Suppress SMS alerts while cleaning chemicals clear</p>
        </div>
      </div>
      <ArrowRight size={18} className="text-indigo-500/50 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

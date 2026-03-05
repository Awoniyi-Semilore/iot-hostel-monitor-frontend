import { Sparkles, ArrowRight } from 'lucide-react';

export default function SprayOverride({ onStart }) {
  return (
    <button
      onClick={onStart}
      className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 p-5 rounded-[2rem] flex items-center justify-between gap-4 group transition-all"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="bg-indigo-500/20 p-2.5 rounded-xl shrink-0">
          <Sparkles size={18} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-black text-indigo-300">Just Cleaned</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">
            Suppress SMS alerts while cleaning chemicals clear
          </p>
        </div>
      </div>
      <ArrowRight size={16} className="text-indigo-500/40 shrink-0 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

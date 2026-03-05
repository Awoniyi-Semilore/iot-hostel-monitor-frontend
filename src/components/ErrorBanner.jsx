import { AlertTriangle } from 'lucide-react';

export default function ErrorBanner({ error }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-3xl flex gap-3 animate-in fade-in text-left">
      <AlertTriangle className="text-red-500 shrink-0" size={18} />
      <p className="text-[10px] text-red-200/60 uppercase font-black tracking-widest leading-tight">{error}</p>
    </div>
  );
}

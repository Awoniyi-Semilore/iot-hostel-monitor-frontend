import { AlertTriangle, Cpu, Database, Smartphone, Sparkles } from 'lucide-react';

export default function SummaryView() {
  return (
    <div className="max-w-3xl w-full space-y-12 animate-in slide-in-from-right-8 duration-500 pb-16 px-4">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Project AuraCheck
        </h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">IoT Hygiene & Sanitation Architecture</p>
      </div>

      <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
        <h3 className="flex items-center gap-3 font-black uppercase text-sm tracking-[0.2em] mb-4 text-blue-400">
          <AlertTriangle size={18} /> The Catalyst
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          AuraCheck addresses the reactive cleaning schedules in university hostels (e.g., JAJA Hall, Unilag).
          By monitoring Ammonia (NH3) levels in real-time, it triggers cleaning based on actual usage rather
          than fixed timetables, significantly improving sanitation and student health.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10">
          <Cpu size={28} className="text-indigo-400" />
          <h3 className="font-black uppercase text-xs tracking-widest">Hardware</h3>
          <p className="text-xs text-slate-400 leading-relaxed">NodeMCU + MQ-135 sensors push data via Wi-Fi to a cloud API every 15 seconds.</p>
        </div>
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10">
          <Database size={28} className="text-emerald-400" />
          <h3 className="font-black uppercase text-xs tracking-widest">Logic</h3>
          <p className="text-xs text-slate-400 leading-relaxed">FastAPI + PostgreSQL handles data ingestion and threshold alerts (Normal vs. Moderate vs. Critical).</p>
        </div>
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10">
          <Smartphone size={28} className="text-orange-400" />
          <h3 className="font-black uppercase text-xs tracking-widest">Escalation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">SMS alerts go to cleaners; Critical levels lasting 15+ mins escalate to the Hall Mistress via Telegram.</p>
        </div>
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10">
          <Sparkles size={28} className="text-purple-400" />
          <h3 className="font-black uppercase text-xs tracking-widest">Mitigation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">The "Spray Override" pauses sensors during cleaning to prevent false VOC alerts from chemicals.</p>
        </div>
      </div>
    </div>
  );
}

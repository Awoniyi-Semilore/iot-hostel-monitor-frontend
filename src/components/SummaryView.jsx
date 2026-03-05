import { AlertTriangle, Cpu, Server, MessageSquare, ShieldCheck } from 'lucide-react';

const STACK = [
  {
    icon: Cpu,
    color: 'text-indigo-400',
    title: 'Hardware',
    body: 'NodeMCU ESP8266 paired with an MQ-135 gas sensor. Reads NH3/ammonia concentration every ~30 seconds and pushes readings to the cloud API over Wi-Fi.',
  },
  {
    icon: Server,
    color: 'text-emerald-400',
    title: 'Backend',
    body: 'Express.js + TypeScript on Fly.io, backed by PostgreSQL. Classifies readings as Fresh (<400 PPM), Moderate (400–699 PPM), or Critical (≥700 PPM).',
  },
  {
    icon: MessageSquare,
    color: 'text-orange-400',
    title: 'SMS Alerts',
    body: 'Twilio sends SMS to registered contacts when a Critical threshold is crossed. Contacts are scoped per location and managed directly from this app.',
  },
  {
    icon: ShieldCheck,
    color: 'text-purple-400',
    title: 'Spray Override',
    body: 'Triggering a spray override calls the backend to set a 45-minute cooldown. SMS alerts are suppressed during this window to avoid false positives from cleaning chemicals.',
  },
];

const THRESHOLDS = [
  { label: 'Fresh',    range: '< 400 PPM',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { label: 'Moderate', range: '400 – 699 PPM', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { label: 'Critical', range: '≥ 700 PPM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
];

export default function SummaryView() {
  return (
    <div className="space-y-8 pb-16 w-full">

      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">About</p>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Project AuraCheck</h1>
        <p className="text-xs text-slate-500 mt-1">JAJA Hall · University of Lagos · Group 7</p>
      </div>

      {/* Top section — 2 col on desktop */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Problem statement */}
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <AlertTriangle size={11} /> The Problem
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            University hostel bathrooms are cleaned on fixed schedules regardless of actual usage.
            AuraCheck monitors NH3 (ammonia) levels in real-time and sends SMS alerts when conditions
            deteriorate, shifting maintenance from time-based to need-based.
          </p>
        </div>

        {/* Thresholds */}
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Thresholds</p>
          <div className="grid grid-cols-3 gap-2 flex-1">
            {THRESHOLDS.map(({ label, range, color, bg }) => (
              <div key={label} className={`border rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 ${bg}`}>
                <p className={`text-xs font-black ${color}`}>{label}</p>
                <p className="text-[10px] text-white font-mono text-center leading-tight">{range}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* How it works — 2x2 grid on desktop */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">How It Works</p>
        <div className="grid md:grid-cols-2 gap-3">
          {STACK.map(({ icon: Icon, color, title, body }) => (
            <div key={title} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex gap-4">
              <Icon size={20} className={`${color} shrink-0 mt-0.5`} />
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1.5">{title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border border-white/5 rounded-2xl p-4 text-center space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Deployed API</p>
        <p className="text-xs font-mono text-slate-400">auracheck.fly.dev</p>
      </div>

    </div>
  );
}

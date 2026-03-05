const STATUS_MAP = {
  fresh:    { text: 'text-cyan-400',   glow: 'bg-cyan-500' },
  moderate: { text: 'text-orange-400', glow: 'bg-orange-500' },
  critical: { text: 'text-red-500',    glow: 'bg-red-600' },
};

export const getStatusColor = (status, isLive, isMaintenance) => {
  if (isMaintenance) return 'text-purple-400';
  if (!isLive) return 'text-slate-600';
  return STATUS_MAP[status]?.text ?? 'text-emerald-400';
};

export const getGlowColor = (status, isLive, isMaintenance) => {
  if (isMaintenance) return 'bg-purple-600';
  if (!isLive) return 'bg-slate-800';
  return STATUS_MAP[status]?.glow ?? 'bg-emerald-500';
};

export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

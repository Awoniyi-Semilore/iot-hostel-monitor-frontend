import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useReadings } from '../queries/useReadings';
import { useHistory } from '../queries/useHistory';

const STATUS_COLOR = { fresh: '#22d3ee', moderate: '#fb923c', critical: '#ef4444' };

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-xs space-y-1">
      <p className="font-black uppercase tracking-widest" style={{ color: STATUS_COLOR[d.status] }}>
        {d.status}
      </p>
      <p className="text-slate-300 font-mono">{d.raw_value} <span className="text-slate-500">PPM</span></p>
      <p className="text-slate-500">{new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  );
}

export default function HistoryPage() {
  const { data: readingsData } = useReadings();
  const deviceId = readingsData?.data[0]?.device_id;
  const location = readingsData?.data[0]?.location;

  const { data, isLoading, isError } = useHistory(deviceId);

  // API returns newest-first; reverse for chronological chart display
  const chartData = data ? [...data.data].reverse() : [];

  return (
    <div className="flex flex-col py-8 px-4 max-w-3xl w-full mx-auto space-y-6">

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Air Quality</p>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">History</h1>
        {location && (
          <p className="text-xs text-slate-500 mt-1 font-mono">{location.replaceAll('_', ' ')}</p>
        )}
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6">
        {isLoading && (
          <div className="h-64 flex items-center justify-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest animate-pulse">Loading...</p>
          </div>
        )}

        {isError && (
          <div className="h-64 flex items-center justify-center">
            <p className="text-xs text-red-400 uppercase tracking-widest">Failed to load history.</p>
          </div>
        )}

        {!isLoading && !isError && chartData.length === 0 && (
          <div className="h-64 flex items-center justify-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest">No readings yet.</p>
          </div>
        )}

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="ppmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

              <XAxis
                dataKey="recorded_at"
                tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 1023]}
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />

              {/* Threshold reference lines */}
              <ReferenceLine y={400} stroke="#fb923c" strokeDasharray="4 4" strokeOpacity={0.5}
                label={{ value: 'Moderate', position: 'insideTopRight', fill: '#fb923c', fontSize: 9 }} />
              <ReferenceLine y={700} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5}
                label={{ value: 'Critical', position: 'insideTopRight', fill: '#ef4444', fontSize: 9 }} />

              <Area
                type="monotone"
                dataKey="raw_value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#ppmGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6', stroke: '#1e293b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats row */}
      {chartData.length > 0 && (() => {
        const values = chartData.map(d => d.raw_value);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        const latest = chartData[chartData.length - 1];
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Latest', value: `${latest.raw_value} PPM`, color: STATUS_COLOR[latest.status] },
              { label: 'Average', value: `${avg} PPM`, color: '#94a3b8' },
              { label: 'Peak', value: `${max} PPM`, color: '#ef4444' },
              { label: 'Lowest', value: `${min} PPM`, color: '#22d3ee' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900/40 border border-white/5 rounded-[1.5rem] p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-black font-mono" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        );
      })()}

    </div>
  );
}

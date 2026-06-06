import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HourlyForecast } from '@/shared/types/weather';
import { formatHour, formatTemp } from '@/shared/lib/utils';
import type { Units } from '@/store/app.store';
import { useAppStore } from '@/store/app.store';

interface Props {
  hourly: HourlyForecast[];
}

export function HourlyChart({ hourly }: Props) {
  const units = useAppStore((s) => s.units) as Units;
  const data = hourly.slice(0, 24).map((h) => ({
    time: formatHour(h.dt),
    temp: Math.round(h.temp),
    feels: Math.round(h.feels_like),
    rain: Math.round(h.pop * 100),
  }));

  return (
    <div className="rounded-3xl border border-white/8 bg-white/4 p-4 sm:p-5">
      <h3 className="font-display font-bold text-sm uppercase tracking-widest text-slate-500 mb-5">
        24-Hour Temperature
      </h3>
      <div className="h-52 min-w-0 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 2, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="feelsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a6dff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1a6dff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Sans' }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Sans' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}°`}
            />
            <Tooltip
              contentStyle={{
                background: '#0a0e1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontFamily: 'DM Sans',
                fontSize: '12px',
                color: '#fff',
              }}
              formatter={(value: number, name: string) => [
                name === 'temp' ? formatTemp(value, units) : name === 'feels' ? formatTemp(value, units) : `${value}%`,
                name === 'temp' ? 'Temp' : name === 'feels' ? 'Feels like' : 'Rain %',
              ]}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#00e5ff"
              strokeWidth={2}
              fill="url(#tempGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#00e5ff' }}
            />
            <Area
              type="monotone"
              dataKey="feels"
              stroke="#1a6dff"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#feelsGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { Wind, Droplets, Eye, Gauge, ArrowUp, ArrowDown, Sunrise, Sunset, Thermometer } from 'lucide-react';
import type { WeatherResponse } from '@/shared/types/weather';
import { formatTemp, formatWind, getWindDirection, formatTime, getWeatherEmoji } from '@/shared/lib/utils';
import type { Units } from '@/store/app.store';
import { useAppStore } from '@/store/app.store';
import clsx from 'clsx';

interface Props {
  data: WeatherResponse;
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-xs font-display font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-white font-display font-bold text-lg">{value}</span>
    </div>
  );
}

export function CurrentWeatherCard({ data }: Props) {
  const units = useAppStore((s) => s.units) as Units;
  const { current, location } = data;
  const weather = current.weather[0];

  const emoji = getWeatherEmoji(weather.main);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10 p-6 md:p-8">
      {/* Decorative gradient blob */}
      <div
        className={clsx(
          'absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none',
          weather.main === 'Clear' && 'bg-amber-400',
          weather.main === 'Clouds' && 'bg-slate-400',
          (weather.main === 'Rain' || weather.main === 'Drizzle') && 'bg-blue-500',
          weather.main === 'Thunderstorm' && 'bg-purple-600',
          weather.main === 'Snow' && 'bg-blue-200',
          !['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(weather.main) && 'bg-cyan-500'
        )}
      />

      <div className="relative z-10">
        {/* Location + date */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-white">
              {location ?? data.timezone?.replace('_', ' ').split('/').pop()}
            </h2>
            <p className="text-slate-400 font-body text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-5xl animate-float">{emoji}</div>
        </div>

        {/* Main temp */}
        <div className="flex items-end gap-6 mb-6">
          <div>
            <div className="font-display font-bold text-8xl text-white leading-none tracking-tighter">
              {Math.round(current.temp)}
              <span className="text-4xl text-slate-400">°</span>
            </div>
            <p className="text-slate-300 font-body text-base capitalize mt-2">
              {weather.description}
            </p>
          </div>
          <div className="mb-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-sm font-body">
              <ArrowUp size={13} className="text-rose-400" />
              {formatTemp(current.temp_max, units)}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm font-body">
              <ArrowDown size={13} className="text-sky-400" />
              {formatTemp(current.temp_min, units)}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm font-body">
              <Thermometer size={13} className="text-orange-400" />
              Feels {formatTemp(current.feels_like, units)}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatPill
            icon={<Wind size={13} />}
            label="Wind"
            value={`${formatWind(current.wind_speed, units)} ${getWindDirection(current.wind_deg)}`}
          />
          <StatPill
            icon={<Droplets size={13} />}
            label="Humidity"
            value={`${current.humidity}%`}
          />
          <StatPill
            icon={<Eye size={13} />}
            label="Visibility"
            value={`${(current.visibility / 1000).toFixed(1)} km`}
          />
          <StatPill
            icon={<Gauge size={13} />}
            label="Pressure"
            value={`${current.pressure} hPa`}
          />
        </div>

        {/* Sunrise / Sunset */}
        {current.sunrise && current.sunset && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/8">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-body">
              <Sunrise size={14} />
              <span>{formatTime(current.sunrise)}</span>
            </div>
            <div className="flex items-center gap-2 text-orange-400 text-sm font-body">
              <Sunset size={14} />
              <span>{formatTime(current.sunset)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

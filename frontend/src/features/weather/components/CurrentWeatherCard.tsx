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
    <div className="flex flex-col gap-1.5 rounded-2xl border border-white/8 bg-white/4 p-3 transition-colors hover:bg-white/6 sm:p-4">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-xs font-display font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <span className="break-words text-base font-display font-bold text-white sm:text-lg">{value}</span>
    </div>
  );
}

export function CurrentWeatherCard({ data }: Props) {
  const units = useAppStore((s) => s.units) as Units;
  const { current, location } = data;
  const weather = current.weather[0];

  const emoji = getWeatherEmoji(weather.main);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-4 sm:p-6 md:p-8">
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
        <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold text-white sm:text-xl">
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
          <div className="shrink-0 animate-float text-4xl sm:text-5xl">{emoji}</div>
        </div>

        {/* Main temp */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0">
            <div className="font-display text-7xl font-bold leading-none tracking-tighter text-white sm:text-8xl">
              {Math.round(current.temp)}
              <span className="text-3xl text-slate-400 sm:text-4xl">°</span>
            </div>
            <p className="text-slate-300 font-body text-base capitalize mt-2">
              {weather.description}
            </p>
          </div>
          <div className="space-y-1 sm:mb-3">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
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
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/8 pt-4 sm:gap-6">
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

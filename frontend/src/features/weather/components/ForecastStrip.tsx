import type { DailyForecast } from '@/shared/types/weather';
import { formatTemp, formatDay, getWeatherEmoji } from '@/shared/lib/utils';
import type { Units } from '@/store/app.store';
import { useAppStore } from '@/store/app.store';
import { Droplets } from 'lucide-react';

interface Props {
  daily: DailyForecast[];
}

export function ForecastStrip({ daily }: Props) {
  const units = useAppStore((s) => s.units) as Units;
  const days = daily.slice(0, 7);

  return (
    <div className="rounded-3xl bg-white/4 border border-white/8 p-5">
      <h3 className="font-display font-bold text-sm uppercase tracking-widest text-slate-500 mb-4">
        7-Day Forecast
      </h3>
      <div className="space-y-1">
        {days.map((day, i) => {
          const weather = day.weather[0];
          const emoji = getWeatherEmoji(weather.main);
          const isToday = i === 0;
          return (
            <div
              key={day.dt}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <span className="text-sm font-display font-semibold text-slate-400 w-10 shrink-0">
                {isToday ? 'Today' : formatDay(day.dt)}
              </span>
              <span className="text-xl shrink-0">{emoji}</span>
              <span className="text-xs text-slate-500 font-body capitalize flex-1 truncate">
                {weather.description}
              </span>
              {day.pop > 0.1 && (
                <span className="flex items-center gap-1 text-xs text-sky-400 font-body shrink-0">
                  <Droplets size={11} />
                  {Math.round(day.pop * 100)}%
                </span>
              )}
              <div className="flex items-center gap-2 text-sm font-display font-semibold shrink-0">
                <span className="text-slate-500">{formatTemp(day.temp.min, units)}</span>
                <div className="w-16 h-1 rounded-full bg-white/10 relative overflow-hidden hidden md:block">
                  <div
                    className="absolute h-full rounded-full bg-gradient-to-r from-aurora-blue to-aurora-cyan"
                    style={{ width: '60%' }}
                  />
                </div>
                <span className="text-white">{formatTemp(day.temp.max, units)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

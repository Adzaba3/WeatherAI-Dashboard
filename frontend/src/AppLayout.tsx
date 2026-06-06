import { LayoutDashboard, CalendarDays, TreePine, Settings, Loader2, AlertTriangle, Zap, Thermometer, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import type { ActiveView } from '@/store/app.store';
import { useWeather, useWeatherByIp } from '@/features/weather/hooks/useWeather';
import { CurrentWeatherCard } from '@/features/weather/components/CurrentWeatherCard';
import { ForecastStrip } from '@/features/weather/components/ForecastStrip';
import { HourlyChart } from '@/features/weather/components/HourlyChart';
import { AiSummaryCard } from '@/features/weather/components/AiSummaryCard';
import { UsagePanel } from '@/features/weather/components/UsagePanel';
import { LocationSearch } from '@/features/weather/components/LocationSearch';
import { TreeAnalysisPanel } from '@/features/trees/components/TreeAnalysisPanel';
import { WeatherApiError } from '@/shared/lib/api-client';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

const navItems: Array<{ id: ActiveView; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'forecast', label: 'Forecast', icon: CalendarDays },
  { id: 'trees', label: 'Trees', icon: TreePine },
];

function NavItem({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[0];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all font-body text-sm font-medium',
        active
          ? 'bg-aurora-cyan/15 text-aurora-cyan'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      )}
    >
      <Icon size={16} />
      {item.label}
    </button>
  );
}

function MobileNavItem({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[0];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-body font-medium transition-all',
        active ? 'bg-aurora-cyan/15 text-aurora-cyan' : 'text-slate-500'
      )}
    >
      <Icon size={17} />
      <span>{item.label}</span>
    </button>
  );
}

function ErrorState({ error }: { error: unknown }) {
  const msg =
    error instanceof WeatherApiError
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Unknown error';
  return (
    <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
      <AlertTriangle size={18} className="text-red-400 shrink-0" />
      <div>
        <p className="text-sm font-display font-semibold text-red-300">Failed to load weather</p>
        <p className="text-xs text-slate-400 font-body mt-0.5">{msg}</p>
      </div>
    </div>
  );
}

function DashboardView() {
  const { data, isLoading, error } = useWeather();
  const geoQuery = useWeatherByIp(); // calls /v1/weather-geo when no active location exists

  if (geoQuery.isFetching && !data) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-body text-sm">Auto-detecting location via /v1/weather-geo…</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-body text-sm">Loading forecast via /v1/weather…</span>
      </div>
    );
  }

  if (error) return <ErrorState error={error} />;

  if (!data) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-white/4 border border-white/8">
        <Thermometer size={18} className="text-slate-500 shrink-0" />
        <p className="text-sm text-slate-400 font-body">
          Search for a city above or allow location detection to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {geoQuery.isSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-aurora-cyan/8 border border-aurora-cyan/15 px-4 py-2 text-xs text-slate-400 font-body">
          <MapPin size={13} className="text-aurora-cyan" />
          <span>
            Location detected via <span className="font-mono text-aurora-cyan">/v1/weather-geo</span>
          </span>
        </div>
      )}
      <CurrentWeatherCard data={data} />
      {data.ai_summary && <AiSummaryCard summary={data.ai_summary} />}
      {data.hourly && data.hourly.length > 0 && <HourlyChart hourly={data.hourly} />}
      {data.daily && data.daily.length > 0 && <ForecastStrip daily={data.daily} />}
    </div>
  );
}

function ForecastView() {
  const { data, isLoading, error } = useWeather();
  if (isLoading) return <div className="flex items-center gap-3 text-slate-500"><Loader2 size={18} className="animate-spin" /><span className="text-sm font-body">Loading…</span></div>;
  if (error) return <ErrorState error={error} />;
  if (!data?.daily) return <p className="text-sm text-slate-500 font-body">No forecast data available.</p>;
  return (
    <div className="space-y-4">
      <ForecastStrip daily={data.daily} />
      {data.hourly && <HourlyChart hourly={data.hourly} />}
    </div>
  );
}

function SettingsView() {
  const { units, setUnits } = useAppStore();
  return (
    <div className="space-y-5 max-w-md">
      <h2 className="font-display font-bold text-xl text-white">Settings</h2>
      <div className="p-5 rounded-2xl bg-white/4 border border-white/8 space-y-4">
        <div>
          <label className="text-xs font-display font-semibold uppercase tracking-widest text-slate-500 block mb-2">
            Temperature Units
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            {(['metric', 'imperial'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnits(u)}
                className={clsx(
                  'px-4 py-2 rounded-xl text-sm font-body font-medium transition-all',
                  units === u
                    ? 'bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                )}
              >
                {u === 'metric' ? '°C Metric' : '°F Imperial'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-display font-semibold uppercase tracking-widest text-slate-500 block mb-2">
            WeatherAI API
          </label>
          <p className="text-sm text-slate-400 font-body">
            The frontend calls the backend proxy. Configure the WeatherAI key in the backend environment.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { activeView, setActiveView } = useAppStore();

  const content = {
    dashboard: <DashboardView />,
    forecast: <ForecastView />,
    trees: (
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-white">Tree & Canopy Analysis</h2>
        <p className="text-sm text-slate-400 font-body leading-relaxed">
          Upload a drone or aerial farm image to count trees, assess canopy health, and get AI agronomic insights.
        </p>
        <TreeAnalysisPanel />
      </div>
    ),
  }[activeView] ?? <DashboardView />;

  return (
    <div className="min-h-[100dvh] bg-night-950 text-white font-body">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 h-72 w-72 rounded-full bg-aurora-blue/6 blur-3xl md:h-[500px] md:w-[500px]" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-aurora-purple/5 blur-3xl md:h-[400px] md:w-[400px]" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col md:h-screen md:flex-row md:overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-white/8 p-4 md:flex md:flex-col md:gap-1">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3 py-3 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aurora-cyan to-aurora-blue flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-sm text-white tracking-tight">WeatherAI</span>
          </div>

          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => setActiveView(item.id)}
            />
          ))}

          <div className="mt-auto">
            <NavItem
              item={{ id: 'dashboard', label: 'Settings', icon: Settings }}
              active={false}
              onClick={() => {
                // inline settings toggle hack
                const el = document.getElementById('settings-panel');
                if (el) el.classList.toggle('hidden');
              }}
            />
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
          {/* Top bar */}
          <header className="flex shrink-0 flex-col gap-3 border-b border-white/8 px-4 py-4 sm:flex-row sm:items-center md:h-14 md:px-6 md:py-0">
            <LocationSearch />
            <div className="w-full sm:ml-auto sm:w-auto">
              <UsagePanel />
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 sm:px-6 md:pb-6">
            <div className="mx-auto max-w-3xl space-y-5 md:space-y-6">
              <div id="settings-panel" className="hidden">
                <SettingsView />
              </div>
              {content}
            </div>
          </div>
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-20 flex gap-2 rounded-3xl border border-white/10 bg-night-900/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden">
          {navItems.map((item) => (
            <MobileNavItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => setActiveView(item.id)}
            />
          ))}
          <button
            onClick={() => {
              const el = document.getElementById('settings-panel');
              if (el) el.classList.toggle('hidden');
            }}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-body font-medium text-slate-500 transition-all"
          >
            <Settings size={17} />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

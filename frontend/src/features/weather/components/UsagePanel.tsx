import { useUsage } from '@/features/weather/hooks/useWeather';
import type { UsageResponse } from '@/shared/types/weather';
import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/** Resolve a numeric field that the API might return under several key names */
function resolveField(data: UsageResponse, ...keys: string[]): number {
  for (const key of keys) {
    const val = (data as Record<string, unknown>)[key];
    if (typeof val === 'number') return val;
  }
  return 0;
}

function resolveString(data: UsageResponse, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const val = (data as Record<string, unknown>)[key];
    if (typeof val === 'string') return val;
  }
  return undefined;
}

interface StatRowProps {
  label: string;
  used: number;
  limit: number;
  gradientClass: string;
}

function CompactStat({ label, used, limit, gradientClass }: StatRowProps) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="min-w-24 space-y-1">
      <div className="flex items-center justify-between gap-2 text-[10px] font-body">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-200 font-semibold whitespace-nowrap">
          {used.toLocaleString()} / {limit > 0 ? limit.toLocaleString() : '—'}
        </span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${gradientClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsagePanel() {
  const { data, isLoading } = useUsage();

  if (isLoading || !data) return null;

  const reqUsed = resolveField(data, 'requests_used', 'requestsUsed', 'used');
  const reqLimit = resolveField(data, 'requests_limit', 'requestsLimit', 'limit');
  const aiUsed = resolveField(data, 'ai_requests_used', 'aiRequestsUsed', 'ai_used');
  const aiLimit = resolveField(data, 'ai_requests_limit', 'aiRequestsLimit', 'ai_limit');
  const periodEnd = resolveString(data, 'period_end', 'periodEnd', 'reset_at', 'resetAt');

  // If nested quota object exists, prefer it
  const effectiveReqUsed = data.quota?.used ?? reqUsed;
  const effectiveReqLimit = data.quota?.limit ?? reqLimit;
  const effectiveAiUsed = data.ai?.used ?? aiUsed;
  const effectiveAiLimit = data.ai?.limit ?? aiLimit;
  const resetLabel = periodEnd
    ? `Resets ${formatDistanceToNow(new Date(periodEnd), { addSuffix: true })}`
    : undefined;

  return (
    <div
      className="h-10 rounded-2xl bg-white/4 border border-white/8 px-3 flex items-center gap-3"
      title={resetLabel}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <Activity size={13} className="text-aurora-cyan" />
        {data.plan && (
          <span className="text-[10px] font-mono text-aurora-cyan capitalize bg-aurora-cyan/10 px-1.5 py-0.5 rounded-full">
            {data.plan}
          </span>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-3">
        <CompactStat
          label="Requests"
          used={effectiveReqUsed}
          limit={effectiveReqLimit}
          gradientClass="bg-gradient-to-r from-aurora-blue to-aurora-cyan"
        />
        {(effectiveAiUsed > 0 || effectiveAiLimit > 0) && (
          <CompactStat
            label="AI"
            used={effectiveAiUsed}
            limit={effectiveAiLimit}
            gradientClass="bg-gradient-to-r from-aurora-purple to-aurora-blue"
          />
        )}
      </div>

      <div className="lg:hidden text-[10px] text-slate-400 font-body whitespace-nowrap">
        {effectiveReqUsed.toLocaleString()} / {effectiveReqLimit > 0 ? effectiveReqLimit.toLocaleString() : '—'}
      </div>
    </div>
  );
}

import { Sparkles } from 'lucide-react';

interface Props {
  summary: string;
}

export function AiSummaryCard({ summary }: Props) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-aurora-purple/15 to-aurora-blue/10 border border-aurora-purple/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-aurora-purple/30 flex items-center justify-center">
          <Sparkles size={13} className="text-aurora-cyan" />
        </div>
        <span className="font-display font-bold text-xs uppercase tracking-widest text-aurora-cyan">
          AI Insight
        </span>
      </div>
      <p className="text-slate-300 font-body text-sm leading-relaxed">{summary}</p>
    </div>
  );
}

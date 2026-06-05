import { useState, useRef } from 'react';
import { Upload, Leaf, AlertCircle, CheckCircle, TreePine, Loader2 } from 'lucide-react';
import { useTreeAnalysis, useTreeQuota } from '@/features/trees/hooks/useTrees';
import type { TreeAnalysisResult } from '@/shared/types/weather';
import clsx from 'clsx';

function QuotaBar({ used, limit, unlimited }: { used: number; limit: number; unlimited: boolean }) {
  const pct = unlimited ? 20 : Math.min((used / limit) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-aurora-teal to-aurora-cyan transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-500 shrink-0">
        {unlimited ? '∞' : `${used}/${limit}`}
      </span>
    </div>
  );
}

function HealthBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-body">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-semibold">{count}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

function AnalysisResults({ result }: { result: TreeAnalysisResult }) {
  const totalTrees = result.total_tree_count;
  return (
    <div className="space-y-4 mt-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Trees', value: result.total_tree_count },
          { label: 'Coverage', value: `${result.canopy_coverage_pct.toFixed(1)}%` },
          { label: 'Confidence', value: `${Math.round(result.confidence_score * 100)}%` },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-2xl bg-white/4 border border-white/8 text-center">
            <div className="font-display font-bold text-xl text-white">{s.value}</div>
            <div className="text-xs text-slate-500 font-body mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Health breakdown */}
      <div className="p-4 rounded-2xl bg-white/4 border border-white/8 space-y-3">
        <h4 className="font-display font-bold text-xs uppercase tracking-widest text-slate-500">
          Canopy Health
        </h4>
        <HealthBar label="Healthy" count={result.tree_health.healthy} total={totalTrees} color="bg-emerald-400" />
        <HealthBar label="Needs Care" count={result.tree_health.needs_care} total={totalTrees} color="bg-amber-400" />
        <HealthBar label="Needs Replacement" count={result.tree_health.needs_replacement} total={totalTrees} color="bg-red-400" />
      </div>

      {/* Species */}
      {result.tree_species_guess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-aurora-teal/10 border border-aurora-teal/20">
          <TreePine size={14} className="text-aurora-teal shrink-0" />
          <span className="text-sm text-slate-300 font-body italic">{result.tree_species_guess}</span>
        </div>
      )}

      {/* Observations */}
      {result.observations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-slate-500">
            Observations
          </h4>
          {result.observations.map((o, i) => (
            <div key={i} className="flex gap-2 text-sm text-slate-400 font-body">
              <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
              <span>{o}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-slate-500">
            Recommendations
          </h4>
          {result.recommendations.map((r, i) => (
            <div key={i} className="flex gap-2 text-sm text-slate-300 font-body">
              <CheckCircle size={13} className="text-emerald-400 mt-0.5 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Overlay image */}
      {result.overlay_image_url && (
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <img
            src={result.overlay_image_url}
            alt="Tree analysis overlay"
            className="w-full h-48 object-cover"
          />
        </div>
      )}
    </div>
  );
}

export function TreeAnalysisPanel() {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [farmerId, setFarmerId] = useState('');
  const [county, setCounty] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const mutation = useTreeAnalysis();
  const { data: quota } = useTreeQuota();

  const handleFile = (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    const fd = new FormData();
    fd.append('image', selectedFile);
    if (farmerId) fd.append('farmerId', farmerId);
    if (county) fd.append('county', county);
    mutation.mutate(fd);
  };

  return (
    <div className="space-y-5">
      {/* Quota */}
      {quota && (
        <div className="p-4 rounded-2xl bg-white/4 border border-white/8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-display font-bold uppercase tracking-widest text-slate-500">
              Analysis Quota
            </span>
            <span className="text-xs font-mono text-aurora-teal capitalize">{quota.plan}</span>
          </div>
          <QuotaBar used={quota.used} limit={quota.limit} unlimited={quota.unlimited} />
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={clsx(
          'rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all',
          dragOver
            ? 'border-aurora-cyan/60 bg-aurora-cyan/5'
            : preview
            ? 'border-white/10 p-0 overflow-hidden'
            : 'border-white/15 hover:border-white/25 hover:bg-white/3'
        )}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-2xl" />
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
              <Upload size={22} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-300 font-body">Drop a farm image here</p>
              <p className="text-xs text-slate-600 font-body mt-1">JPEG · PNG · WEBP · max 20MB</p>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {/* Optional fields */}
      {preview && (
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Farmer ID (optional)"
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 font-body outline-none focus:border-aurora-cyan/40 transition-colors"
          />
          <input
            type="text"
            placeholder="County (optional)"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 font-body outline-none focus:border-aurora-cyan/40 transition-colors"
          />
        </div>
      )}

      {/* Analyze button */}
      {selectedFile && (
        <button
          onClick={handleAnalyze}
          disabled={mutation.isPending}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-aurora-teal to-aurora-cyan text-night-950 font-display font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Leaf size={15} />
              Analyze Trees
            </>
          )}
        </button>
      )}

      {/* Error */}
      {mutation.isError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-body">
          {mutation.error instanceof Error ? mutation.error.message : 'Analysis failed'}
        </div>
      )}

      {/* Results */}
      {mutation.data && <AnalysisResults result={mutation.data} />}
    </div>
  );
}

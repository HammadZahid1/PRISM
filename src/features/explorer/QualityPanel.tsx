import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Download, Info, ShieldAlert, X } from 'lucide-react';
import type { Dataset } from '@/types';
import { analyzeDataQuality, qualityScoreLabel, type QualitySeverity } from '@/lib/data/quality';
import { Badge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { downloadBlob } from '@/lib/utils';
import { safeFileName } from '@/lib/data/export';

const severityStyles: Record<QualitySeverity, string> = {
  info: 'border-white/[0.08] bg-white/[0.03] text-[#8a94a3]',
  warning: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300',
  danger: 'border-red-400/20 bg-red-400/[0.06] text-red-300',
};

const severityIcons: Record<QualitySeverity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
};

export function QualityPanel({ dataset, onClose }: { dataset: Dataset; onClose: () => void }) {
  const report = useMemo(() => analyzeDataQuality(dataset), [dataset]);
  const tone = report.score >= 75 ? 'success' : report.score >= 55 ? 'warning' : 'danger';

  const exportReport = () => {
    const payload = {
      format: 'prism-quality-report',
      version: 1,
      exportedAt: new Date().toISOString(),
      dataset: { id: dataset.id, name: dataset.name },
      report,
    };
    downloadBlob(
      JSON.stringify(payload, null, 2),
      `${safeFileName(dataset.name)}-quality.json`,
      'application/json;charset=utf-8',
    );
  };

  return (
    <section className="panel shrink-0" aria-label="Data quality report">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-[var(--accent-cyan)]" />
          <h2 className="text-xs font-semibold text-[#e9edf3]">Data quality</h2>
          <Badge tone={tone}>{qualityScoreLabel(report.score)} · {report.score}/100</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<Download size={12} />} onClick={exportReport}>
            Export report
          </Button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close data quality report"
            className="text-[#5c6675] hover:text-[#e9edf3]"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-[#0d0f13] p-4">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(report.score / 100) * 214} 214`}
              />
            </svg>
            <span className="mono text-lg font-semibold text-[#e9edf3]">{report.score}</span>
          </div>
          <div className="mt-2 text-[10px] text-[#6c7685]">{qualityScoreLabel(report.score)}</div>
          <div className="mono mt-3 text-[9px] text-[#5c6675]">
            {report.missingCells.toLocaleString()} missing · {report.duplicateRows.toLocaleString()} duplicates
          </div>
        </div>
        <div>
          {report.issues.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-4 text-[11px] text-emerald-300">
              <CheckCircle2 size={14} /> No quality issues detected in {report.scannedRows.toLocaleString()} rows.
            </div>
          ) : (
            <ul className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
              {report.issues.map((issue) => {
                const Icon = severityIcons[issue.severity];
                return (
                  <li key={issue.id} className={`flex gap-2 rounded-lg border px-3 py-2 ${severityStyles[issue.severity]}`}>
                    <Icon size={13} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium">{issue.title}</div>
                      <p className="mt-0.5 text-[10px] leading-tight opacity-75">{issue.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

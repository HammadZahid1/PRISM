import { AlertTriangle, CheckCircle2, FileText, Layers3, Rows3 } from 'lucide-react';
import { Badge } from '@/components/ui/Primitives';
import { Notice } from '@/components/ui/Feedback';
import { formatBytes, toDisplay } from '@/lib/utils';
import { typeLabel } from '@/lib/data/types';
import type { ParsedData } from '@/types';

export interface ImportCandidate {
  name: string;
  size: number;
  parsed: ParsedData;
  issues: string[];
}

export function ImportPreview({ candidate }: { candidate: ImportCandidate }) {
  const { parsed } = candidate;
  const missingTotal = parsed.columns.reduce((sum, column) => sum + column.missing, 0);
  const errorCount = parsed.issues.length + candidate.issues.length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#0d0f13] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] p-1.5 text-[var(--accent-cyan)]">
          <FileText size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-[#e9edf3]">{candidate.name}</div>
          <div className="mono text-[9px] text-[#5c6675]">
            {formatBytes(candidate.size)} · {parsed.format.toUpperCase()}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="chip"><Rows3 size={10} /> {parsed.rows.length.toLocaleString()} rows</span>
          <span className="chip"><Layers3 size={10} /> {parsed.columns.length} columns</span>
          <Badge tone={missingTotal > 0 ? 'warning' : 'success'}>{missingTotal} missing</Badge>
          <Badge tone={errorCount > 0 ? 'warning' : 'success'}>{errorCount} issues</Badge>
        </div>
      </div>

      {candidate.issues.length > 0 && (
        <Notice tone="error">
          <div className="space-y-1">
            {candidate.issues.slice(0, 4).map((issue, index) => (
              <div key={index} className="flex items-start gap-1.5">
                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </Notice>
      )}

      {parsed.issues.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-400/15 bg-amber-400/[0.05] px-2.5 py-1.5 text-[10px] text-amber-200">
          <AlertTriangle size={11} />
          {parsed.issues.length} parsing note{parsed.issues.length === 1 ? '' : 's'} recorded.{' '}
          {parsed.issues[0]?.message}
        </div>
      )}

      <div className="min-h-0 overflow-hidden rounded-lg border border-white/[0.06]">
        <div className="max-h-[180px] overflow-auto">
          <table className="w-full border-collapse text-left text-[10px]">
            <thead className="sticky top-0 z-10 bg-[#14171c] text-[#8a94a3]">
              <tr>
                <th className="px-2 py-1.5 font-medium">Column</th>
                <th className="px-2 py-1.5 font-medium">Type</th>
                <th className="px-2 py-1.5 text-right font-medium">Missing</th>
                <th className="px-2 py-1.5 text-right font-medium">Distinct</th>
                <th className="px-2 py-1.5 font-medium">Sample</th>
              </tr>
            </thead>
            <tbody>
              {parsed.columns.map((column) => (
                <tr key={column.id} className="border-t border-white/[0.04] text-[#a2acba]">
                  <td className="px-2 py-1.5 font-medium text-[#dbe3ec]">{column.name}</td>
                  <td className="px-2 py-1.5"><Badge tone="accent" className="mono">{typeLabel(column.type)}</Badge></td>
                  <td className="mono px-2 py-1.5 text-right">{column.missing}</td>
                  <td className="mono px-2 py-1.5 text-right">{column.unique}</td>
                  <td className="max-w-[220px] truncate px-2 py-1.5 text-[#6c7685]">{column.sample?.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="min-h-0 overflow-hidden rounded-lg border border-white/[0.06]">
        <div className="max-h-[180px] overflow-auto">
          <table className="w-full border-collapse whitespace-nowrap text-left text-[10px]">
            <thead className="sticky top-0 z-10 bg-[#14171c] text-[#8a94a3]">
              <tr>
                <th className="px-2 py-1.5 font-medium">#</th>
                {parsed.columns.slice(0, 10).map((column) => (
                  <th key={column.id} className="px-2 py-1.5 font-medium">{column.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.rows.slice(0, 6).map((row, index) => (
                <tr key={index} className="border-t border-white/[0.04] text-[#a2acba]">
                  <td className="mono px-2 py-1.5 text-[#5c6675]">{index + 1}</td>
                  {parsed.columns.slice(0, 10).map((column) => (
                    <td key={column.id} className="mono px-2 py-1.5">{toDisplay(row[column.id])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {errorCount === 0 && (
        <div className="flex items-center gap-2 text-[10px] text-emerald-300">
          <CheckCircle2 size={12} /> Parsed successfully. Review the preview and confirm to load.
        </div>
      )}
    </div>
  );
}

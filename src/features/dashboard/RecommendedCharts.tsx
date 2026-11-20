import { useMemo } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { Dataset } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { chartLabel } from '@/lib/viz/config';
import { recommendCharts } from '@/lib/viz/recommend';

export function RecommendedCharts({ dataset }: { dataset: Dataset }) {
  const addChart = useAppStore((state) => state.addChart);
  const setModule = useAppStore((state) => state.setModule);
  const recommendations = useMemo(() => recommendCharts(dataset, 3), [dataset]);

  if (recommendations.length === 0) return null;

  return (
    <Panel
      title="Recommended visualizations"
      subtitle="Chosen from the shape of your active dataset"
      icon={<Sparkles size={14} />}
      actions={<span className="mono text-[9px] text-[#5c6675]">{recommendations.length} SUGGESTIONS</span>}
    >
      <div className="grid gap-2 md:grid-cols-3">
        {recommendations.map((item) => (
          <div
            key={item.type}
            className="flex min-h-[104px] flex-col justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#dbe3ec]">{chartLabel(item.type)}</span>
                <span className="mono text-[9px] text-[var(--accent-cyan)]">{item.score}</span>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-[#6c7685]">{item.reason}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              icon={<Plus size={12} />}
              className="mt-2 self-start"
              onClick={() => {
                addChart(item.config);
                setModule('studio');
              }}
            >
              Add chart
            </Button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

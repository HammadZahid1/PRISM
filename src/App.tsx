import { AppShell } from '@/components/layout/AppShell';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { useAppStore } from '@/stores/useAppStore';
import { EmptyState } from '@/components/ui/Feedback';
import { NAV_ITEMS } from '@/components/layout/Sidebar';
import { ImportDialog } from '@/features/dataset/ImportDialog';
import { DataExplorer } from '@/features/explorer/DataExplorer';
import { VisualizationStudio } from '@/features/studio/VisualizationStudio';

export default function App() {
  const module = useAppStore((state) => state.module);

  const active = NAV_ITEMS.find((item) => item.id === module);
  const content =
    module === 'dashboard' ? (
      <Dashboard />
    ) : module === 'explorer' ? (
      <DataExplorer />
    ) : module === 'studio' ? (
      <VisualizationStudio />
    ) : (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={active ? <active.icon size={20} /> : undefined}
          title={`${active?.label ?? module} workspace`}
          description="This module is being connected to the workspace state. Load a dataset from the dashboard to begin."
        />
      </div>
    );

  return (
    <>
      <AppShell>{content}</AppShell>
      <ImportDialog />
    </>
  );
}

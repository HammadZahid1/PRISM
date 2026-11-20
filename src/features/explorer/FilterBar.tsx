import { ArrowDown, ArrowUp, Plus, RotateCcw, Search, X } from 'lucide-react';
import type { DataFilter, FilterOperator, SortRule } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select, TextInput } from '@/components/ui/Primitives';
import { typeLabel } from '@/lib/data/types';

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'At least' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'At most' },
  { value: 'between', label: 'Between' },
  { value: 'empty', label: 'Is empty' },
  { value: 'not_empty', label: 'Not empty' },
];

export function FilterBar({ columns }: { columns: { id: string; name: string; type: string }[] }) {
  const filters = useAppStore((state) => state.filters);
  const sorts = useAppStore((state) => state.sorts);
  const search = useAppStore((state) => state.search);
  const addFilter = useAppStore((state) => state.addFilter);
  const updateFilter = useAppStore((state) => state.updateFilter);
  const removeFilter = useAppStore((state) => state.removeFilter);
  const clearFilters = useAppStore((state) => state.clearFilters);
  const setSearch = useAppStore((state) => state.setSearch);
  const toggleSort = useAppStore((state) => state.toggleSort);
  const clearSorts = useAppStore((state) => state.clearSorts);

  const operatorsFor = (columnId: string) => {
    const column = columns.find((item) => item.id === columnId);
    if (!column) return OPERATORS;
    if (column.type === 'number' || column.type === 'date') {
      return OPERATORS.filter((item) => !['contains'].includes(item.value));
    }
    return OPERATORS.filter((item) => !['gt', 'gte', 'lt', 'lte', 'between'].includes(item.value));
  };

  return (
    <div className="flex flex-col gap-2 border-b border-white/[0.06] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[180px] flex-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5c6675]" />
          <input
            className="control w-full pl-8"
            placeholder="Search all columns…"
            aria-label="Search all columns"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Button size="sm" icon={<Plus size={12} />} onClick={() => addFilter()} disabled={columns.length === 0}>
          Add filter
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<RotateCcw size={12} />}
          onClick={() => {
            clearFilters();
            clearSorts();
          }}
        >
          Reset
        </Button>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {filters.map((filter: DataFilter) => (
            <div key={filter.id} className="flex flex-wrap items-center gap-1.5">
              <IconButton
                label={filter.enabled ? 'Disable filter' : 'Enable filter'}
                size="sm"
                active={filter.enabled}
                icon={<span className={`h-1.5 w-1.5 rounded-full ${filter.enabled ? 'bg-[var(--accent-cyan)]' : 'bg-[#5c6675]'}`} />}
                onClick={() => updateFilter(filter.id, { enabled: !filter.enabled })}
              />
              <Select
                className="w-auto min-w-[120px]"
                value={filter.columnId}
                onChange={(event) => updateFilter(filter.id, { columnId: event.target.value })}
                aria-label="Filter column"
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name} · {typeLabel(column.type as Parameters<typeof typeLabel>[0])}
                  </option>
                ))}
              </Select>
              <Select
                className="w-auto min-w-[110px]"
                value={filter.operator}
                onChange={(event) => updateFilter(filter.id, { operator: event.target.value as FilterOperator })}
                aria-label="Filter operator"
              >
                {operatorsFor(filter.columnId).map((operator) => (
                  <option key={operator.value} value={operator.value}>{operator.label}</option>
                ))}
              </Select>
              {!['empty', 'not_empty'].includes(filter.operator) && (
                <>
                  <TextInput
                    className="w-28"
                    value={filter.value}
                    placeholder="Value"
                    aria-label="Filter value"
                    onChange={(event) => updateFilter(filter.id, { value: event.target.value })}
                  />
                  {filter.operator === 'between' && (
                    <TextInput
                      className="w-28"
                      value={filter.value2 ?? ''}
                      placeholder="Upper bound"
                      aria-label="Filter upper bound"
                      onChange={(event) => updateFilter(filter.id, { value2: event.target.value })}
                    />
                  )}
                </>
              )}
              <IconButton label="Remove filter" size="sm" icon={<X size={12} />} onClick={() => removeFilter(filter.id)} />
            </div>
          ))}
        </div>
      )}

      {sorts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">Sort</span>
          {sorts.map((rule: SortRule) => {
            const column = columns.find((item) => item.id === rule.columnId);
            return (
              <button
                type="button"
                key={rule.columnId}
                onClick={() => toggleSort(rule.columnId, true)}
                className="chip hover:border-[var(--accent-cyan)]/30"
                title="Cycle sort direction"
              >
                {column?.name ?? rule.columnId}
                {rule.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              </button>
            );
          })}
          <IconButton label="Clear sorting" size="sm" icon={<X size={12} />} onClick={clearSorts} />
        </div>
      )}
    </div>
  );
}

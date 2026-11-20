# Architecture

PRISM is a single-page React application. The build is client-only; every module talks to the same in-process state and data engine.

## Layers

### 1. Data engine (`src/lib/data`)

- `parse.ts` converts CSV, TSV, and JSON text into `Dataset` objects with stable column ids.
- `types.ts` infers column types from sampled values and formats display values.
- `query.ts` applies filters, sorts, and free-text search. Missing values are always sorted last.
- `stats.ts` computes descriptive statistics, percentiles, histograms, and correlations.
- `expression.ts` evaluates a deliberately small expression language for calculated columns. It never calls `eval`.
- `transform.ts` applies named, serializable operations such as rename, drop, fill, bin, and normalize.
- `export.ts` serializes rows and chart configurations to downloadable files.

### 2. Visualization engine (`src/lib/viz`)

- `config.ts` validates chart configurations and provides defaults for all 12 chart types.
- `prepare.ts` maps a filtered dataset plus a chart config into the shape expected by Recharts.
- `universe.ts` projects records into normalized 3D coordinates and colors for the R3F scene.

### 3. Persistence (`src/lib/storage`)

- `preferences.ts` stores appearance and performance settings in `localStorage`.
- `idb.ts` stores datasets and charts in IndexedDB, with a size guard to avoid pathological writes.
- `workspace.ts` validates and migrates exported backups.
- `usage.ts` estimates browser storage consumption.

### 4. State (`src/stores/useAppStore.ts`)

Zustand holds the active module, datasets, visualizations, filters, sorts, search, universe config, timeline state, settings, toasts, and activity log.

Undo/redo is implemented with snapshots of the data-critical slice: datasets, active dataset, charts, filters, sorts, and search. Each mutating action pushes the previous snapshot onto a bounded 30-entry history and clears the redo stack. UI-only actions such as opening a dialog are deliberately excluded from history.

### 5. UI

- `src/components/ui` contains buttons, panels, modals, and feedback primitives.
- `src/components/layout` owns the shell, sidebar, topbar, command palette, and toasts.
- `src/features` contains one directory per workspace. Workspaces are thin views over the data and state layers.

## Data flow

```
File / preset / sample
        │
        ▼
    parse.ts ──► Dataset (columns + rows)
        │
        ▼
   query.ts ──► filtered rows (filters + sorts + search)
        │
        ├──► stats.ts / pattern analysis
        ├──► prepare.ts ──► Recharts
        ├──► universe.ts ──► Three.js
        └──► export.ts ──► local downloads
```

## Determinism

Preset datasets and pattern-detection helpers use seeded pseudo-random generators. A given preset seed always produces the same rows, which makes screenshots, tests, and shared configurations reproducible.

## Privacy and safety

- No network calls are made after the initial static asset load.
- Expression evaluation is restricted to a small grammar and safe built-ins.
- Backups are validated before they are applied to state.
- Large datasets are capped by settings before rendering in expensive views such as the 3D universe.

## Testing

Vitest covers pure logic modules: parsing, type inference, queries, statistics, transformations, expressions, exports, presets, visualization preparation, universe mapping, storage helpers, and application state actions. UI workspaces are intentionally kept free of business logic so that behavior remains testable without a DOM.

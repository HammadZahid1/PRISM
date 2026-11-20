# PRISM

PRISM is a premium, browser-based interactive data visualization workspace. It runs entirely on the client: datasets are parsed locally, every transformation stays in memory, and persistence uses only your browser's `localStorage` and IndexedDB. There is no backend, account system, API key, or remote data processing.

## Why PRISM?

- **Private by design** — files never leave your device.
- **Fast feedback** — parse, explore, transform, and visualize in one workspace.
- **Deep exploration** — 12 chart types, a 3D data universe, statistics, pattern discovery, and deterministic sample generators.
- **Composable** — every chart has a reusable configuration that can be exported, restored, or replayed against another dataset.

## Modules

| Module | What it does |
| --- | --- |
| Dashboard | Load sample datasets or import your own; jump into any workspace. |
| Import | Parse CSV, TSV, or JSON files with live validation and preview. |
| Explorer | Search, sort, filter, paginate, and inspect rows and columns. |
| Studio | Build a dashboard of up to four synchronized charts. |
| Universe | Map records into an interactive Three.js point cloud. |
| Statistics | Summary metrics, distribution, and correlations. |
| Patterns | Deterministic clustering, outliers, and association discovery. |
| Transform | Add derived columns, clean values, and reshape data safely. |
| Timeline | Analyze time-indexed datasets and event sequences. |
| Playground | Experiment with transformations and expressions before committing. |
| Presets | Generate reproducible synthetic datasets. |
| Export | Download filtered data as CSV/JSON, charts as PNG/SVG, and configurations. |
| Settings | Appearance, performance, storage, backup, and restore controls. |

Additional capabilities include dataset quality reports, one-click chart recommendations, a searchable command palette, and a local shortcut reference (`?`).

## Getting started

```bash
npm install
npm run dev
```

Open the URL printed by Vite. To create a production bundle:

```bash
npm run build
npm run preview
```

## Quality checks

```bash
npm test
npm run typecheck
npm run build
```

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + O` | Import dialog |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo |
| `1`–`7` | Switch between main modules |
| `?` | Show the keyboard shortcut reference |
| `Esc` | Close dialogs and overlays |

## Architecture

- `src/lib/data` — parsing, type inference, query engine, statistics, transforms, and exports.
- `src/lib/viz` — chart preparation and 3D universe mapping.
- `src/lib/storage` — local persistence, preferences, backups, and storage estimates.
- `src/stores` — Zustand application state with snapshot history.
- `src/features` — workspaces composed from shared UI primitives.
- `src/components` — layout, charts, and reusable UI primitives.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [User guide](docs/USER_GUIDE.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

CI runs `npm run check` on every push and pull request to `main`.

## License

MIT

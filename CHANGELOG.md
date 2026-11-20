# Changelog

All notable changes to PRISM are documented here. The project follows semantic versioning.

## 1.0.0

### Added

- Client-only workspace shell with 12 modules, responsive navigation, and command palette.
- Local CSV, TSV, and JSON import with preview, validation, and type inference.
- Data Explorer with sorting, multi-operators filters, search, pagination, column visibility, and row inspector.
- 12 visualization types with a shared configuration schema, validation, and reusable chart configs.
- Visualization Studio with multi-chart grid, maximize, duplicate, delete, and export workflows.
- Data Universe 3D point-cloud mapping with five display modes and point inspection.
- Statistics, pattern discovery, safe expression evaluation, transformations, timeline playback, and playground.
- Eight deterministic preset generators for reproducible sample data.
- Export Studio for filtered rows, charts, and configurations.
- Local persistence with IndexedDB datasets, preference storage, workspace backups, and storage estimates.
- Undo/redo history, keyboard shortcuts, shortcut reference dialog, and accessible focus handling.
- Dataset quality analysis with missing-value, duplicate, constant, outlier, and identifier checks.
- Chart recommendations based on dataset shape, surfaced as one-click dashboard actions.
- Error boundary, skip link, labeled landmarks, modal focus trap, and reduced-motion support.
- Vitest coverage for data engines, storage helpers, visualization preparation, state, and shortcut rules.
- CI verification for typecheck, tests, and production build, plus grouped dependency updates.

### Changed

- Missing values now sort to the end in both ascending and descending order.
- Empty and not-empty filters correctly treat blank strings as missing.
- JSON columns whose names are already stable ids are no longer removed during parsing.
- Large datasets are capped before rendering in expensive views.

### Security

- Expression evaluation remains restricted to a safe grammar without `eval` or dynamic function construction.
- Backups are validated before being applied to workspace state.
- No network service, API key, or remote processing is used anywhere in the application.

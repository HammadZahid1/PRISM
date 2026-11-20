# Security and privacy

PRISM is designed as a local-first analysis tool. This document describes the boundaries of that model.

## Data handling

- Files selected in the import dialog are read with the browser File API and parsed in memory.
- Datasets and chart configurations are written only to IndexedDB when **Persist datasets** is enabled.
- Preferences are stored in `localStorage` under the `prism.preferences.v1` key.
- No HTTP requests are issued by application code after static assets are loaded.
- No analytics, crash reporting, authentication, or remote AI service is integrated.

## Expression safety

Calculated columns use a restricted expression parser in `src/lib/data/expression.ts`. It supports arithmetic, comparisons, conditionals, and a small set of whitelisted helpers. It does not call `eval`, `new Function`, or access browser globals supplied by the dataset.

## Backup validation

Workspace backups are parsed by `validateWorkspaceBackup` before being applied. Charts referencing missing datasets are dropped, and malformed dataset or chart records are rejected rather than merged into state.

## Rendering limits

Large imports are accepted, but expensive views apply explicit caps:

- table rendering respects the **Maximum table rows** setting;
- the 3D universe respects the **Universe points** setting;
- datasets above the persistence size guard are kept in memory only.

These limits protect browser responsiveness and avoid accidental large writes to local storage.

## Reporting a concern

Open an issue with a minimal reproduction, the affected module, and the PRISM version. Do not include sensitive dataset contents; synthetic fixtures are sufficient.

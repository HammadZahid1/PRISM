# Contributing to PRISM

## Principles

- PRISM is client-only. Do not introduce a backend, authentication, telemetry, or network calls for analysis.
- Keep business logic in `src/lib` so it can be tested without rendering React.
- Workspaces should compose existing primitives and state actions rather than duplicating behavior.
- Prefer deterministic algorithms; seeded randomness must be reproducible.

## Setup

```bash
npm install
npm run dev
```

## Before opening a pull request

Run the full verification command:

```bash
npm run check
```

This runs the TypeScript build, all Vitest suites, and a production Vite build.

## Commit style

Use short imperative subjects prefixed with a conventional type:

- `feat:` new user-facing capability
- `fix:` bug correction
- `test:` new or expanded automated coverage
- `a11y:` accessibility improvement
- `docs:` documentation
- `ci:` automation and tooling
- `chore:` maintenance that does not change behavior

Keep each commit focused and self-contained.

## Adding a chart type

1. Add the type to `ChartType` and `CHART_TYPES` in `src/lib/viz/config.ts`.
2. Add defaults in `baseConfig` and field mappings in `autoConfig`.
3. Extend `validateConfig` with field requirements.
4. Add a branch to `prepareChartData` in `src/lib/viz/prepare.ts`.
5. Render the chart in `src/components/charts/ChartRenderer.tsx`.
6. Add tests for preparation and validation.

## Adding a transformation

Implement the operation as a pure function in `src/lib/data/transform.ts`, register its label and argument schema, and add a test that verifies both the transformed rows and the preserved column metadata.

## Testing

Tests live next to the module they cover with a `.test.ts` suffix. Use pure fixtures and avoid `Math.random()` or wall-clock values in assertions. The store test stubs browser globals where needed.

## Reporting issues

Include the dataset shape (column names and types), the steps to reproduce, the affected module, and the output of `npm run check` when possible.

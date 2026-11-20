# User guide

## Loading data

1. Open **Dashboard** and choose **Import file**, or press `Ctrl/Cmd + O`.
2. Select a `.csv`, `.tsv`, or `.json` file. PRISM reads it with the File API and previews the parsed columns before anything is stored.
3. Confirm the import. The dataset becomes active and is added to the recent-datasets list.

You can also generate a deterministic sample from **Presets**, or load one of the built-in showcase datasets from the dashboard.

## Exploring rows

The **Explorer** applies the current filters, sorts, and search query to the active dataset.

- Click a column header to cycle through ascending, descending, and no sort. Hold the additive modifier in the UI to build multi-column sorts.
- Use **Filter** to add operators such as contains, equals, greater than, empty, and not empty.
- The search box matches text across visible columns.
- Column visibility can be toggled in the table toolbar.
- Clicking a row opens the inspector with the full record.

All of these controls affect charts, statistics, and exports because they share the same query state.

Open **Quality** in the explorer toolbar for a report on missing values, duplicate rows, constant columns, numeric outliers, and identifier-like fields. The report can be downloaded as JSON for later review.

## Building charts

1. Open **Studio** and create a chart.
2. Choose one of the 12 chart types, then map columns to axes, series, size, or color as appropriate.
3. Use the configuration panel to tune labels, bins, aggregation, appearance, and limits.
4. Duplicate a chart to compare variants, or maximize one for presentation.

Chart configurations are reversible with undo/redo and can be exported as JSON from the Export workspace.

The dashboard also shows up to three recommended chart types based on your active dataset's columns. Choosing **Add chart** creates the suggested configuration and opens the studio.

## Data Universe

The **Universe** maps each row to a point in 3D space. Choose numeric columns for X, Y, and Z, a categorical or numeric column for color, and a size column if desired. Drag to orbit, scroll to zoom, and click a point to inspect its source row.

The point cap comes from **Settings → Performance**, which keeps WebGL responsive on large datasets.

## Statistics and patterns

- **Statistics** shows count, missing values, numeric summaries, percentiles, histograms, and pairwise correlations.
- **Patterns** surfaces deterministic clusters, outliers, and column associations using seeded algorithms so results do not change on every visit.

## Transformations

The **Transform** workspace records operations as a list. Each operation produces a new dataset snapshot, so undo restores the previous columns and rows. Available operations include rename, drop, type conversion, fill missing values, derive a column with a safe expression, bin numeric values, and normalize.

Safe expressions support arithmetic, comparisons, `if(condition, a, b)`, common string helpers, and column references. They never execute arbitrary JavaScript.

## Timeline

Choose a date column and a metric column. The timeline workspace buckets records by time, offers a scrubber and playback controls, and updates the visualization as the window moves.

## Exporting

The **Export** workspace writes files directly from the browser:

- filtered rows as CSV or JSON;
- the active chart as PNG or SVG;
- chart and workspace configuration as JSON;
- a complete workspace backup from **Settings**.

## Settings and storage

Appearance controls include accent color, density, grid, and animation. Performance controls cap visible rows and universe points. Storage controls show usage, clear saved data, and restore a workspace backup.

Datasets above the local persistence size limit remain available for the current session but are not written to IndexedDB.

## Tips

- Press `?` inside the app to see the shortcut reference.
- The command palette (`Ctrl/Cmd + K`) can switch modules, open datasets, select charts, and run actions.
- Nothing is uploaded. Clearing browser site data removes locally saved datasets and charts.

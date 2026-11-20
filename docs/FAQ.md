# Frequently asked questions

## Where is my data stored?

In your browser only. Active datasets live in memory for the session. If persistence is enabled, datasets and charts are written to IndexedDB; preferences are stored in `localStorage`.

## Does PRISM upload files?

No. Parsing, statistics, pattern discovery, and rendering all happen locally. There is no backend or API key.

## What file formats are supported?

CSV, TSV, and JSON. Delimiters are detected for CSV/TSV, and JSON is normalized into a columnar table.

## Why was my large dataset not saved?

Datasets above the local persistence size guard are kept for the current session but skipped when writing to IndexedDB. This prevents browser storage failures and keeps startup fast.

## Why do missing values appear at the bottom when sorting?

PRISM deliberately pushes missing values to the end in both ascending and descending order so that valid measurements remain grouped at the top.

## How do I recover a previous state?

Use `Ctrl/Cmd + Z` or the undo button in the topbar. The last 30 data-changing snapshots are kept. Opening dialogs and switching modules are not part of history.

## Can I share a chart?

Export its configuration from the Export Studio as JSON. Another PRISM user can restore that configuration against a compatible dataset.

## How do recommendations work?

The dashboard and command palette inspect the active dataset's columns: dates plus numbers suggest line/area charts, multiple numbers suggest scatter/bubble charts, and low-cardinality categories suggest bar or part-to-whole views.

## Which browsers are supported?

Any current Chromium, Firefox, or Safari release with IndexedDB, WebGL, and ES module support. The 3D universe requires WebGL.

## How do I remove all local data?

Open **Settings → Storage** and choose the destructive clear action, or clear site data in your browser's developer tools.

import type { ChartConfig, Dataset } from '@/types';
import type { Row } from './stats';

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function rowsToCsv(columns: Dataset['columns'], rows: Row[]): string {
  const header = columns.map((column) => escapeCsv(column.name)).join(',');
  const body = rows.map((row) => columns.map((column) => escapeCsv(row[column.id])).join(',')).join('\n');
  return `${header}\n${body}`;
}

export function rowsToJson(columns: Dataset['columns'], rows: Row[]): string {
  return JSON.stringify(
    rows.map((row) => Object.fromEntries(columns.map((column) => [column.name, row[column.id] ?? null]))),
    null,
    2,
  );
}

export function datasetExport(
  dataset: Dataset,
  rows: Row[],
  format: 'csv' | 'json',
): { content: string; mime: string; extension: string } {
  if (format === 'csv') {
    return { content: rowsToCsv(dataset.columns, rows), mime: 'text/csv;charset=utf-8', extension: 'csv' };
  }
  return { content: rowsToJson(dataset.columns, rows), mime: 'application/json', extension: 'json' };
}

export function safeFileName(name: string): string {
  return name.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'prism-export';
}

export function serializeSvg(element: Element): string {
  const clone = element.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  return new XMLSerializer().serializeToString(clone);
}

export async function svgToPng(element: Element, width = 1600, height = 1000): Promise<Blob> {
  const svg = serializeSvg(element);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not rasterize the chart.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available in this browser.');
    context.fillStyle = '#0b0d10';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed.'))), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function chartConfigPayload(config: ChartConfig, dataset?: Dataset) {
  return {
    format: 'prism-chart-config',
    version: 1,
    exportedAt: new Date().toISOString(),
    chart: config,
    dataset: dataset
      ? { id: dataset.id, name: dataset.name, columns: dataset.columns.map((column) => column.name) }
      : undefined,
  };
}

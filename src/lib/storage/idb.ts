import type { ChartConfig, Dataset } from '@/types';

const DB_NAME = 'prism-workspace';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('datasets')) db.createObjectStore('datasets', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('charts')) db.createObjectStore('charts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function requestOutcome<T>(request: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function persistDataset(dataset: Dataset): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  await requestOutcome(db.transaction('datasets', 'readwrite').objectStore('datasets').put(dataset));
  db.close();
  return true;
}

export async function persistedDatasets(): Promise<Dataset[]> {
  const db = await openDatabase();
  if (!db) return [];
  const result = await requestOutcome(db.transaction('datasets', 'readonly').objectStore('datasets').getAll());
  db.close();
  return (result ?? []) as Dataset[];
}

export async function removePersistedDataset(id: string): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  await requestOutcome(db.transaction('datasets', 'readwrite').objectStore('datasets').delete(id));
  db.close();
}

export async function persistCharts(charts: ChartConfig[]): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  const transaction = db.transaction('charts', 'readwrite');
  const store = transaction.objectStore('charts');
  store.clear();
  charts.forEach((chart) => store.put(chart));
  await new Promise<void>((resolve) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
  db.close();
  return true;
}

export async function persistedCharts(): Promise<ChartConfig[]> {
  const db = await openDatabase();
  if (!db) return [];
  const result = await requestOutcome(db.transaction('charts', 'readonly').objectStore('charts').getAll());
  db.close();
  return (result ?? []) as ChartConfig[];
}

export async function clearWorkspaceStorage(): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  const transaction = db.transaction(['datasets', 'charts', 'meta'], 'readwrite');
  ['datasets', 'charts', 'meta'].forEach((name) => transaction.objectStore(name).clear());
  await new Promise<void>((resolve) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
  db.close();
}

export function datasetStorageSize(dataset: Dataset): number {
  return dataset.rows.length * Math.max(1, dataset.columns.length) * 48;
}

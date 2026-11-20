import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileJson, FileSpreadsheet, FileText, Upload, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { useAppStore } from '@/stores/useAppStore';
import { parseContent, validateParsed } from '@/lib/data/parse';
import type { ParsedData } from '@/types';
import { formatBytes, uid } from '@/lib/utils';
import { typeLabel } from '@/lib/data/types';
import { ImportPreview } from './ImportPreview';

interface Candidate {
  name: string;
  size: number;
  parsed: ParsedData;
  issues: string[];
}

export function ImportDialog() {
  const open = useAppStore((state) => state.importOpen);
  const setOpen = useAppStore((state) => state.setImportOpen);
  const addDataset = useAppStore((state) => state.addDataset);
  const setModule = useAppStore((state) => state.setModule);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setOpen(false);
    setCandidate(null);
    setError(null);
  };

  const readFile = async (file: File) => {
    setError(null);
    setCandidate(null);
    setBusy(true);
    try {
      if (file.size > 60 * 1024 * 1024) throw new Error('Files larger than 60 MB are not supported in the browser importer.');
      const content = await file.text();
      const parsed = parseContent(file.name, content);
      const issues = validateParsed(parsed);
      setCandidate({ name: file.name, size: file.size, parsed, issues });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read this file.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (!candidate) return;
    const timestamp = Date.now();
    addDataset({
      id: uid('ds'),
      name: candidate.name.replace(/\.[^.]+$/, ''),
      description: `Imported from ${candidate.name}`,
      source: 'upload',
      fileName: candidate.name,
      fileSize: candidate.size,
      columns: candidate.parsed.columns,
      rows: candidate.parsed.rows,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: [candidate.parsed.format, 'imported'],
    });
    close();
    setModule('explorer');
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import dataset"
      subtitle="CSV, TSV and JSON files are parsed locally in your browser"
      icon={<Upload size={16} />}
      width="max-w-4xl"
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!candidate || candidate.issues.length > 0}
            icon={<CheckCircle2 size={14} />}
            onClick={confirm}
          >
            Load dataset
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose a file or drop it here"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void readFile(file);
          }}
          className={`surface-grid flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-9 text-center transition-colors ${
            dragging
              ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/[0.07]'
              : 'border-white/[0.12] bg-white/[0.015] hover:border-[var(--accent-cyan)]/40'
          }`}
        >
          <span className="rounded-xl border border-[var(--accent-cyan)]/20 bg-[var(--accent-cyan)]/[0.07] p-2.5 text-[var(--accent-cyan)]">
            <Upload size={18} />
          </span>
          <div className="text-xs font-medium text-[#dbe3ec]">
            {busy ? 'Parsing file…' : 'Drop a data file here or click to browse'}
          </div>
          <div className="text-[10px] text-[#6c7685]">CSV · TSV · JSON · maximum 60 MB · data never leaves this device</div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.tab,.json,text/csv,application/json,text/tab-separated-values"
            className="hidden"
            data-modal-autofocus
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readFile(file);
              event.target.value = '';
            }}
          />
        </div>

        {error && (
          <Notice tone="error">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle size={13} /> {error}
            </span>
          </Notice>
        )}

        {candidate && (
          <ImportPreview candidate={candidate} />
        )}

        {!candidate && !error && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#5c6675]">
            <span className="inline-flex items-center gap-1"><FileSpreadsheet size={11} /> CSV / TSV</span>
            <span className="inline-flex items-center gap-1"><FileJson size={11} /> JSON arrays</span>
            <span className="inline-flex items-center gap-1"><FileText size={11} /> Auto type detection</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function formatTypeBadge(type: string) {
  return typeLabel(type as Parameters<typeof typeLabel>[0]);
}

export function describeFile(candidate: Candidate) {
  return `${formatBytes(candidate.size)}`;
}

export function dismissButton(onClick: () => void) {
  return (
    <Button size="sm" variant="ghost" icon={<X size={12} />} onClick={onClick}>
      Clear
    </Button>
  );
}

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { StepRecord } from '../../types';

function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseCSV(text: string): StepRecord[] {
  const records: StepRecord[] = [];
  const lines = text.trim().split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const [timestampStr, stepsStr] = trimmed.split(',');
    const timestamp = parseInt(timestampStr, 10);
    const steps = parseInt(stepsStr, 10);

    if (isNaN(timestamp) || isNaN(steps)) continue;

    const date = new Date(timestamp);
    const dateStr = toLocalDate(date);
    records.push({ date: dateStr, steps });
  }

  return records;
}

export default function CsvImport() {
  const { importStepRecords, clearAllData, stepsData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<StepRecord[]>([]);
  const [status, setStatus] = useState<'idle' | 'preview' | 'importing' | 'success' | 'error'>('idle');
  const [importCount, setImportCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    setStatus('preview');
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const records = parseCSV(text);
        if (records.length === 0) {
          setStatus('error');
          setErrorMessage('No valid records found in the CSV file.');
          return;
        }
        setParsedRecords(records);
      } catch (err) {
        setStatus('error');
        setErrorMessage('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.name.endsWith('.csv')) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (parsedRecords.length === 0) return;
    setStatus('importing');
    try {
      const count = await importStepRecords(parsedRecords);
      setImportCount(count);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleClearAll = async () => {
    await clearAllData();
    setShowClearConfirm(false);
    setStatus('idle');
    setSelectedFile(null);
    setParsedRecords([]);
  };

  const reset = () => {
    setStatus('idle');
    setSelectedFile(null);
    setParsedRecords([]);
    setErrorMessage('');
  };

  const dateRange =
    parsedRecords.length > 0
      ? `${parsedRecords[0].date} → ${parsedRecords[parsedRecords.length - 1].date}`
      : '';

  return (
    <div className="space-y-4">
      {/* Import Card */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-white font-medium mb-1 flex items-center gap-2">
              <Upload size={16} className="text-emerald-400" /> Import Step Data
            </h4>
            <p className="text-xs text-neutral-500">
              Upload a CSV file with format: <code className="text-emerald-400/70">timestamp_ms,steps</code>
            </p>
          </div>
          {stepsData.records.length > 0 && (
            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full">
              {stepsData.records.length} days stored
            </span>
          )}
        </div>

        {/* Drop Zone */}
        {status === 'idle' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive
                ? 'drop-zone-active border-emerald-400'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/20'
            }`}
          >
            <Upload size={28} className={`mb-3 ${dragActive ? 'text-emerald-400' : 'text-neutral-600'}`} />
            <p className="text-sm text-neutral-400">
              {dragActive ? 'Drop CSV file here' : 'Click or drag CSV file to import'}
            </p>
            <p className="text-[10px] text-neutral-600 mt-1 font-mono">Accepts .csv files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {/* Preview */}
        {status === 'preview' && parsedRecords.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
              <FileText size={18} className="text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{selectedFile?.name}</p>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  {parsedRecords.length} records • {dateRange}
                </p>
              </div>
              <button onClick={reset} className="text-xs text-neutral-500 hover:text-white transition-colors">
                Cancel
              </button>
            </div>

            {/* Preview table */}
            <div className="overflow-hidden rounded-lg border border-neutral-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-900/50">
                    <th className="text-left text-[10px] font-mono text-neutral-500 uppercase px-4 py-2">Date</th>
                    <th className="text-right text-[10px] font-mono text-neutral-500 uppercase px-4 py-2">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRecords.slice(0, 5).map((r) => (
                    <tr key={r.date} className="border-t border-neutral-800/50">
                      <td className="px-4 py-2 text-neutral-300 font-mono text-xs">{r.date}</td>
                      <td className="px-4 py-2 text-right text-white font-mono text-xs tabular-nums">
                        {r.steps.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {parsedRecords.length > 5 && (
                    <tr className="border-t border-neutral-800/50">
                      <td colSpan={2} className="px-4 py-2 text-center text-neutral-600 text-[10px] font-mono">
                        ... and {parsedRecords.length - 5} more records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleImport}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} /> Import {parsedRecords.length} Records to Drive
            </button>
          </div>
        )}

        {/* Importing */}
        {status === 'importing' && (
          <div className="h-36 rounded-xl border border-neutral-800 flex flex-col items-center justify-center bg-neutral-900/20">
            <Loader2 size={28} className="text-emerald-400 animate-spin mb-3" />
            <p className="text-sm text-neutral-400">Importing to Google Drive...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="space-y-3">
            <div className="h-36 rounded-xl border border-emerald-500/30 flex flex-col items-center justify-center bg-emerald-500/5">
              <CheckCircle size={28} className="text-emerald-400 mb-3" />
              <p className="text-sm text-white font-medium">
                ✓ {importCount} days imported successfully
              </p>
              <p className="text-[10px] text-neutral-500 font-mono mt-1">{dateRange}</p>
            </div>
            <button
              onClick={reset}
              className="w-full py-2 rounded-lg border border-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Import Another File
            </button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-3">
            <div className="h-36 rounded-xl border border-red-500/30 flex flex-col items-center justify-center bg-red-500/5">
              <AlertCircle size={28} className="text-red-400 mb-3" />
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
            <button
              onClick={reset}
              className="w-full py-2 rounded-lg border border-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Clear Data */}
      {stepsData.records.length > 0 && (
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-400/70 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} /> Clear all step data
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-300">
                This will permanently delete all {stepsData.records.length} days of step data. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  Yes, delete everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

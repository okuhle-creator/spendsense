import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import {
  parseCSVFile,
  detectColumns,
  processCSVRows,
  generateSampleGooglePayCSV,
  ColumnMapping,
} from '../../engine/csvParser';
import { decimalToCents } from '../../engine/calculations';
import { CSVParseRow, Transaction } from '../../types';
import {
  Upload,
  FileText,
  CheckCircle2,
  Download,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'mapping' | 'preview';

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, addBatchTransactions, showToast } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateCol: '',
    amountCol: '',
    descriptionCol: '',
  });

  const [processedRows, setProcessedRows] = useState<CSVParseRow[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const resetState = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setMapping({ dateCol: '', amountCol: '', descriptionCol: '' });
    setProcessedRows([]);
    setSelectedRowIndices(new Set());
    setUploadError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    try {
      setFileName(file.name);
      const text = await file.text();
      const parsed = await parseCSVFile(text);

      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setUploadError('The selected file appears to be empty or contains no readable rows.');
        return;
      }

      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto-detect columns
      const detected = detectColumns(parsed.headers);
      setMapping(detected);

      setStep('mapping');
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Failed to parse CSV file. Ensure it is a valid format.');
    }
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleGooglePayCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'google-pay-upi-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sample Google Pay CSV downloaded', 'info');
  };

  const handleProceedToPreview = () => {
    if (!mapping.dateCol || !mapping.amountCol || !mapping.descriptionCol) {
      setUploadError('Please map at least Date, Amount, and Description columns.');
      return;
    }

    const processed = processCSVRows(rawRows, mapping, transactions);
    setProcessedRows(processed);

    // Default select all valid non-duplicate rows
    const initialSelected = new Set<number>();
    processed.forEach((row, idx) => {
      if (!row.error && !row.isDuplicate) {
        initialSelected.add(idx);
      }
    });
    setSelectedRowIndices(initialSelected);

    setUploadError(null);
    setStep('preview');
  };

  const toggleRowSelection = (idx: number) => {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      const allValid = new Set<number>();
      processedRows.forEach((r, idx) => {
        if (!r.error) allValid.add(idx);
      });
      setSelectedRowIndices(allValid);
    } else {
      setSelectedRowIndices(new Set());
    }
  };

  const handleCommitImport = async () => {
    const toImport: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    selectedRowIndices.forEach((idx) => {
      const row = processedRows[idx];
      if (row && !row.error) {
        toImport.push({
          amountCents: decimalToCents(row.amount),
          type: row.type || 'expense',
          category: row.category || 'Other',
          description: row.description,
          date: row.date,
          paymentMethod: row.paymentMethod || 'upi_gpay',
          notes: row.notes,
        });
      }
    });

    if (toImport.length === 0) {
      showToast('No valid transactions selected for import', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      await addBatchTransactions(toImport);
      handleClose();
    } catch (err) {
      console.error(err);
      showToast('Error importing transactions', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = processedRows.filter((r) => !r.error && !r.isDuplicate).length;
  const duplicateCount = processedRows.filter((r) => r.isDuplicate).length;
  const errorCount = processedRows.filter((r) => !!r.error).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Bank & Statement CSV"
      subtitle="Compatible with Google Pay statement exports, UPI logs, and bank CSVs"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {uploadError && (
          <div className="p-3 bg-burgundy-50 border border-burgundy-200 text-burgundy-800 text-xs rounded-md">
            {uploadError}
          </div>
        )}

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-charcoal-300 hover:border-forest-700 rounded-lg p-8 text-center cursor-pointer bg-paper-50/50 hover:bg-paper-100/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-charcoal-800">
                Click or drag & drop statement CSV file
              </p>
              <p className="text-[11px] text-charcoal-500 mt-1">
                Supports UPI statements, bank CSV exports, and Google Pay transaction tables.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white border border-charcoal-200 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-charcoal-700">
                <FileText className="w-4 h-4 text-forest-700" />
                <span>Need a reference template to verify format?</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-paper-100 hover:bg-paper-200 text-charcoal-800 font-medium rounded border border-charcoal-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-charcoal-200 text-xs">
              <div>
                <span className="font-semibold text-charcoal-900">File: </span>
                <span className="text-charcoal-600">{fileName}</span>
                <span className="text-charcoal-400"> ({rawRows.length} rows detected)</span>
              </div>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="text-forest-800 hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Choose another file</span>
              </button>
            </div>

            <p className="text-xs text-charcoal-600">
              Confirm or adjust the column headers from your statement. Required fields are Date, Amount, and Description.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Date Column *
                </label>
                <select
                  value={mapping.dateCol}
                  onChange={(e) => setMapping((m) => ({ ...m, dateCol: e.target.value }))}
                  className="w-full p-2 border border-charcoal-300 rounded bg-white"
                >
                  <option value="">-- Select Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Amount Column *
                </label>
                <select
                  value={mapping.amountCol}
                  onChange={(e) => setMapping((m) => ({ ...m, amountCol: e.target.value }))}
                  className="w-full p-2 border border-charcoal-300 rounded bg-white"
                >
                  <option value="">-- Select Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Description / Payee Column *
                </label>
                <select
                  value={mapping.descriptionCol}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, descriptionCol: e.target.value }))
                  }
                  className="w-full p-2 border border-charcoal-300 rounded bg-white"
                >
                  <option value="">-- Select Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Category Column (Optional)
                </label>
                <select
                  value={mapping.categoryCol || ''}
                  onChange={(e) =>
                    setMapping((m) => ({
                      ...m,
                      categoryCol: e.target.value || undefined,
                    }))
                  }
                  className="w-full p-2 border border-charcoal-300 rounded bg-white"
                >
                  <option value="">-- None (Default to Other) --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-200">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-medium text-charcoal-700 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-forest-800 hover:bg-forest-900 rounded"
              >
                <span>Preview Parsed Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview and Confirmation */}
        {step === 'preview' && (
          <div className="space-y-4">
            {/* Summary Statistics */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-forest-50 border border-forest-100 rounded text-center">
                <span className="font-semibold text-forest-800 tabular-nums">{validCount}</span>
                <span className="text-forest-600 ml-1">Valid records</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-100 rounded text-center">
                <span className="font-semibold text-amber-800 tabular-nums">{duplicateCount}</span>
                <span className="text-amber-600 ml-1">Suspected duplicates</span>
              </div>
              <div className="p-2.5 bg-charcoal-100 border border-charcoal-200 rounded text-center">
                <span className="font-semibold text-charcoal-800 tabular-nums">{errorCount}</span>
                <span className="text-charcoal-600 ml-1">Problematic rows</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-600 font-medium">
                {selectedRowIndices.size} of {processedRows.length} rows selected for import
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-forest-800 hover:underline font-medium"
                >
                  Select all valid
                </button>
                <span className="text-charcoal-300">&bull;</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-charcoal-500 hover:underline"
                >
                  Deselect all
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-64 overflow-y-auto border border-charcoal-200 rounded bg-white">
              <table className="w-full text-left text-xs divide-y divide-charcoal-200">
                <thead className="bg-paper-50 sticky top-0 text-charcoal-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="p-2.5 text-center w-8">#</th>
                    <th scope="col" className="p-2.5">Date</th>
                    <th scope="col" className="p-2.5">Description</th>
                    <th scope="col" className="p-2.5">Category</th>
                    <th scope="col" className="p-2.5 text-right">Amount</th>
                    <th scope="col" className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {processedRows.map((row, idx) => {
                    const isSelected = selectedRowIndices.has(idx);
                    const isError = !!row.error;
                    const isDup = row.isDuplicate;

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-paper-50 transition-colors ${
                          isError ? 'bg-burgundy-50/30' : isDup ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            disabled={isError}
                            checked={isSelected}
                            onChange={() => toggleRowSelection(idx)}
                            className="rounded border-charcoal-300 text-forest-700 focus:ring-forest-700"
                          />
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-charcoal-600 tabular-nums">
                          {row.date ? row.date.split('T')[0] : '—'}
                        </td>
                        <td className="p-2.5 max-w-[180px] truncate font-medium text-charcoal-900">
                          {row.description}
                          {row.error && (
                            <span className="block text-[10px] text-burgundy-700 font-normal">
                              {row.error}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-charcoal-600">
                          {row.category || 'Other'}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap font-medium tabular-nums text-charcoal-900">
                          {row.amount > 0 ? row.amount.toFixed(2) : '—'}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {isError ? (
                            <Badge variant="danger" size="sm">Invalid</Badge>
                          ) : isDup ? (
                            <Badge variant="warning" size="sm">Duplicate</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Ready</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Confirmation actions */}
            <div className="flex items-center justify-between pt-3 border-t border-charcoal-200">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-xs font-medium text-charcoal-700 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50"
              >
                Back to Mapping
              </button>

              <button
                type="button"
                onClick={handleCommitImport}
                disabled={selectedRowIndices.size === 0 || isProcessing}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded shadow-subtle transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isProcessing
                    ? 'Importing...'
                    : `Confirm & Import ${selectedRowIndices.size} Transactions`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

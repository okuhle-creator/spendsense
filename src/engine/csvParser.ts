import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';
import { Transaction, TransactionType, PaymentMethod, CSVParseRow } from '../types';
import { decimalToCents } from './calculations';

export interface ColumnMapping {
  dateCol: string;
  amountCol: string;
  descriptionCol: string;
  categoryCol?: string;
  typeCol?: string;
  paymentMethodCol?: string;
}

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, string>[];
  suggestedMapping: ColumnMapping;
  processedRows: CSVParseRow[];
  duplicatesCount: number;
  validCount: number;
  invalidCount: number;
}

/**
 * Parses raw CSV string
 */
export function parseCSVFile(csvContent: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
        } else {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data,
          });
        }
      },
      error: (err: Error) => reject(err),
    });
  });
}

/**
 * Intelligent Column Detection
 */
export function detectColumns(headers: string[]): ColumnMapping {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  const findHeader = (candidates: string[]): string => {
    for (const cand of candidates) {
      const idx = lowerHeaders.findIndex((h) => h.includes(cand));
      if (idx !== -1) return headers[idx];
    }
    return '';
  };

  const dateCol = findHeader(['txn date', 'transaction date', 'posting date', 'value date', 'date', 'time']);
  const amountCol = findHeader(['amount', 'debit', 'withdrawal', 'price', 'total', 'cost']);
  const descriptionCol = findHeader(['description', 'narration', 'merchant', 'payee', 'particulars', 'details', 'name', 'remarks']);
  const categoryCol = findHeader(['category', 'tag', 'type']);
  const typeCol = findHeader(['txn type', 'transaction type', 'cr/dr', 'dr/cr', 'type']);
  const paymentMethodCol = findHeader(['payment method', 'mode', 'channel', 'instrument']);

  return {
    dateCol: dateCol || headers[0] || '',
    amountCol: amountCol || headers[1] || '',
    descriptionCol: descriptionCol || headers[2] || '',
    categoryCol: categoryCol || undefined,
    typeCol: typeCol || undefined,
    paymentMethodCol: paymentMethodCol || undefined,
  };
}

/**
 * Robust date parser supporting multiple date formats:
 * - YYYY-MM-DD
 * - DD/MM/YYYY
 * - MM/DD/YYYY
 * - DD-MM-YYYY
 * - ISO string
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();

  // Try standard JS date parsing
  const native = new Date(clean);
  if (isValid(native) && !isNaN(native.getTime())) {
    return native;
  }

  // Common international formats
  const formats = [
    'yyyy-MM-dd',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'dd-MM-yyyy',
    'yyyy/MM/dd',
    'dd.MM.yyyy',
    'd MMM yyyy',
    'dd MMM yyyy',
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(clean, fmt, new Date());
      if (isValid(parsed) && !isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Clean numeric string e.g. "₹ 1,450.50", "(25.00)", "- $500"
 */
export function parseAmount(val: unknown): { amount: number; isNegative: boolean } | null {
  if (val === null || val === undefined) return null;
  let str = String(val).trim();

  const isParenthesesNegative = str.startsWith('(') && str.endsWith(')');
  const hasMinus = str.includes('-');

  // Strip non-numeric chars except '.' and '-'
  str = str.replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);

  if (isNaN(num)) return null;

  const isNegative = isParenthesesNegative || hasMinus || num < 0;
  return {
    amount: Math.abs(num),
    isNegative,
  };
}

/**
 * Detect Duplicate Transactions:
 * Compares new candidate against existing transactions by matching:
 * - Same calendar date (YYYY-MM-DD)
 * - Exact amount in cents
 * - Matching normalized description
 */
export function isDuplicateTransaction(
  candidate: { date: Date; amountCents: number; description: string },
  existingTransactions: Transaction[]
): { isDuplicate: boolean; matchId?: string } {
  const candidateDay = candidate.date.toISOString().split('T')[0];
  const candidateDescNorm = candidate.description.trim().toLowerCase();

  for (const ex of existingTransactions) {
    if (ex.amountCents === candidate.amountCents) {
      const exDay = ex.date.split('T')[0];
      if (candidateDay === exDay) {
        const exDescNorm = ex.description.trim().toLowerCase();
        if (
          candidateDescNorm === exDescNorm ||
          candidateDescNorm.includes(exDescNorm) ||
          exDescNorm.includes(candidateDescNorm)
        ) {
          return { isDuplicate: true, matchId: ex.id };
        }
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Process and validate CSV rows according to column mapping
 */
export function processCSVRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  existingTransactions: Transaction[]
): CSVParseRow[] {
  return rows.map((row, index) => {
    const rawDate = row[mapping.dateCol];
    const rawAmount = row[mapping.amountCol];
    const rawDesc = row[mapping.descriptionCol];
    const rawCategory = mapping.categoryCol ? row[mapping.categoryCol] : undefined;
    const rawType = mapping.typeCol ? row[mapping.typeCol] : undefined;
    const rawPayment = mapping.paymentMethodCol ? row[mapping.paymentMethodCol] : undefined;

    // Validate Description
    const description = (rawDesc || `Transaction #${index + 1}`).trim();

    // Validate Date
    const parsedDate = parseDateString(rawDate);
    if (!parsedDate) {
      return {
        date: rawDate || '',
        amount: 0,
        description,
        error: `Invalid date format: "${rawDate}"`,
      };
    }

    // Validate Amount
    const parsedAmount = parseAmount(rawAmount);
    if (!parsedAmount || parsedAmount.amount <= 0) {
      return {
        date: parsedDate.toISOString(),
        amount: 0,
        description,
        error: `Invalid amount value: "${rawAmount}"`,
      };
    }

    // Determine Transaction Type
    let txType: TransactionType = 'expense';
    if (rawType) {
      const lower = rawType.toLowerCase();
      if (lower.includes('cr') || lower.includes('income') || lower.includes('deposit')) {
        txType = 'income';
      } else if (lower.includes('refund')) {
        txType = 'refund';
      } else if (lower.includes('transfer')) {
        txType = 'transfer';
      }
    } else if (parsedAmount.isNegative) {
      // In some statements, negative is credit/income or debit
      // Default to expense
      txType = 'expense';
    }

    // Payment method mapping
    let paymentMethod: PaymentMethod = 'upi_gpay';
    if (rawPayment) {
      const pLower = rawPayment.toLowerCase();
      if (pLower.includes('cash')) paymentMethod = 'cash';
      else if (pLower.includes('card') && pLower.includes('credit')) paymentMethod = 'credit_card';
      else if (pLower.includes('card') || pLower.includes('debit')) paymentMethod = 'debit_card';
      else if (pLower.includes('bank') || pLower.includes('neft') || pLower.includes('rtgs')) paymentMethod = 'bank_transfer';
    }

    // Check duplicate
    const amountCents = decimalToCents(parsedAmount.amount);
    const dupCheck = isDuplicateTransaction(
      { date: parsedDate, amountCents, description },
      existingTransactions
    );

    return {
      date: parsedDate.toISOString(),
      amount: parsedAmount.amount,
      description,
      category: rawCategory?.trim() || 'Other',
      type: txType,
      paymentMethod,
      isDuplicate: dupCheck.isDuplicate,
      duplicateMatchId: dupCheck.matchId,
    };
  });
}

/**
 * Export transactions to CSV format
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  currency: string = 'INR'
): string {
  const exportData = transactions.map((tx) => ({
    'Transaction ID': tx.id,
    'Date': tx.date,
    'Type': tx.type.toUpperCase(),
    'Category': tx.category,
    'Description': tx.description,
    'Amount': (tx.amountCents / 100).toFixed(2),
    'Currency': currency,
    'Payment Method': tx.paymentMethod,
    'Notes': tx.notes || '',
  }));

  return Papa.unparse(exportData);
}

/**
 * Generate Sample Google Pay / UPI CSV template for user download and testing
 */
export function generateSampleGooglePayCSV(): string {
  return [
    'Date,Description,Amount,Type,Payment Mode,Category',
    '2026-10-15,Blue Tokai Coffee,240.00,Debit,UPI / Google Pay,Food and dining',
    '2026-10-14,Uber Ride to Station,320.00,Debit,UPI / Google Pay,Transport',
    '2026-10-13,Nature Basket Groceries,1150.00,Debit,UPI / Google Pay,Groceries',
    '2026-10-12,Electricity Board,2100.00,Debit,UPI / Google Pay,Bills and utilities',
    '2026-10-10,Consulting Fee,45000.00,Credit,Bank Transfer,Other',
    '2026-10-08,Refund - Swiggy Cancelled Order,240.00,Refund,UPI / Google Pay,Food and dining',
  ].join('\n');
}

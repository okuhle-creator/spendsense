import { describe, it, expect } from 'vitest';
import {
  detectColumns,
  parseDateString,
  parseAmount,
  isDuplicateTransaction,
  processCSVRows,
} from './csvParser';
import { Transaction } from '../types';

describe('CSV Parser & Import Engine', () => {
  it('accurately detects column names from various statement formats', () => {
    const headers = ['Txn Date', 'Particulars', 'Withdrawal Amount', 'Txn Type'];
    const detected = detectColumns(headers);
    expect(detected.dateCol).toBe('Txn Date');
    expect(detected.descriptionCol).toBe('Particulars');
    expect(detected.amountCol).toBe('Withdrawal Amount');
    expect(detected.typeCol).toBe('Txn Type');
  });

  it('parses multiple international date formats correctly', () => {
    const d1 = parseDateString('2026-10-15');
    expect(d1?.getFullYear()).toBe(2026);
    expect(d1?.getMonth()).toBe(9); // 0-indexed October
    expect(d1?.getDate()).toBe(15);

    const d2 = parseDateString('15/10/2026');
    expect(d2?.getDate()).toBe(15);

    const d3 = parseDateString('invalid-date');
    expect(d3).toBeNull();
  });

  it('parses formatted amounts, stripping symbols and commas', () => {
    expect(parseAmount('₹ 1,450.50')).toEqual({ amount: 1450.5, isNegative: false });
    expect(parseAmount('$25.00')).toEqual({ amount: 25, isNegative: false });
    expect(parseAmount('(150.00)')).toEqual({ amount: 150, isNegative: true });
    expect(parseAmount('-45.99')).toEqual({ amount: 45.99, isNegative: true });
    expect(parseAmount('invalid')).toBeNull();
  });

  it('detects duplicate transactions reliably', () => {
    const existing: Transaction[] = [
      {
        id: 'tx-1',
        amountCents: 24000,
        type: 'expense',
        category: 'Food and dining',
        description: 'Blue Tokai Coffee',
        date: '2026-10-15T10:00:00.000Z',
        paymentMethod: 'upi_gpay',
        createdAt: '2026-10-15T10:00:00.000Z',
        updatedAt: '2026-10-15T10:00:00.000Z',
      },
    ];

    // Same date, same amount, matching description
    const candidateDup = {
      date: new Date('2026-10-15T14:30:00.000Z'),
      amountCents: 24000,
      description: 'Blue Tokai Coffee',
    };
    const res1 = isDuplicateTransaction(candidateDup, existing);
    expect(res1.isDuplicate).toBe(true);
    expect(res1.matchId).toBe('tx-1');

    // Different amount
    const candidateDiffAmount = {
      date: new Date('2026-10-15T14:30:00.000Z'),
      amountCents: 25000,
      description: 'Blue Tokai Coffee',
    };
    expect(isDuplicateTransaction(candidateDiffAmount, existing).isDuplicate).toBe(false);

    // Different date
    const candidateDiffDate = {
      date: new Date('2026-10-16T14:30:00.000Z'),
      amountCents: 24000,
      description: 'Blue Tokai Coffee',
    };
    expect(isDuplicateTransaction(candidateDiffDate, existing).isDuplicate).toBe(false);
  });

  it('processes CSV rows and flags invalid rows with clear error messages', () => {
    const rawRows = [
      { Date: '2026-10-15', Amount: '250.00', Description: 'Grocery Store' },
      { Date: 'bad-date', Amount: '100.00', Description: 'Bad Row' },
      { Date: '2026-10-15', Amount: 'invalid-amt', Description: 'Bad Amount' },
    ];
    const mapping = {
      dateCol: 'Date',
      amountCol: 'Amount',
      descriptionCol: 'Description',
    };

    const processed = processCSVRows(rawRows, mapping, []);
    expect(processed).toHaveLength(3);
    expect(processed[0].error).toBeUndefined();
    expect(processed[0].amount).toBe(250);
    expect(processed[1].error).toContain('Invalid date format');
    expect(processed[2].error).toContain('Invalid amount value');
  });
});

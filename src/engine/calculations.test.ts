import { describe, it, expect } from 'vitest';
import {
  centsToDecimal,
  decimalToCents,
  formatMoney,
  getPeriodInterval,
  calculateTotals,
  calculateCategoryBreakdown,
  calculateBudgetStatus,
} from './calculations';
import { Transaction, Budget } from '../types';

describe('Financial Calculation Engine', () => {
  describe('Cents & Currency Arithmetic', () => {
    it('converts cents to decimal and decimal to cents without floating point errors', () => {
      expect(centsToDecimal(15050)).toBe(150.5);
      expect(decimalToCents(150.5)).toBe(15050);
      expect(decimalToCents(0.1 + 0.2)).toBe(30); // 0.30000000000000004 avoided
      expect(centsToDecimal(99)).toBe(0.99);
      expect(decimalToCents(0.99)).toBe(99);
    });

    it('formats money cleanly according to currency config', () => {
      expect(formatMoney(250000, 'INR')).toContain('2,500.00');
      expect(formatMoney(1050, 'USD')).toContain('10.50');
      expect(formatMoney(-5000, 'INR')).toContain('-₹');
    });
  });

  describe('Period Intervals & Date Boundaries', () => {
    // Reference date: Wednesday, 15 Oct 2026, 14:30:00
    const refDate = new Date('2026-10-15T14:30:00.000Z');

    it('calculates Today start and end correctly', () => {
      const today = getPeriodInterval('today', 0, refDate);
      expect(today.label).toBe('Today');
      expect(today.start.getDate()).toBe(refDate.getDate());
      expect(today.start.getHours()).toBe(0);
      expect(today.start.getMinutes()).toBe(0);
      expect(today.end.getHours()).toBe(23);
      expect(today.end.getMinutes()).toBe(59);

      const yesterday = getPeriodInterval('today', -1, refDate);
      expect(yesterday.label).toBe('Yesterday');
      expect(yesterday.start.getDate()).toBe(refDate.getDate() - 1);
    });

    it('calculates Monday through Sunday for Week intervals', () => {
      const week = getPeriodInterval('week', 0, refDate);
      expect(week.label).toBe('This week');
      // In JS Date: 0 is Sunday, 1 is Monday
      expect(week.start.getDay()).toBe(1); // Monday
      expect(week.end.getDay()).toBe(0); // Sunday

      const lastWeek = getPeriodInterval('week', -1, refDate);
      expect(lastWeek.label).toBe('Last week');
      expect(lastWeek.start.getDay()).toBe(1);
    });

    it('calculates Month intervals from 1st to last day of month', () => {
      const month = getPeriodInterval('month', 0, refDate);
      expect(month.label).toBe('This month');
      expect(month.start.getDate()).toBe(1);
      // October has 31 days
      expect(month.end.getDate()).toBe(31);
    });
  });

  describe('Totals & Transaction Type Separation', () => {
    const mockTxns: Transaction[] = [
      {
        id: '1',
        amountCents: 5000, // 50.00
        type: 'expense',
        category: 'Food and dining',
        description: 'Lunch',
        date: '2026-10-15T12:00:00.000Z',
        paymentMethod: 'upi_gpay',
        createdAt: '2026-10-15T12:00:00.000Z',
        updatedAt: '2026-10-15T12:00:00.000Z',
      },
      {
        id: '2',
        amountCents: 2000, // 20.00
        type: 'expense',
        category: 'Transport',
        description: 'Metro',
        date: '2026-10-15T13:00:00.000Z',
        paymentMethod: 'upi_gpay',
        createdAt: '2026-10-15T13:00:00.000Z',
        updatedAt: '2026-10-15T13:00:00.000Z',
      },
      {
        id: '3',
        amountCents: 10000, // 100.00
        type: 'income',
        category: 'Other',
        description: 'Freelance payment',
        date: '2026-10-15T10:00:00.000Z',
        paymentMethod: 'bank_transfer',
        createdAt: '2026-10-15T10:00:00.000Z',
        updatedAt: '2026-10-15T10:00:00.000Z',
      },
      {
        id: '4',
        amountCents: 15000, // 150.00 - Transfer between own accounts
        type: 'transfer',
        category: 'Other',
        description: 'Transfer to Savings',
        date: '2026-10-15T11:00:00.000Z',
        paymentMethod: 'bank_transfer',
        createdAt: '2026-10-15T11:00:00.000Z',
        updatedAt: '2026-10-15T11:00:00.000Z',
      },
      {
        id: '5',
        amountCents: 1000, // 10.00 refund
        type: 'refund',
        category: 'Food and dining',
        description: 'Lunch discount refund',
        date: '2026-10-15T14:00:00.000Z',
        paymentMethod: 'upi_gpay',
        createdAt: '2026-10-15T14:00:00.000Z',
        updatedAt: '2026-10-15T14:00:00.000Z',
      },
    ];

    it('does NOT count transfers as expenses or income', () => {
      const totals = calculateTotals(mockTxns);
      expect(totals.grossExpensesCents).toBe(7000); // 5000 + 2000
      expect(totals.refundsCents).toBe(1000);
      expect(totals.netExpensesCents).toBe(6000); // 7000 - 1000
      expect(totals.incomeCents).toBe(10000);
      expect(totals.transfersCents).toBe(15000);
      // Net cash flow = income (10000) - net expenses (6000) = 4000
      expect(totals.netCashFlowCents).toBe(4000);
    });

    it('correctly groups category breakdown with refund deduction', () => {
      const breakdown = calculateCategoryBreakdown(mockTxns);
      expect(breakdown).toHaveLength(2);

      const food = breakdown.find((b) => b.category === 'Food and dining');
      expect(food).toBeDefined();
      expect(food?.totalCents).toBe(4000); // 5000 - 1000 refund

      const transport = breakdown.find((b) => b.category === 'Transport');
      expect(transport?.totalCents).toBe(2000);

      // 4000 / 6000 = 66.7%, 2000 / 6000 = 33.3%
      expect(food?.percentage).toBe(66.7);
      expect(transport?.percentage).toBe(33.3);
    });
  });

  describe('Budget Calculations', () => {
    const budget: Budget = {
      id: 'b-1',
      month: '2026-10',
      overallLimitCents: 10000, // 100.00
      categoryLimits: {
        'Food and dining': 6000,
        Transport: 3000,
      },
      alertThresholds: [75, 90, 100],
    };

    it('computes budget remaining and percentage accurately', () => {
      const txns: Transaction[] = [
        {
          id: '1',
          amountCents: 8000,
          type: 'expense',
          category: 'Food and dining',
          description: 'Groceries',
          date: '2026-10-15T12:00:00.000Z',
          paymentMethod: 'upi_gpay',
          createdAt: '2026-10-15T12:00:00.000Z',
          updatedAt: '2026-10-15T12:00:00.000Z',
        },
      ];

      const status = calculateBudgetStatus(budget, txns);
      expect(status.hasBudget).toBe(true);
      expect(status.spentCents).toBe(8000);
      expect(status.remainingCents).toBe(2000);
      expect(status.percentageUsed).toBe(80);
      expect(status.isOverBudget).toBe(false);
      expect(status.activeAlertThreshold).toBe(75); // hit 75% threshold

      const foodStatus = status.categoryStatuses.find((c) => c.category === 'Food and dining');
      expect(foodStatus?.isOverBudget).toBe(true); // 8000 > 6000 limit
      expect(foodStatus?.remainingCents).toBe(-2000);
    });

    it('gracefully handles missing budget without producing misleading 0 remaining', () => {
      const status = calculateBudgetStatus(null, []);
      expect(status.hasBudget).toBe(false);
      expect(status.overallLimitCents).toBe(0);
      expect(status.remainingCents).toBe(0);
    });
  });
});

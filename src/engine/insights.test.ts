import { describe, it, expect } from 'vitest';
import { generateInsights } from './insights';
import { Transaction, Budget } from '../types';

describe('Financial Insights Engine', () => {
  it('handles empty transaction records with clear honest message', () => {
    const { insights, hasSufficientData } = generateInsights([], null, 'INR');
    expect(hasSufficientData).toBe(false);
    expect(insights[0].id).toBe('no-data');
    expect(insights[0].message).toContain('No transactions recorded yet');
  });

  it('generates accurate top-category and budget threshold insights', () => {
    const now = new Date();
    const d = (daysAgo: number) => {
      const target = new Date(now);
      target.setDate(target.getDate() - daysAgo);
      return target.toISOString();
    };

    const txns: Transaction[] = [
      {
        id: '1',
        amountCents: 150000, // 1,500.00
        type: 'expense',
        category: 'Transport',
        description: 'Fuel & Tolls',
        date: d(1),
        paymentMethod: 'upi_gpay',
        createdAt: d(1),
        updatedAt: d(1),
      },
      {
        id: '2',
        amountCents: 50000, // 500.00
        type: 'expense',
        category: 'Food and dining',
        description: 'Dinner',
        date: d(2),
        paymentMethod: 'upi_gpay',
        createdAt: d(2),
        updatedAt: d(2),
      },
      {
        id: '3',
        amountCents: 50000, // 500.00
        type: 'expense',
        category: 'Groceries',
        description: 'Supermarket',
        date: d(3),
        paymentMethod: 'upi_gpay',
        createdAt: d(3),
        updatedAt: d(3),
      },
    ];

    const budget: Budget = {
      id: 'b-1',
      month: now.toISOString().slice(0, 7),
      overallLimitCents: 300000, // 3,000.00 limit -> 2,500 spent = 83.3%
      categoryLimits: {},
      alertThresholds: [75, 90, 100],
    };

    const { insights } = generateInsights(txns, budget, 'INR', now);
    expect(insights.length).toBeGreaterThan(0);

    // Transport is 1500 / 2500 = 60%
    const topCat = insights.find((i) => i.id === 'top-category');
    expect(topCat).toBeDefined();
    expect(topCat?.message).toContain('Transport accounted for 60%');

    // Budget is 83.3% used (>= 75% threshold)
    const budgetWarning = insights.find((i) => i.id === 'budget-warning');
    expect(budgetWarning).toBeDefined();
    expect(budgetWarning?.message).toContain('83.3% of your monthly budget');
  });
});

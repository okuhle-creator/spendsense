import { Transaction, Budget } from '../types';
import { format } from 'date-fns';

export function getSeedTransactions(): Transaction[] {

  // Relative dates in current month/week
  const d = (dayOffset: number, hour: number = 12, min: number = 0) => {
    const target = new Date();
    target.setDate(target.getDate() + dayOffset);
    target.setHours(hour, min, 0, 0);
    return target.toISOString();
  };

  return [
    // Today
    {
      id: 'tx-seed-1',
      amountCents: 18000, // 180.00
      type: 'expense',
      category: 'Food and dining',
      description: 'Morning Espresso & Croissant',
      date: d(0, 8, 30),
      paymentMethod: 'upi_gpay',
      notes: 'Roasted dark blend',
      createdAt: d(0, 8, 30),
      updatedAt: d(0, 8, 30),
    },
    {
      id: 'tx-seed-2',
      amountCents: 34000, // 340.00
      type: 'expense',
      category: 'Transport',
      description: 'Express City Train Pass',
      date: d(0, 10, 15),
      paymentMethod: 'upi_gpay',
      createdAt: d(0, 10, 15),
      updatedAt: d(0, 10, 15),
    },
    {
      id: 'tx-seed-3',
      amountCents: 45000, // 450.00
      type: 'expense',
      category: 'Food and dining',
      description: 'Business Lunch with Partner',
      date: d(0, 13, 10),
      paymentMethod: 'credit_card',
      notes: 'Reviewed quarterly goals',
      createdAt: d(0, 13, 10),
      updatedAt: d(0, 13, 10),
    },

    // Yesterday / 1 day ago
    {
      id: 'tx-seed-4',
      amountCents: 142000, // 1420.00
      type: 'expense',
      category: 'Groceries',
      description: 'Weekly Organic Produce & Pantry',
      date: d(-1, 18, 45),
      paymentMethod: 'upi_gpay',
      createdAt: d(-1, 18, 45),
      updatedAt: d(-1, 18, 45),
    },
    {
      id: 'tx-seed-5',
      amountCents: 12000, // 120.00
      type: 'refund',
      category: 'Groceries',
      description: 'Refund for Damaged Carton',
      date: d(-1, 19, 30),
      paymentMethod: 'upi_gpay',
      createdAt: d(-1, 19, 30),
      updatedAt: d(-1, 19, 30),
    },

    // 2 days ago
    {
      id: 'tx-seed-6',
      amountCents: 215000, // 2150.00
      type: 'expense',
      category: 'Bills and utilities',
      description: 'Fiber Internet & Power Bill',
      date: d(-2, 11, 0),
      paymentMethod: 'bank_transfer',
      createdAt: d(-2, 11, 0),
      updatedAt: d(-2, 11, 0),
    },

    // 4 days ago
    {
      id: 'tx-seed-7',
      amountCents: 85000, // 850.00
      type: 'expense',
      category: 'Education',
      description: 'Technical Reference Book',
      date: d(-4, 16, 20),
      paymentMethod: 'debit_card',
      createdAt: d(-4, 16, 20),
      updatedAt: d(-4, 16, 20),
    },
    {
      id: 'tx-seed-8',
      amountCents: 2500000, // 25000.00 - Transfer between own accounts
      type: 'transfer',
      category: 'Other',
      description: 'Transfer to High-Yield Savings Account',
      date: d(-4, 17, 0),
      paymentMethod: 'bank_transfer',
      notes: 'Monthly emergency fund deposit',
      createdAt: d(-4, 17, 0),
      updatedAt: d(-4, 17, 0),
    },

    // 7 days ago
    {
      id: 'tx-seed-9',
      amountCents: 180000, // 1800.00
      type: 'expense',
      category: 'Shopping',
      description: 'Ergonomic Desk Accessories',
      date: d(-7, 14, 0),
      paymentMethod: 'credit_card',
      createdAt: d(-7, 14, 0),
      updatedAt: d(-7, 14, 0),
    },

    // 10 days ago (Income)
    {
      id: 'tx-seed-10',
      amountCents: 8500000, // 85,000.00
      type: 'income',
      category: 'Other',
      description: 'Monthly Engineering Retainer / Salary',
      date: d(-10, 9, 0),
      paymentMethod: 'bank_transfer',
      notes: 'Direct deposit',
      createdAt: d(-10, 9, 0),
      updatedAt: d(-10, 9, 0),
    },

    // 12 days ago
    {
      id: 'tx-seed-11',
      amountCents: 95000, // 950.00
      type: 'expense',
      category: 'Health',
      description: 'Prescription & Vitamins',
      date: d(-12, 15, 30),
      paymentMethod: 'upi_gpay',
      createdAt: d(-12, 15, 30),
      updatedAt: d(-12, 15, 30),
    },
  ];
}

export function getSeedBudget(): Budget {
  const currentMonth = format(new Date(), 'yyyy-MM');
  return {
    id: `budget-${currentMonth}`,
    month: currentMonth,
    overallLimitCents: 2500000, // 25,000.00
    categoryLimits: {
      'Food and dining': 600000, // 6,000.00
      'Groceries': 700000, // 7,000.00
      'Transport': 300000, // 3,000.00
      'Bills and utilities': 400000, // 4,000.00
      'Shopping': 300000, // 3,000.00
    },
    alertThresholds: [75, 90, 100],
  };
}

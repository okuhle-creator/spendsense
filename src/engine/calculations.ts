import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns';
import {
  Transaction,
  PeriodType,
  PeriodInterval,
  CategorySummary,
  PeriodComparison,
  Budget,
  CurrencyCode,
} from '../types';
import { CURRENCY_MAP } from '../constants/categories';

/**
 * Currency and minor-unit formatting utilities
 */
export function centsToDecimal(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100);
}

export function formatMoney(
  cents: number,
  currency: CurrencyCode = 'INR',
  options: { showSign?: boolean; showCents?: boolean } = {}
): string {
  const info = CURRENCY_MAP[currency] || CURRENCY_MAP.INR;
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const decimal = centsToDecimal(absCents);

  const formatted = new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: options.showCents === false ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(decimal);

  if (options.showSign) {
    if (cents > 0) return `+${formatted}`;
    if (cents < 0) return `-${formatted}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Computes date intervals for Today, Week (Monday-Sunday), and Month
 */
export function getPeriodInterval(
  period: PeriodType,
  offset: number = 0,
  referenceDate: Date = new Date()
): PeriodInterval {
  let ref = referenceDate;

  if (period === 'today') {
    if (offset !== 0) {
      ref = addDays(ref, offset);
    }
    const start = startOfDay(ref);
    const end = endOfDay(ref);
    const label =
      offset === 0
        ? 'Today'
        : offset === -1
        ? 'Yesterday'
        : format(start, 'EEE, d MMM yyyy');

    return { type: 'today', start, end, label, offset };
  }

  if (period === 'week') {
    if (offset !== 0) {
      ref = addWeeks(ref, offset);
    }
    // Monday as week start (weekStartsOn: 1)
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });
    const label =
      offset === 0
        ? 'This week'
        : offset === -1
        ? 'Last week'
        : `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;

    return { type: 'week', start, end, label, offset };
  }

  // period === 'month'
  if (offset !== 0) {
    ref = addMonths(ref, offset);
  }
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  const label =
    offset === 0
      ? 'This month'
      : offset === -1
      ? 'Last month'
      : format(start, 'MMMM yyyy');

  return { type: 'month', start, end, label, offset };
}

/**
 * Filter transactions within a specific date interval
 */
export function filterTransactionsByInterval(
  transactions: Transaction[],
  interval: { start: Date; end: Date }
): Transaction[] {
  return transactions.filter((tx) => {
    try {
      const txDate = parseISO(tx.date);
      return isWithinInterval(txDate, { start: interval.start, end: interval.end });
    } catch {
      return false;
    }
  });
}

/**
 * Financial metrics calculation
 * - Expenses: sums 'expense'
 * - Refunds: sums 'refund'
 * - Net expenses: expenses - refunds (capped at 0)
 * - Income: sums 'income'
 * - Transfers: are excluded from expense & income calculations!
 */
export function calculateTotals(transactions: Transaction[]) {
  let grossExpensesCents = 0;
  let refundsCents = 0;
  let incomeCents = 0;
  let transfersCents = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      grossExpensesCents += tx.amountCents;
    } else if (tx.type === 'refund') {
      refundsCents += tx.amountCents;
    } else if (tx.type === 'income') {
      incomeCents += tx.amountCents;
    } else if (tx.type === 'transfer') {
      transfersCents += tx.amountCents;
    }
  }

  const netExpensesCents = Math.max(0, grossExpensesCents - refundsCents);
  const netCashFlowCents = incomeCents - netExpensesCents;

  return {
    grossExpensesCents,
    refundsCents,
    netExpensesCents,
    incomeCents,
    transfersCents,
    netCashFlowCents,
  };
}

/**
 * Calculate category breakdown of expenses
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[]
): CategorySummary[] {
  const expenseMap = new Map<string, { totalCents: number; count: number }>();
  let totalExpenseCents = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      totalExpenseCents += tx.amountCents;
      const existing = expenseMap.get(tx.category) || { totalCents: 0, count: 0 };
      existing.totalCents += tx.amountCents;
      existing.count += 1;
      expenseMap.set(tx.category, existing);
    } else if (tx.type === 'refund') {
      // Offset refund against category if existing
      const existing = expenseMap.get(tx.category);
      if (existing) {
        existing.totalCents = Math.max(0, existing.totalCents - tx.amountCents);
      }
      totalExpenseCents = Math.max(0, totalExpenseCents - tx.amountCents);
    }
  }

  const result: CategorySummary[] = [];
  for (const [category, data] of expenseMap.entries()) {
    const percentage =
      totalExpenseCents > 0
        ? Number(((data.totalCents / totalExpenseCents) * 100).toFixed(1))
        : 0;

    result.push({
      category,
      totalCents: data.totalCents,
      count: data.count,
      percentage,
    });
  }

  // Sort descending by total amount
  result.sort((a, b) => b.totalCents - a.totalCents);
  return result;
}

/**
 * Compare current period spending against the previous equivalent period
 */
export function calculatePeriodComparison(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[]
): PeriodComparison {
  const currentTotals = calculateTotals(currentTransactions);
  const previousTotals = calculateTotals(previousTransactions);

  const currentCents = currentTotals.netExpensesCents;
  const previousCents = previousTotals.netExpensesCents;
  const diffCents = currentCents - previousCents;

  let percentageChange: number | null = null;
  if (previousCents > 0) {
    percentageChange = Number((((currentCents - previousCents) / previousCents) * 100).toFixed(1));
  }

  return {
    currentCents,
    previousCents,
    diffCents,
    percentageChange,
    isIncrease: diffCents > 0,
  };
}

/**
 * Budget status analysis
 */
export interface BudgetStatus {
  hasBudget: boolean;
  overallLimitCents: number;
  spentCents: number;
  remainingCents: number;
  percentageUsed: number;
  isOverBudget: boolean;
  activeAlertThreshold?: number; // 75, 90, 100
  categoryStatuses: {
    category: string;
    spentCents: number;
    limitCents: number;
    remainingCents: number;
    percentageUsed: number;
    isOverBudget: boolean;
  }[];
}

export function calculateBudgetStatus(
  budget: Budget | null | undefined,
  monthTransactions: Transaction[]
): BudgetStatus {
  if (!budget || budget.overallLimitCents <= 0) {
    return {
      hasBudget: false,
      overallLimitCents: 0,
      spentCents: 0,
      remainingCents: 0,
      percentageUsed: 0,
      isOverBudget: false,
      categoryStatuses: [],
    };
  }

  const totals = calculateTotals(monthTransactions);
  const spentCents = totals.netExpensesCents;
  const remainingCents = budget.overallLimitCents - spentCents;
  const percentageUsed = Number(((spentCents / budget.overallLimitCents) * 100).toFixed(1));
  const isOverBudget = spentCents > budget.overallLimitCents;

  // Determine alert threshold hit
  let activeAlertThreshold: number | undefined;
  const thresholds = [...(budget.alertThresholds || [75, 90, 100])].sort((a, b) => b - a);
  for (const t of thresholds) {
    if (percentageUsed >= t) {
      activeAlertThreshold = t;
      break;
    }
  }

  // Category specific statuses
  const categoryBreakdown = calculateCategoryBreakdown(monthTransactions);
  const categoryMap = new Map(categoryBreakdown.map((c) => [c.category, c.totalCents]));

  const categoryStatuses = Object.entries(budget.categoryLimits || {})
    .filter(([_, limit]) => limit > 0)
    .map(([category, limitCents]) => {
      const catSpentCents = categoryMap.get(category) || 0;
      const catRemainingCents = limitCents - catSpentCents;
      const catPercentageUsed = Number(((catSpentCents / limitCents) * 100).toFixed(1));

      return {
        category,
        spentCents: catSpentCents,
        limitCents,
        remainingCents: catRemainingCents,
        percentageUsed: catPercentageUsed,
        isOverBudget: catSpentCents > limitCents,
      };
    })
    .sort((a, b) => b.percentageUsed - a.percentageUsed);

  return {
    hasBudget: true,
    overallLimitCents: budget.overallLimitCents,
    spentCents,
    remainingCents,
    percentageUsed,
    isOverBudget,
    activeAlertThreshold,
    categoryStatuses,
  };
}

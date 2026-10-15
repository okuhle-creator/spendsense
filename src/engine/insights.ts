import {
  Transaction,
  Budget,
  FinancialInsight,
  CurrencyCode,
} from '../types';
import {
  calculateTotals,
  calculateCategoryBreakdown,
  calculatePeriodComparison,
  formatMoney,
  getPeriodInterval,
  filterTransactionsByInterval,
} from './calculations';

export function generateInsights(
  allTransactions: Transaction[],
  currentBudget: Budget | null,
  currency: CurrencyCode,
  referenceDate: Date = new Date()
): { insights: FinancialInsight[]; hasSufficientData: boolean } {
  const insights: FinancialInsight[] = [];

  // Check if transactions exist
  if (allTransactions.length === 0) {
    return {
      insights: [
        {
          id: 'no-data',
          type: 'info',
          message: 'No transactions recorded yet.',
          detail: 'Add your first expense to unlock spending trends, category breakdowns, and period comparisons.',
        },
      ],
      hasSufficientData: false,
    };
  }

  // Current month transactions
  const monthInterval = getPeriodInterval('month', 0, referenceDate);
  const currentMonthTxns = filterTransactionsByInterval(allTransactions, monthInterval);

  // Previous month transactions
  const prevMonthInterval = getPeriodInterval('month', -1, referenceDate);
  const prevMonthTxns = filterTransactionsByInterval(allTransactions, prevMonthInterval);

  // Current week transactions
  const weekInterval = getPeriodInterval('week', 0, referenceDate);
  const currentWeekTxns = filterTransactionsByInterval(allTransactions, weekInterval);

  // Previous week transactions
  const prevWeekInterval = getPeriodInterval('week', -1, referenceDate);
  const prevWeekTxns = filterTransactionsByInterval(allTransactions, prevWeekInterval);

  // 1. Category Insight (e.g. "Transport accounted for 24% of your spending this month.")
  const categoryBreakdown = calculateCategoryBreakdown(currentMonthTxns);
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    if (topCategory.percentage >= 15) {
      insights.push({
        id: 'top-category',
        type: 'info',
        message: `${topCategory.category} accounted for ${topCategory.percentage}% of your spending this month.`,
        detail: `Total spent on ${topCategory.category}: ${formatMoney(topCategory.totalCents, currency)}.`,
      });
    }
  }

  // 2. Week-over-Week Comparison ("You spent ₹450 less this week than last week.")
  if (prevWeekTxns.length > 0 || currentWeekTxns.length > 0) {
    const weekComp = calculatePeriodComparison(currentWeekTxns, prevWeekTxns);
    if (weekComp.previousCents > 0) {
      const diffFormatted = formatMoney(Math.abs(weekComp.diffCents), currency);
      if (weekComp.diffCents < 0) {
        insights.push({
          id: 'week-comparison-lower',
          type: 'positive',
          message: `You spent ${diffFormatted} less this week than last week.`,
          detail: `A decrease of ${Math.abs(weekComp.percentageChange || 0)}% in weekly spending.`,
        });
      } else if (weekComp.diffCents > 0) {
        insights.push({
          id: 'week-comparison-higher',
          type: 'warning',
          message: `You spent ${diffFormatted} more this week than last week.`,
          detail: `An increase of ${weekComp.percentageChange}% in weekly spending.`,
        });
      }
    }
  }

  // 3. Month-over-Month Comparison
  if (prevMonthTxns.length > 0 && currentMonthTxns.length > 0) {
    const monthComp = calculatePeriodComparison(currentMonthTxns, prevMonthTxns);
    if (monthComp.previousCents > 0) {
      const diffFormatted = formatMoney(Math.abs(monthComp.diffCents), currency);
      if (monthComp.diffCents < 0) {
        insights.push({
          id: 'month-comparison-lower',
          type: 'positive',
          message: `Monthly spending is ${diffFormatted} lower than the same period last month.`,
          detail: `Pacing at ${Math.abs(monthComp.percentageChange || 0)}% under previous month.`,
        });
      }
    }
  }

  // 4. Budget Alert/Insight ("You have used 82% of your monthly budget.")
  if (currentBudget && currentBudget.overallLimitCents > 0) {
    const monthTotals = calculateTotals(currentMonthTxns);
    const spentCents = monthTotals.netExpensesCents;
    const pctUsed = Number(((spentCents / currentBudget.overallLimitCents) * 100).toFixed(1));
    const remaining = currentBudget.overallLimitCents - spentCents;

    if (pctUsed >= 100) {
      insights.push({
        id: 'budget-exceeded',
        type: 'alert',
        message: `Monthly budget exceeded by ${formatMoney(Math.abs(remaining), currency)}.`,
        detail: `You have spent ${formatMoney(spentCents, currency)} against a limit of ${formatMoney(currentBudget.overallLimitCents, currency)}.`,
      });
    } else if (pctUsed >= 90) {
      insights.push({
        id: 'budget-critical',
        type: 'alert',
        message: `You have used ${pctUsed}% of your monthly budget.`,
        detail: `Only ${formatMoney(remaining, currency)} remains for this month.`,
      });
    } else if (pctUsed >= 75) {
      insights.push({
        id: 'budget-warning',
        type: 'warning',
        message: `You have used ${pctUsed}% of your monthly budget.`,
        detail: `${formatMoney(remaining, currency)} remaining of your ${formatMoney(currentBudget.overallLimitCents, currency)} limit.`,
      });
    } else {
      insights.push({
        id: 'budget-healthy',
        type: 'positive',
        message: `Budget is on track: ${pctUsed}% used so far this month.`,
        detail: `${formatMoney(remaining, currency)} remaining for the month.`,
      });
    }
  }

  // 5. Cash Flow & Savings Rate
  const currentMonthTotals = calculateTotals(currentMonthTxns);
  if (currentMonthTotals.incomeCents > 0) {
    const savingsCents = currentMonthTotals.netCashFlowCents;
    const savingsRate = Number(
      ((savingsCents / currentMonthTotals.incomeCents) * 100).toFixed(1)
    );
    if (savingsRate > 0) {
      insights.push({
        id: 'savings-positive',
        type: 'positive',
        message: `Net positive cash flow of ${formatMoney(savingsCents, currency)} this month.`,
        detail: `Your current net savings rate is ${savingsRate}% of recorded income.`,
      });
    } else if (savingsRate < 0) {
      insights.push({
        id: 'savings-negative',
        type: 'warning',
        message: `Expenses exceed recorded income by ${formatMoney(Math.abs(savingsCents), currency)} this month.`,
        detail: 'Consider reviewing flexible categories such as dining or shopping.',
      });
    }
  }

  const hasSufficientData = insights.length > 0 && allTransactions.length >= 3;

  if (insights.length === 0) {
    insights.push({
      id: 'insufficient-data',
      type: 'info',
      message: 'Not enough historical data recorded yet.',
      detail: 'Continue recording daily purchases to see comparative trends and category analysis.',
    });
  }

  return { insights, hasSufficientData };
}

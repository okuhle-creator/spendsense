import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../engine/calculations';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export const MetricCards: React.FC = () => {
  const {
    totals,
    periodComparison,
    budgetStatus,
    settings,
    activePeriod,
  } = useFinance();

  const periodLabel = activePeriod === 'today' ? 'yesterday' : activePeriod === 'week' ? 'last week' : 'last month';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Expenses */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-4 sm:p-5 shadow-subtle">
        <div className="flex items-center justify-between text-xs font-medium text-charcoal-500 uppercase tracking-wider mb-2">
          <span>Expenses</span>
          <span className="text-[11px] lowercase text-charcoal-400">net spending</span>
        </div>
        <div className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight tabular-nums">
          {formatMoney(totals.netExpensesCents, settings.currency)}
        </div>

        {/* Period-over-period comparison indicator */}
        <div className="mt-3 pt-2.5 border-t border-charcoal-100 flex items-center gap-1.5 text-xs">
          {periodComparison.percentageChange !== null ? (
            <>
              {periodComparison.isIncrease ? (
                <div className="flex items-center gap-1 text-burgundy-700 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{periodComparison.percentageChange}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-forest-700 font-medium">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{periodComparison.percentageChange}%</span>
                </div>
              )}
              <span className="text-charcoal-500">vs {periodLabel}</span>
            </>
          ) : (
            <span className="text-charcoal-400">No prior baseline</span>
          )}
        </div>
      </div>

      {/* 2. Income */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-4 sm:p-5 shadow-subtle">
        <div className="flex items-center justify-between text-xs font-medium text-charcoal-500 uppercase tracking-wider mb-2">
          <span>Income</span>
          <TrendingUp className="w-3.5 h-3.5 text-forest-600" />
        </div>
        <div className="text-2xl sm:text-3xl font-semibold text-forest-800 tracking-tight tabular-nums">
          {formatMoney(totals.incomeCents, settings.currency)}
        </div>
        <div className="mt-3 pt-2.5 border-t border-charcoal-100 text-xs text-charcoal-500">
          {totals.incomeCents > 0 ? (
            <span>Recorded receipts for period</span>
          ) : (
            <span className="text-charcoal-400">No income logged in period</span>
          )}
        </div>
      </div>

      {/* 3. Net Cash Flow */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-4 sm:p-5 shadow-subtle">
        <div className="flex items-center justify-between text-xs font-medium text-charcoal-500 uppercase tracking-wider mb-2">
          <span>Net Cash Flow</span>
          {totals.netCashFlowCents >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-forest-600" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-burgundy-600" />
          )}
        </div>
        <div
          className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${
            totals.netCashFlowCents >= 0 ? 'text-charcoal-900' : 'text-burgundy-700'
          }`}
        >
          {formatMoney(totals.netCashFlowCents, settings.currency, { showSign: true })}
        </div>
        <div className="mt-3 pt-2.5 border-t border-charcoal-100 text-xs text-charcoal-500">
          <span>Income minus net expenses</span>
        </div>
      </div>

      {/* 4. Budget Remaining */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-4 sm:p-5 shadow-subtle">
        <div className="flex items-center justify-between text-xs font-medium text-charcoal-500 uppercase tracking-wider mb-2">
          <span>Monthly Budget</span>
          <Wallet className="w-3.5 h-3.5 text-charcoal-400" />
        </div>

        {budgetStatus.hasBudget ? (
          <>
            <div
              className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${
                budgetStatus.isOverBudget ? 'text-burgundy-700' : 'text-charcoal-900'
              }`}
            >
              {formatMoney(budgetStatus.remainingCents, settings.currency)}
            </div>
            <div className="mt-3 pt-2.5 border-t border-charcoal-100 flex items-center justify-between text-xs">
              <span className="text-charcoal-500">
                {budgetStatus.isOverBudget ? 'Exceeded by' : 'Remaining'} (
                {budgetStatus.percentageUsed}% used)
              </span>
              <span
                className={`font-medium ${
                  budgetStatus.isOverBudget
                    ? 'text-burgundy-700'
                    : budgetStatus.percentageUsed >= 90
                    ? 'text-burgundy-700'
                    : budgetStatus.percentageUsed >= 75
                    ? 'text-amber-700'
                    : 'text-forest-700'
                }`}
              >
                {formatMoney(budgetStatus.overallLimitCents, settings.currency, {
                  showCents: false,
                })}{' '}
                limit
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="text-xl font-medium text-charcoal-400 tracking-tight pt-1">
              No budget set
            </div>
            <div className="mt-3 pt-2.5 border-t border-charcoal-100 text-xs text-charcoal-500">
              Set a monthly limit in Budgets
            </div>
          </>
        )}
      </div>
    </div>
  );
};

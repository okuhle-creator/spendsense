import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney } from '../engine/calculations';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { format } from 'date-fns';
import {
  Wallet,
  Settings2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { currentBudget, budgetStatus, settings } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentMonthFormatted = format(new Date(), 'MMMM yyyy');

  const getProgressColor = (pct: number, isOver: boolean) => {
    if (isOver || pct >= 100) return 'bg-burgundy-700';
    if (pct >= 90) return 'bg-burgundy-600';
    if (pct >= 75) return 'bg-amber-600';
    return 'bg-forest-800';
  };

  const getThresholdWarning = () => {
    if (!budgetStatus.hasBudget) return null;
    if (budgetStatus.isOverBudget) {
      return {
        type: 'danger',
        title: 'Monthly Budget Exceeded',
        desc: `You have exceeded your overall monthly limit by ${formatMoney(
          Math.abs(budgetStatus.remainingCents),
          settings.currency
        )}.`,
      };
    }
    if (budgetStatus.percentageUsed >= 90) {
      return {
        type: 'danger',
        title: 'Critical Budget Warning (90%+)',
        desc: `You have consumed ${budgetStatus.percentageUsed}% of your budget. Only ${formatMoney(
          budgetStatus.remainingCents,
          settings.currency
        )} remains for ${currentMonthFormatted}.`,
      };
    }
    if (budgetStatus.percentageUsed >= 75) {
      return {
        type: 'warning',
        title: 'Approaching Budget Limit (75%+)',
        desc: `You have used ${budgetStatus.percentageUsed}% of your monthly limit. Plan discretionary expenses carefully.`,
      };
    }
    return null;
  };

  const warning = getThresholdWarning();

  return (
    <div className="space-y-6">
      {/* Header and Configure Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-charcoal-900 tracking-tight">
            Budgets
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Target spending limits and progress for {currentMonthFormatted}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-forest-800 hover:bg-forest-900 rounded shadow-subtle transition-colors self-start sm:self-auto"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{currentBudget ? 'Adjust Budget' : 'Set Up Budget'}</span>
        </button>
      </div>

      {!budgetStatus.hasBudget ? (
        /* Empty State: No Budget configured */
        <div className="bg-white border border-charcoal-200 rounded-lg p-10 text-center max-w-xl mx-auto shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-paper-200 text-charcoal-700 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-charcoal-900">
            No Budget Configured for {currentMonthFormatted}
          </h3>
          <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
            Establishing a monthly limit allows you to prevent overspending and receive
            in-app warnings as you approach 75%, 90%, and 100% of your targets.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-md transition-colors"
          >
            <span>Configure Monthly Budget</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Active Budget Views */
        <div className="space-y-6">
          {/* Threshold Alert Banner if triggered */}
          {warning && (
            <div
              className={`p-4 rounded-lg border text-xs flex items-start gap-3 ${
                warning.type === 'danger'
                  ? 'bg-burgundy-50 border-burgundy-200 text-burgundy-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {warning.type === 'danger' ? (
                <AlertCircle className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold">{warning.title}</h4>
                <p className="mt-0.5 leading-relaxed">{warning.desc}</p>
              </div>
            </div>
          )}

          {/* Primary Overall Limit Card */}
          <div className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-charcoal-100">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900">
                  Overall Monthly Spending Limit
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Calculated against all recorded expenses in {currentMonthFormatted}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-charcoal-500">Target: </span>
                <span className="text-sm font-semibold text-charcoal-900 tabular-nums">
                  {formatMoney(budgetStatus.overallLimitCents, settings.currency)}
                </span>
              </div>
            </div>

            {/* Spent vs Remaining numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
                  Amount Spent
                </p>
                <p className="text-2xl font-semibold text-charcoal-900 mt-1 tabular-nums">
                  {formatMoney(budgetStatus.spentCents, settings.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
                  {budgetStatus.isOverBudget ? 'Over Budget' : 'Remaining'}
                </p>
                <p
                  className={`text-2xl font-semibold mt-1 tabular-nums ${
                    budgetStatus.isOverBudget ? 'text-burgundy-700' : 'text-forest-800'
                  }`}
                >
                  {formatMoney(budgetStatus.remainingCents, settings.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
                  Budget Used
                </p>
                <p className="text-2xl font-semibold text-charcoal-900 mt-1 tabular-nums">
                  {budgetStatus.percentageUsed}%
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="pt-2">
              <div className="h-2.5 w-full bg-charcoal-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getProgressColor(
                    budgetStatus.percentageUsed,
                    budgetStatus.isOverBudget
                  )}`}
                  style={{ width: `${Math.min(100, budgetStatus.percentageUsed)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-charcoal-400 mt-1.5 tabular-nums">
                <span>0%</span>
                <span>75% Warning</span>
                <span>90% Critical</span>
                <span>100% Limit</span>
              </div>
            </div>
          </div>

          {/* Category-Specific Limits */}
          <div className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900">
                  Category Spending Targets
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Performance across individual category limits
                </p>
              </div>
            </div>

            {budgetStatus.categoryStatuses.length === 0 ? (
              <div className="py-6 text-center text-xs text-charcoal-400">
                No category-specific limits configured. Click &ldquo;Adjust Budget&rdquo; to set them.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgetStatus.categoryStatuses.map((cat: any) => (
                  <div
                    key={cat.category}
                    className="p-4 rounded-md border border-charcoal-200 bg-paper-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-charcoal-900">{cat.category}</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          cat.isOverBudget ? 'text-burgundy-700' : 'text-charcoal-700'
                        }`}
                      >
                        {formatMoney(cat.spentCents, settings.currency)} /{' '}
                        {formatMoney(cat.limitCents, settings.currency)}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-charcoal-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getProgressColor(
                          cat.percentageUsed,
                          cat.isOverBudget
                        )}`}
                        style={{ width: `${Math.min(100, cat.percentageUsed)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-charcoal-500 tabular-nums">
                        {cat.percentageUsed}% consumed
                      </span>
                      <span
                        className={`font-medium tabular-nums ${
                          cat.isOverBudget ? 'text-burgundy-700' : 'text-charcoal-600'
                        }`}
                      >
                        {cat.isOverBudget
                          ? `Over by ${formatMoney(Math.abs(cat.remainingCents), settings.currency)}`
                          : `${formatMoney(cat.remainingCents, settings.currency)} remaining`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit/Configure Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingBudget={currentBudget}
      />
    </div>
  );
};

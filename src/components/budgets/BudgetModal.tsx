import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Budget } from '../../types';
import { CURRENCY_MAP } from '../../constants/categories';
import { decimalToCents, centsToDecimal } from '../../engine/calculations';
import { format } from 'date-fns';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBudget?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  existingBudget,
}) => {
  const { categories, settings, saveBudget } = useFinance();
  const currencyInfo = CURRENCY_MAP[settings.currency] || CURRENCY_MAP.INR;
  const currentMonthKey = format(new Date(), 'yyyy-MM');

  const [overallLimit, setOverallLimit] = useState<string>('');
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingBudget) {
      setOverallLimit(centsToDecimal(existingBudget.overallLimitCents).toString());
      const catMap: Record<string, string> = {};
      for (const [cat, limitCents] of Object.entries(existingBudget.categoryLimits || {})) {
        catMap[cat] = centsToDecimal(limitCents).toString();
      }
      setCategoryLimits(catMap);
    } else {
      setOverallLimit('25000');
      setCategoryLimits({});
    }
    setError(null);
  }, [existingBudget, isOpen]);

  const handleCategoryLimitChange = (catName: string, val: string) => {
    setCategoryLimits((prev) => ({
      ...prev,
      [catName]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const overallNum = parseFloat(overallLimit);
    if (isNaN(overallNum) || overallNum <= 0) {
      setError('Please provide a valid overall budget limit greater than zero.');
      return;
    }

    const cleanedCatLimits: Record<string, number> = {};
    for (const [cat, valStr] of Object.entries(categoryLimits)) {
      const num = parseFloat(valStr);
      if (!isNaN(num) && num > 0) {
        cleanedCatLimits[cat] = decimalToCents(num);
      }
    }

    setIsSubmitting(true);
    try {
      const budgetPayload: Budget = {
        id: existingBudget?.id || `budget-${currentMonthKey}`,
        month: currentMonthKey,
        overallLimitCents: decimalToCents(overallNum),
        categoryLimits: cleanedCatLimits,
        alertThresholds: [75, 90, 100],
      };

      await saveBudget(budgetPayload);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Monthly Budget"
      subtitle={`Set limits for ${format(new Date(), 'MMMM yyyy')}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-burgundy-50 border border-burgundy-200 text-burgundy-800 text-xs rounded-md">
            {error}
          </div>
        )}

        {/* Overall Limit */}
        <div>
          <label htmlFor="budget-overall" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
            Overall Monthly Limit ({currencyInfo.symbol}) *
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-charcoal-500 text-sm font-semibold">{currencyInfo.symbol}</span>
            </div>
            <input
              id="budget-overall"
              type="number"
              step="1"
              required
              placeholder="e.g. 50000"
              value={overallLimit}
              onChange={(e) => setOverallLimit(e.target.value)}
              className="block w-full rounded-md border border-charcoal-300 pl-8 pr-4 py-2 text-base font-semibold text-charcoal-900 focus:border-forest-700 focus:ring-1 focus:ring-forest-700 tabular-nums"
            />
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">
            In-app warnings will trigger at 75%, 90%, and 100% of this limit.
          </p>
        </div>

        {/* Optional Category-Specific Limits */}
        <div className="border-t border-charcoal-200 pt-4">
          <h4 className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-2">
            Category Spending Limits <span className="font-normal lowercase text-charcoal-400">(optional)</span>
          </h4>
          <p className="text-xs text-charcoal-500 mb-3">
            Set individual monthly targets for your key spending areas.
          </p>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-charcoal-700 shrink-0">{cat.name}</span>
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 font-medium">
                    {currencyInfo.symbol}
                  </span>
                  <input
                    type="number"
                    step="1"
                    placeholder="No limit"
                    value={categoryLimits[cat.name] || ''}
                    onChange={(e) => handleCategoryLimitChange(cat.name, e.target.value)}
                    className="w-full pl-6 pr-2 py-1 text-xs rounded border border-charcoal-300 text-charcoal-900 placeholder:text-charcoal-400 focus:border-forest-700 focus:ring-1 focus:ring-forest-700 tabular-nums text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-charcoal-700 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-forest-800 hover:bg-forest-900 rounded shadow-subtle transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

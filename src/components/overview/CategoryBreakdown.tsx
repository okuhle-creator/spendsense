import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../engine/calculations';
import { PieChart } from 'lucide-react';

export const CategoryBreakdown: React.FC = () => {
  const { categoryBreakdown, settings, currentInterval } = useFinance();

  return (
    <div className="bg-white border border-charcoal-200 rounded-lg p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-charcoal-100">
        <div>
          <h3 className="text-sm font-semibold text-charcoal-900">Category Breakdown</h3>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Spending distribution for {currentInterval.label.toLowerCase()}
          </p>
        </div>
        <PieChart className="w-4 h-4 text-charcoal-400" />
      </div>

      {categoryBreakdown.length === 0 ? (
        <div className="py-8 text-center text-xs text-charcoal-400">
          No expenses recorded in this period.
        </div>
      ) : (
        <div className="space-y-3.5">
          {categoryBreakdown.map((item) => (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-charcoal-800">{item.category}</span>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-charcoal-500">{item.percentage}%</span>
                  <span className="font-semibold text-charcoal-900">
                    {formatMoney(item.totalCents, settings.currency)}
                  </span>
                </div>
              </div>
              {/* Restrained progress bar */}
              <div className="h-1.5 w-full bg-charcoal-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-forest-800 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

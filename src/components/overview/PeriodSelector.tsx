import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PeriodType } from '../../types';

export const PeriodSelector: React.FC = () => {
  const {
    activePeriod,
    periodOffset,
    currentInterval,
    setActivePeriod,
    navigatePrevious,
    navigateNext,
    resetPeriodToCurrent,
  } = useFinance();

  const handleSelectPeriod = (type: PeriodType) => {
    setActivePeriod(type);
    resetPeriodToCurrent();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-charcoal-200">
      {/* Period tabs: Today / This week / This month */}
      <div className="inline-flex p-1 bg-charcoal-100/80 rounded-md border border-charcoal-200 self-start sm:self-auto">
        {(
          [
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This week' },
            { id: 'month', label: 'This month' },
          ] as const
        ).map((p) => {
          const isSelected = activePeriod === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPeriod(p.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded transition-all ${
                isSelected
                  ? 'bg-white text-charcoal-900 shadow-subtle font-semibold'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Date navigation controls */}
      <div className="flex items-center gap-2 text-xs text-charcoal-600">
        <span className="font-medium text-charcoal-800 tabular-nums">
          {currentInterval.label}
        </span>

        <div className="inline-flex items-center border border-charcoal-200 rounded bg-white shadow-subtle">
          <button
            type="button"
            onClick={navigatePrevious}
            className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-50 rounded-l transition-colors"
            title="Previous period"
            aria-label="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {periodOffset !== 0 && (
            <button
              type="button"
              onClick={resetPeriodToCurrent}
              className="px-2 py-1 text-[11px] font-medium text-forest-700 hover:bg-forest-50 border-x border-charcoal-200 transition-colors flex items-center gap-1"
              title="Reset to current period"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Current</span>
            </button>
          )}

          <button
            type="button"
            onClick={navigateNext}
            className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-50 rounded-r transition-colors"
            title="Next period"
            aria-label="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

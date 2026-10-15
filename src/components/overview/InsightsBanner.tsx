import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const InsightsBanner: React.FC = () => {
  const { insights } = useFinance();

  if (insights.length === 0) return null;

  return (
    <div className="bg-white border border-charcoal-200 rounded-lg p-5 shadow-subtle">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-charcoal-100">
        <Sparkles className="w-4 h-4 text-forest-700" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
          Financial Observations
        </h3>
        <span className="text-[11px] text-charcoal-400 font-normal">
          (Computed strictly from your recorded data)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.slice(0, 3).map((insight) => {
          const isPositive = insight.type === 'positive';
          const isWarning = insight.type === 'warning';
          const isAlert = insight.type === 'alert';

          return (
            <div
              key={insight.id}
              className={`p-3.5 rounded border text-xs leading-relaxed transition-colors ${
                isPositive
                  ? 'bg-forest-50/60 border-forest-100 text-charcoal-800'
                  : isAlert
                  ? 'bg-burgundy-50/60 border-burgundy-200 text-burgundy-900'
                  : isWarning
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-paper-100/80 border-charcoal-200 text-charcoal-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isPositive && <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />}
                {isAlert && <AlertCircle className="w-4 h-4 text-burgundy-700 shrink-0 mt-0.5" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />}
                {!isPositive && !isAlert && !isWarning && (
                  <Info className="w-4 h-4 text-charcoal-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-medium text-charcoal-900">{insight.message}</p>
                  {insight.detail && (
                    <p className="text-[11px] text-charcoal-600">{insight.detail}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

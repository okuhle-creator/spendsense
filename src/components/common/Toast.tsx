import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFinance();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error' || toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 bg-white border border-charcoal-200 shadow-elevated rounded-md text-sm text-charcoal-800 transition-all"
            role="status"
          >
            <div className="flex items-center gap-2.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />}
              {isError && <AlertCircle className="w-4 h-4 text-burgundy-600 shrink-0" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-charcoal-500 shrink-0" />}
              <span className="font-medium text-xs">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-charcoal-400 hover:text-charcoal-600 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

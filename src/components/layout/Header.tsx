import React from 'react';
import { format } from 'date-fns';
import { Plus, UploadCloud, Database } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface HeaderProps {
  onOpenAddExpense: () => void;
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddExpense, onOpenImport }) => {
  const { isCloudMode, isSupabaseReady } = useFinance();
  const todayFormatted = format(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <header className="sticky top-0 z-30 bg-paper-100/95 backdrop-blur-sm border-b border-charcoal-200 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Current Date */}
        <div className="flex items-baseline gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-forest-800 text-paper-100 flex items-center justify-center font-bold text-xs tracking-wider">
              SS
            </div>
            <h1 className="text-base font-semibold text-charcoal-900 tracking-tight">
              SpendSense
            </h1>
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-charcoal-500 tabular-nums">
            {todayFormatted}
          </span>
        </div>

        {/* Right: Mode Badge & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Storage Mode indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-charcoal-200 bg-white text-charcoal-600 font-medium"
            title={
              isCloudMode && isSupabaseReady
                ? 'Connected to Supabase PostgreSQL database with Row Level Security'
                : 'Running in Local Storage Mode (Offline / Zero configuration)'
            }
          >
            {isCloudMode && isSupabaseReady ? (
              <>
                <Database className="w-3.5 h-3.5 text-forest-700" />
                <span>Cloud Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-charcoal-400"></span>
                <span>Local Storage</span>
              </>
            )}
          </div>

          {/* Import Button */}
          <button
            type="button"
            onClick={onOpenImport}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-charcoal-700 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50 hover:border-charcoal-400 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-charcoal-500" />
            <span>Import CSV</span>
          </button>

          {/* Add Expense Button */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-forest-800 hover:bg-forest-900 active:bg-forest-900 rounded shadow-subtle transition-colors focus:ring-2 focus:ring-forest-800/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};

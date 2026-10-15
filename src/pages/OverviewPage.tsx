import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { PeriodSelector } from '../components/overview/PeriodSelector';
import { MetricCards } from '../components/overview/MetricCards';
import { CategoryBreakdown } from '../components/overview/CategoryBreakdown';
import { RecentTransactions } from '../components/overview/RecentTransactions';
import { InsightsBanner } from '../components/overview/InsightsBanner';
import { Transaction } from '../types';
import { PlusCircle, Sparkles } from 'lucide-react';

interface OverviewPageProps {
  onOpenAddExpense: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onNavigateToTransactions: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onOpenAddExpense,
  onEditTransaction,
  onNavigateToTransactions,
}) => {
  const { transactions, resetToDemoData, isLoading } = useFinance();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-charcoal-400 animate-pulse">
        Loading financial overview...
      </div>
    );
  }

  // Polished Empty State for First-Time Users
  if (transactions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-800">
          <PlusCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-charcoal-900 tracking-tight">
          Welcome to SpendSense
        </h2>
        <p className="text-sm text-charcoal-600 mt-2 max-w-md mx-auto leading-relaxed">
          Track expenses daily, weekly, and monthly with clarity and precision.
          Begin by recording your first expense or load a demonstration dataset to explore the interface.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-md shadow-subtle transition-colors"
          >
            Record your first expense
          </button>
          <button
            type="button"
            onClick={resetToDemoData}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-charcoal-700 bg-white border border-charcoal-300 rounded-md hover:bg-charcoal-50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-charcoal-500" />
            <span>Load demonstration data</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header section */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal-900 tracking-tight">
          Your finances
        </h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Review daily, weekly, and monthly performance at a glance.
        </p>
      </div>

      {/* Selectable Period Control */}
      <PeriodSelector />

      {/* Primary Key Metric Cards */}
      <MetricCards />

      {/* Rule-based Financial Observations */}
      <InsightsBanner />

      {/* Two Column Grid: Category Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <CategoryBreakdown />
        </div>
        <div className="lg:col-span-7">
          <RecentTransactions
            onEditTransaction={onEditTransaction}
            onViewAll={onNavigateToTransactions}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  calculateTotals,
  calculateCategoryBreakdown,
  calculatePeriodComparison,
  formatMoney,
  centsToDecimal,
  getPeriodInterval,
  filterTransactionsByInterval,
} from '../engine/calculations';
import { exportTransactionsToCSV } from '../engine/csvParser';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Download, BarChart2, PieChart, Sparkles, Calendar } from 'lucide-react';
import { PeriodType, CategorySummary, FinancialInsight } from '../types';

export const ReportsPage: React.FC = () => {
  const { transactions, settings, showToast, insights } = useFinance();

  const [reportPeriod, setReportPeriod] = useState<PeriodType>('month');
  const [periodOffset, setPeriodOffset] = useState<number>(0);

  // Interval
  const currentInterval = useMemo(() => {
    return getPeriodInterval(reportPeriod, periodOffset);
  }, [reportPeriod, periodOffset]);

  const prevInterval = useMemo(() => {
    return getPeriodInterval(reportPeriod, periodOffset - 1);
  }, [reportPeriod, periodOffset]);

  // Transactions in current & previous intervals
  const intervalTxns = useMemo(() => {
    return filterTransactionsByInterval(transactions, currentInterval);
  }, [transactions, currentInterval]);

  const prevIntervalTxns = useMemo(() => {
    return filterTransactionsByInterval(transactions, prevInterval);
  }, [transactions, prevInterval]);

  // Totals & Comparisons
  const totals = useMemo(() => calculateTotals(intervalTxns), [intervalTxns]);
  const comparison = useMemo(
    () => calculatePeriodComparison(intervalTxns, prevIntervalTxns),
    [intervalTxns, prevIntervalTxns]
  );
  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(intervalTxns),
    [intervalTxns]
  );

  // Daily average
  const daysInPeriod = useMemo(() => {
    try {
      const days = eachDayOfInterval({ start: currentInterval.start, end: currentInterval.end });
      return Math.max(1, days.length);
    } catch {
      return 1;
    }
  }, [currentInterval]);

  const dailyAverageCents = Math.round(totals.netExpensesCents / daysInPeriod);

  // Chart Data preparation: daily distribution for month/week
  const trendChartData = useMemo(() => {
    try {
      const days = eachDayOfInterval({ start: currentInterval.start, end: currentInterval.end });
      const dayMap = new Map<string, number>();

      for (const d of days) {
        dayMap.set(format(d, 'yyyy-MM-dd'), 0);
      }

      for (const tx of intervalTxns) {
        if (tx.type === 'expense') {
          const dayKey = tx.date.split('T')[0];
          const curr = dayMap.get(dayKey) || 0;
          dayMap.set(dayKey, curr + tx.amountCents);
        } else if (tx.type === 'refund') {
          const dayKey = tx.date.split('T')[0];
          const curr = dayMap.get(dayKey) || 0;
          dayMap.set(dayKey, Math.max(0, curr - tx.amountCents));
        }
      }

      return Array.from(dayMap.entries()).map(([dayStr, amountCents]) => {
        const d = parseISO(dayStr);
        const label = reportPeriod === 'today' ? format(d, 'h a') : reportPeriod === 'week' ? format(d, 'EEE d') : format(d, 'd MMM');
        return {
          date: dayStr,
          label,
          amount: centsToDecimal(amountCents),
        };
      });
    } catch {
      return [];
    }
  }, [currentInterval, intervalTxns, reportPeriod]);

  // CSV Export
  const handleExportCSV = () => {
    if (intervalTxns.length === 0) {
      showToast('No transactions to export in this period', 'info');
      return;
    }
    const csvString = exportTransactionsToCSV(intervalTxns, settings.currency);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `spendsense-report-${reportPeriod}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report exported successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-charcoal-900 tracking-tight">
            Reports & Analysis
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Spending summaries, category distributions, and period comparisons
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="inline-flex p-1 bg-charcoal-100 rounded-md border border-charcoal-200">
            {(
              [
                { id: 'today', label: 'Day' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setReportPeriod(p.id);
                  setPeriodOffset(0);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  reportPeriod === p.id
                    ? 'bg-white text-charcoal-900 shadow-subtle font-semibold'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-charcoal-700 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-charcoal-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Selected period banner */}
      <div className="flex items-center justify-between p-3.5 bg-paper-50 rounded-lg border border-charcoal-200 text-xs text-charcoal-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-charcoal-500" />
          <span className="font-semibold text-charcoal-900">{currentInterval.label}</span>
          <span className="text-charcoal-400">
            ({format(currentInterval.start, 'd MMM yyyy')} – {format(currentInterval.end, 'd MMM yyyy')})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPeriodOffset((prev) => prev - 1)}
            className="px-2 py-1 bg-white border border-charcoal-200 rounded hover:bg-charcoal-50 transition-colors"
          >
            &larr; Previous
          </button>
          {periodOffset !== 0 && (
            <button
              type="button"
              onClick={() => setPeriodOffset(0)}
              className="px-2 py-1 bg-white border border-charcoal-200 rounded hover:bg-charcoal-50 transition-colors text-forest-700"
            >
              Current
            </button>
          )}
          <button
            type="button"
            onClick={() => setPeriodOffset((prev) => prev + 1)}
            className="px-2 py-1 bg-white border border-charcoal-200 rounded hover:bg-charcoal-50 transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-charcoal-200 rounded-lg p-4 shadow-subtle">
          <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
            Total Expenses
          </p>
          <p className="text-2xl font-semibold text-charcoal-900 mt-1 tabular-nums">
            {formatMoney(totals.netExpensesCents, settings.currency)}
          </p>
          <div className="mt-2 text-xs text-charcoal-500">
            {comparison.percentageChange !== null ? (
              <span className={comparison.isIncrease ? 'text-burgundy-700' : 'text-forest-700'}>
                {comparison.isIncrease ? '+' : ''}
                {comparison.percentageChange}% vs prior period
              </span>
            ) : (
              'Baseline for period'
            )}
          </div>
        </div>

        <div className="bg-white border border-charcoal-200 rounded-lg p-4 shadow-subtle">
          <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
            Income Received
          </p>
          <p className="text-2xl font-semibold text-forest-800 mt-1 tabular-nums">
            {formatMoney(totals.incomeCents, settings.currency)}
          </p>
          <div className="mt-2 text-xs text-charcoal-500">
            <span>{totals.incomeCents > 0 ? 'Logged receipts' : 'No income recorded'}</span>
          </div>
        </div>

        <div className="bg-white border border-charcoal-200 rounded-lg p-4 shadow-subtle">
          <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
            Net Cash Flow
          </p>
          <p
            className={`text-2xl font-semibold mt-1 tabular-nums ${
              totals.netCashFlowCents >= 0 ? 'text-charcoal-900' : 'text-burgundy-700'
            }`}
          >
            {formatMoney(totals.netCashFlowCents, settings.currency, { showSign: true })}
          </p>
          <div className="mt-2 text-xs text-charcoal-500">
            <span>Income minus expenses</span>
          </div>
        </div>

        <div className="bg-white border border-charcoal-200 rounded-lg p-4 shadow-subtle">
          <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
            Daily Average
          </p>
          <p className="text-2xl font-semibold text-charcoal-900 mt-1 tabular-nums">
            {formatMoney(dailyAverageCents, settings.currency)}
          </p>
          <div className="mt-2 text-xs text-charcoal-500">
            <span>Averaged across {daysInPeriod} days</span>
          </div>
        </div>
      </div>

      {/* Restrained Recharts: Spending Trend */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
          <div>
            <h3 className="text-sm font-semibold text-charcoal-900">Spending Trend</h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Daily net expenditure for {currentInterval.label.toLowerCase()}
            </p>
          </div>
          <BarChart2 className="w-4 h-4 text-charcoal-400" />
        </div>

        <div className="h-64 w-full">
          {trendChartData.length === 0 || totals.netExpensesCents === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
              No expense activity in this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${settings.currency} ${Number(val).toFixed(2)}`,
                    'Expense',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="amount" fill="#1F4D3C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Spending Table */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
          <div>
            <h3 className="text-sm font-semibold text-charcoal-900">Category Breakdown</h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Detailed breakdown of expenses by category for {currentInterval.label.toLowerCase()}
            </p>
          </div>
          <PieChart className="w-4 h-4 text-charcoal-400" />
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-charcoal-400">
            No expenses recorded in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-charcoal-200">
              <thead className="bg-paper-50 text-charcoal-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Category</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Transactions</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Share</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {categoryBreakdown.map((item: CategorySummary) => (
                  <tr key={item.category} className="hover:bg-paper-50/50">
                    <td className="px-4 py-3 font-medium text-charcoal-900">{item.category}</td>
                    <td className="px-4 py-3 text-right text-charcoal-600 tabular-nums">
                      {item.count}
                    </td>
                    <td className="px-4 py-3 text-right text-charcoal-600 tabular-nums">
                      {item.percentage}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-charcoal-900 tabular-nums">
                      {formatMoney(item.totalCents, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rule-based Insights Section */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-5 shadow-subtle space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-charcoal-100">
          <Sparkles className="w-4 h-4 text-forest-700" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
            Verified Financial Insights
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {insights.map((insight: FinancialInsight) => (
            <div
              key={insight.id}
              className="p-3.5 bg-paper-50 rounded border border-charcoal-200 text-xs space-y-1"
            >
              <p className="font-semibold text-charcoal-900">{insight.message}</p>
              {insight.detail && <p className="text-charcoal-500">{insight.detail}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

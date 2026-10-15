import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { formatMoney } from '../engine/calculations';
import { exportTransactionsToCSV } from '../engine/csvParser';
import { format, parseISO } from 'date-fns';
import {
  Search,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  RotateCcw,
  Edit2,
  Trash2,
  RotateCw,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface TransactionsPageProps {
  onOpenAddExpense: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenAddExpense,
  onEditTransaction,
}) => {
  const { transactions, categories, deleteTransaction, settings, showToast } = useFinance();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Delete modal state
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx: Transaction) => {
        // Search description & notes
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesDesc = tx.description.toLowerCase().includes(q);
          const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
          if (!matchesDesc && !matchesNotes) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
          return false;
        }

        // Type filter
        if (selectedType !== 'all' && tx.type !== selectedType) {
          return false;
        }

        // Payment method filter
        if (selectedPayment !== 'all' && tx.paymentMethod !== selectedPayment) {
          return false;
        }

        return true;
      })
      .sort((a: Transaction, b: Transaction) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amount-desc') {
          return b.amountCents - a.amountCents;
        }
        // amount-asc
        return a.amountCents - b.amountCents;
      });
  }, [transactions, searchQuery, selectedCategory, selectedType, selectedPayment, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export', 'info');
      return;
    }
    const csvString = exportTransactionsToCSV(filteredTransactions, settings.currency);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `spendsense-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported to CSV', 'success');
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'expense':
        return <ArrowUpRight className="w-3.5 h-3.5 text-burgundy-700" />;
      case 'income':
        return <ArrowDownRight className="w-3.5 h-3.5 text-forest-700" />;
      case 'transfer':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-charcoal-500" />;
      case 'refund':
        return <RotateCcw className="w-3.5 h-3.5 text-forest-700" />;
    }
  };

  const getAmountDisplay = (tx: Transaction) => {
    const formatted = formatMoney(tx.amountCents, settings.currency);
    if (tx.type === 'income') {
      return <span className="font-semibold text-forest-700">+{formatted}</span>;
    }
    if (tx.type === 'refund') {
      return <span className="text-forest-700">+{formatted}</span>;
    }
    if (tx.type === 'transfer') {
      return <span className="text-charcoal-600">{formatted}</span>;
    }
    return <span className="font-medium text-charcoal-900">-{formatted}</span>;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedPayment('all');
    setSortBy('date-desc');
  };

  const isFiltered =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    selectedPayment !== 'all' ||
    sortBy !== 'date-desc';

  return (
    <div className="space-y-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-charcoal-900 tracking-tight">
            Transactions
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            {filteredTransactions.length} recorded {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-charcoal-700 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-charcoal-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-forest-800 hover:bg-forest-900 rounded shadow-subtle transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search description or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-charcoal-300 placeholder:text-charcoal-400 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-charcoal-300 bg-white text-charcoal-800 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-charcoal-300 bg-white text-charcoal-800 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
              <option value="refund">Refund</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-charcoal-300 bg-white text-charcoal-800 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {isFiltered && (
          <div className="flex items-center justify-between pt-2 border-t border-charcoal-100 text-xs">
            <span className="text-charcoal-500">Filters applied</span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-forest-800 hover:text-forest-900 font-medium"
            >
              <RotateCw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table / Responsive List */}
      <div className="bg-white border border-charcoal-200 rounded-lg shadow-subtle overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-charcoal-400">
            {isFiltered
              ? 'No transactions matching your filter criteria.'
              : 'No transactions recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-charcoal-200">
              <thead className="bg-paper-50 text-charcoal-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Description</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Payment</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100 bg-white">
                {filteredTransactions.map((tx: Transaction) => {
                  const dateStr = format(parseISO(tx.date), 'd MMM yyyy, h:mm a');

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-paper-50/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-charcoal-500 whitespace-nowrap tabular-nums">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-semibold text-charcoal-900 truncate">
                          {tx.description}
                        </p>
                        {tx.notes && (
                          <p className="text-[11px] text-charcoal-400 truncate mt-0.5">
                            {tx.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-charcoal-700">{tx.category}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(tx.type)}
                          <span className="capitalize text-charcoal-700">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-charcoal-500 capitalize">
                        {tx.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-xs">
                        {getAmountDisplay(tx)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 text-charcoal-400 hover:text-charcoal-800 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTransactionToDelete(tx)}
                            className="p-1 text-charcoal-400 hover:text-burgundy-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={() => {
          if (transactionToDelete) deleteTransaction(transactionToDelete.id);
        }}
        title="Delete Transaction"
        message={`Are you sure you want to permanently delete "${transactionToDelete?.description}"?`}
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  );
};

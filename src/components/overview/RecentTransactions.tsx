import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { formatMoney } from '../../engine/calculations';
import { format, parseISO } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  RotateCcw,
  Edit2,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface RecentTransactionsProps {
  onEditTransaction: (tx: Transaction) => void;
  onViewAll: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  onEditTransaction,
  onViewAll,
}) => {
  const { periodTransactions, deleteTransaction, settings } = useFinance();
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Take the most recent 6 transactions in this period
  const recent = periodTransactions.slice(0, 6);

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'expense':
        return <ArrowUpRight className="w-4 h-4 text-burgundy-700" />;
      case 'income':
        return <ArrowDownRight className="w-4 h-4 text-forest-700" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-charcoal-500" />;
      case 'refund':
        return <RotateCcw className="w-4 h-4 text-forest-700" />;
    }
  };

  const getAmountColor = (type: Transaction['type']) => {
    switch (type) {
      case 'expense':
        return 'text-charcoal-900';
      case 'income':
        return 'text-forest-700 font-semibold';
      case 'refund':
        return 'text-forest-700';
      case 'transfer':
        return 'text-charcoal-600';
    }
  };

  const formatTxAmount = (tx: Transaction) => {
    const formatted = formatMoney(tx.amountCents, settings.currency);
    if (tx.type === 'income') return `+${formatted}`;
    if (tx.type === 'refund') return `+${formatted} (refund)`;
    if (tx.type === 'transfer') return `${formatted} (transfer)`;
    return formatted;
  };

  return (
    <div className="bg-white border border-charcoal-200 rounded-lg p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-charcoal-100">
        <div>
          <h3 className="text-sm font-semibold text-charcoal-900">Latest Activity</h3>
          <p className="text-xs text-charcoal-500 mt-0.5">Recorded transactions in active period</p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-forest-800 hover:text-forest-900 hover:underline transition-all"
        >
          View all ({periodTransactions.length}) &rarr;
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-xs text-charcoal-400">
          No transactions recorded for this period.
        </div>
      ) : (
        <div className="divide-y divide-charcoal-100">
          {recent.map((tx) => {
            const formattedDate = format(parseISO(tx.date), 'd MMM, h:mm a');

            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-4 group hover:bg-paper-50/50 px-2 rounded -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded bg-charcoal-50 border border-charcoal-200 shrink-0">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-charcoal-900 truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-charcoal-500">{tx.category}</span>
                      <span className="text-charcoal-300">&bull;</span>
                      <span className="text-[11px] text-charcoal-400 tabular-nums">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-medium tabular-nums ${getAmountColor(tx.type)}`}
                  >
                    {formatTxAmount(tx)}
                  </span>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      className="p-1 text-charcoal-400 hover:text-charcoal-700 rounded transition-colors"
                      title="Edit transaction"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionToDelete(tx)}
                      className="p-1 text-charcoal-400 hover:text-burgundy-700 rounded transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={() => {
          if (transactionToDelete) deleteTransaction(transactionToDelete.id);
        }}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToDelete?.description}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  );
};

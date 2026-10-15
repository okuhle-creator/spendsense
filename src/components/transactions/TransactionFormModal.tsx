import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType, PaymentMethod } from '../../types';
import { CURRENCY_MAP, PAYMENT_METHODS } from '../../constants/categories';
import { decimalToCents, centsToDecimal } from '../../engine/calculations';
import { format } from 'date-fns';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { categories, settings, addTransaction, updateTransaction } = useFinance();
  const currencyInfo = CURRENCY_MAP[settings.currency] || CURRENCY_MAP.INR;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi_gpay');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(centsToDecimal(transactionToEdit.amountCents).toString());
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category);
      // Format to datetime-local input string: YYYY-MM-DDTHH:mm
      try {
        const d = new Date(transactionToEdit.date);
        setDate(format(d, "yyyy-MM-dd'T'HH:mm"));
      } catch {
        setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      }
      setPaymentMethod(transactionToEdit.paymentMethod);
      setNotes(transactionToEdit.notes || '');
    } else {
      // Default new transaction values
      setType('expense');
      setAmount('');
      setDescription('');
      setCategory(categories[0]?.name || 'Food and dining');
      setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setPaymentMethod('upi_gpay');
      setNotes('');
    }
    setError(null);
  }, [transactionToEdit, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a merchant name or description.');
      return;
    }

    if (!category.trim()) {
      setError('Please select a category.');
      return;
    }

    let parsedDateIso: string;
    try {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) throw new Error();
      parsedDateIso = parsed.toISOString();
    } catch {
      setError('Please enter a valid date and time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const amountCents = decimalToCents(numericAmount);

      if (transactionToEdit) {
        await updateTransaction({
          ...transactionToEdit,
          type,
          amountCents,
          description: description.trim(),
          category: category.trim(),
          date: parsedDateIso,
          paymentMethod,
          notes: notes.trim() || undefined,
        });
      } else {
        await addTransaction({
          type,
          amountCents,
          description: description.trim(),
          category: category.trim(),
          date: parsedDateIso,
          paymentMethod,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
      subtitle={transactionToEdit ? 'Update transaction details' : 'Quickly record an expense, income, or transfer'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-burgundy-50 border border-burgundy-200 text-burgundy-800 text-xs rounded-md">
            {error}
          </div>
        )}

        {/* Transaction Type Segmented Control */}
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-charcoal-100 rounded-md">
            {(
              [
                { id: 'expense', label: 'Expense' },
                { id: 'income', label: 'Income' },
                { id: 'transfer', label: 'Transfer' },
                { id: 'refund', label: 'Refund' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`py-1.5 text-xs font-medium rounded transition-all ${
                  type === t.id
                    ? 'bg-white text-charcoal-900 shadow-subtle'
                    : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {type === 'transfer' && (
            <p className="text-[11px] text-charcoal-500 mt-1">
              Internal transfers between your own accounts do not count towards expense totals.
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label htmlFor="tx-amount" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
            Amount ({currencyInfo.symbol}) *
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-charcoal-500 text-sm font-semibold">{currencyInfo.symbol}</span>
            </div>
            <input
              id="tx-amount"
              type="number"
              step="0.01"
              inputMode="decimal"
              autoFocus={!transactionToEdit}
              placeholder="0.00"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-md border border-charcoal-300 pl-8 pr-4 py-2 text-base font-semibold text-charcoal-900 placeholder:text-charcoal-400 focus:border-forest-700 focus:ring-1 focus:ring-forest-700 tabular-nums"
            />
          </div>
        </div>

        {/* Merchant / Description */}
        <div>
          <label htmlFor="tx-description" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
            Merchant / Description *
          </label>
          <input
            id="tx-description"
            type="text"
            required
            placeholder="e.g. Swiggy, Metro Card, Shell Fuel"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border border-charcoal-300 px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
          />
        </div>

        {/* Category & Payment Method in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-category" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-md border border-charcoal-300 px-3 py-2 text-sm text-charcoal-900 focus:border-forest-700 focus:ring-1 focus:ring-forest-700 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tx-payment" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              id="tx-payment"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="block w-full rounded-md border border-charcoal-300 px-3 py-2 text-sm text-charcoal-900 focus:border-forest-700 focus:ring-1 focus:ring-forest-700 bg-white"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <label htmlFor="tx-date" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
            Date & Time *
          </label>
          <input
            id="tx-date"
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-md border border-charcoal-300 px-3 py-2 text-sm text-charcoal-900 focus:border-forest-700 focus:ring-1 focus:ring-forest-700 bg-white"
          />
        </div>

        {/* Optional Notes */}
        <div>
          <label htmlFor="tx-notes" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
            Note <span className="font-normal text-charcoal-400 lowercase">(optional)</span>
          </label>
          <input
            id="tx-notes"
            type="text"
            placeholder="Add relevant context or receipt memo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full rounded-md border border-charcoal-300 px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
          />
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
            {isSubmitting ? 'Saving...' : transactionToEdit ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

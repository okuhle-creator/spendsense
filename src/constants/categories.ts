import { Category, CurrencyCode } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food and dining', isDefault: true, color: '#1F4D3C' },
  { id: 'cat-groceries', name: 'Groceries', isDefault: true, color: '#2A634E' },
  { id: 'cat-transport', name: 'Transport', isDefault: true, color: '#334155' },
  { id: 'cat-education', name: 'Education', isDefault: true, color: '#1E293B' },
  { id: 'cat-shopping', name: 'Shopping', isDefault: true, color: '#475569' },
  { id: 'cat-bills', name: 'Bills and utilities', isDefault: true, color: '#7E263A' },
  { id: 'cat-health', name: 'Health', isDefault: true, color: '#0D281E' },
  { id: 'cat-entertainment', name: 'Entertainment', isDefault: true, color: '#631D2D' },
  { id: 'cat-accommodation', name: 'Accommodation', isDefault: true, color: '#64748B' },
  { id: 'cat-other', name: 'Other', isDefault: true, color: '#94A3B8' },
];

export const PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: 'upi_gpay', label: 'UPI / Google Pay' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'debit_card', label: 'Debit Card' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'other', label: 'Other' },
];

export const CURRENCY_MAP: Record<CurrencyCode, { symbol: string; label: string; locale: string }> = {
  INR: { symbol: '₹', label: 'Indian Rupee (INR)', locale: 'en-IN' },
  USD: { symbol: '$', label: 'US Dollar (USD)', locale: 'en-US' },
  EUR: { symbol: '€', label: 'Euro (EUR)', locale: 'de-DE' },
  GBP: { symbol: '£', label: 'British Pound (GBP)', locale: 'en-GB' },
  CAD: { symbol: 'CA$', label: 'Canadian Dollar (CAD)', locale: 'en-CA' },
  AUD: { symbol: 'A$', label: 'Australian Dollar (AUD)', locale: 'en-AU' },
};

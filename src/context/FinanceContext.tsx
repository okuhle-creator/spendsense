import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Budget,
  Category,
  UserSettings,
  PeriodType,
  PeriodInterval,
  CategorySummary,
  PeriodComparison,
  FinancialInsight,
} from '../types';
import { storage } from '../services/storage';
import { isSupabaseConfigured } from '../services/supabase';
import {
  getPeriodInterval,
  filterTransactionsByInterval,
  calculateTotals,
  calculateCategoryBreakdown,
  calculatePeriodComparison,
  calculateBudgetStatus,
  BudgetStatus,
} from '../engine/calculations';
import { generateInsights } from '../engine/insights';
import { format } from 'date-fns';

interface ToastState {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  settings: UserSettings;
  isLoading: boolean;
  activePeriod: PeriodType;
  periodOffset: number;
  currentInterval: PeriodInterval;
  periodTransactions: Transaction[];
  previousPeriodTransactions: Transaction[];
  totals: ReturnType<typeof calculateTotals>;
  categoryBreakdown: CategorySummary[];
  periodComparison: PeriodComparison;
  currentBudget: Budget | null;
  budgetStatus: BudgetStatus;
  insights: FinancialInsight[];
  hasSufficientData: boolean;
  isCloudMode: boolean;
  isSupabaseReady: boolean;
  toasts: ToastState[];
  setActivePeriod: (period: PeriodType) => void;
  setPeriodOffset: (offset: number) => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
  resetPeriodToCurrent: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  addBatchTransactions: (txs: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<Transaction[]>;
  saveBudget: (budget: Budget) => Promise<Budget>;
  addCategory: (category: Category) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;
  updateSettings: (settings: UserSettings) => Promise<UserSettings>;
  resetToDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  showToast: (message: string, type?: ToastState['type']) => void;
  dismissToast: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    currency: 'INR',
    userName: 'Personal Account',
    email: 'user@spendsense.app',
    enableAlerts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<PeriodType>('month');
  const [periodOffset, setPeriodOffset] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial data load
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txs, bgs, cats, sets] = await Promise.all([
        storage.getTransactions(),
        storage.getBudgets(),
        storage.getCategories(),
        storage.getSettings(),
      ]);
      setTransactions(txs);
      setBudgets(bgs);
      setCategories(cats);
      setSettings(sets);
    } catch (err) {
      console.error('Failed to load financial data:', err);
      showToast('Error loading financial data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Date Interval Calculations
  const currentInterval = useMemo(() => {
    return getPeriodInterval(activePeriod, periodOffset);
  }, [activePeriod, periodOffset]);

  const previousInterval = useMemo(() => {
    return getPeriodInterval(activePeriod, periodOffset - 1);
  }, [activePeriod, periodOffset]);

  // Filtered transactions for active period
  const periodTransactions = useMemo(() => {
    return filterTransactionsByInterval(transactions, currentInterval);
  }, [transactions, currentInterval]);

  // Previous period transactions for comparison
  const previousPeriodTransactions = useMemo(() => {
    return filterTransactionsByInterval(transactions, previousInterval);
  }, [transactions, previousInterval]);

  // Calculations
  const totals = useMemo(() => {
    return calculateTotals(periodTransactions);
  }, [periodTransactions]);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(periodTransactions);
  }, [periodTransactions]);

  const periodComparison = useMemo(() => {
    return calculatePeriodComparison(periodTransactions, previousPeriodTransactions);
  }, [periodTransactions, previousPeriodTransactions]);

  // Current Month's Budget
  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const currentBudget = useMemo(() => {
    return budgets.find((b) => b.month === currentMonthKey) || null;
  }, [budgets, currentMonthKey]);

  // Budget status (evaluated against all transactions in current calendar month)
  const currentMonthInterval = useMemo(() => getPeriodInterval('month', 0), []);
  const currentMonthTransactions = useMemo(() => {
    return filterTransactionsByInterval(transactions, currentMonthInterval);
  }, [transactions, currentMonthInterval]);

  const budgetStatus = useMemo(() => {
    return calculateBudgetStatus(currentBudget, currentMonthTransactions);
  }, [currentBudget, currentMonthTransactions]);

  // Rule-based Insights
  const { insights, hasSufficientData } = useMemo(() => {
    return generateInsights(transactions, currentBudget, settings.currency);
  }, [transactions, currentBudget, settings.currency]);

  // Navigation handlers
  const navigatePrevious = useCallback(() => {
    setPeriodOffset((prev) => prev - 1);
  }, []);

  const navigateNext = useCallback(() => {
    setPeriodOffset((prev) => prev + 1);
  }, []);

  const resetPeriodToCurrent = useCallback(() => {
    setPeriodOffset(0);
  }, []);

  // CRUD Operations
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const saved = await storage.saveTransaction(tx);
      setTransactions((prev) => [saved, ...prev]);
      showToast('Transaction recorded successfully', 'success');
      return saved;
    },
    [showToast]
  );

  const updateTransaction = useCallback(
    async (tx: Transaction) => {
      const saved = await storage.saveTransaction(tx);
      setTransactions((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      showToast('Transaction updated', 'success');
      return saved;
    },
    [showToast]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const success = await storage.deleteTransaction(id);
      if (success) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        showToast('Transaction deleted', 'info');
      }
      return success;
    },
    [showToast]
  );

  const addBatchTransactions = useCallback(
    async (txs: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      const saved = await storage.saveBatchTransactions(txs);
      setTransactions((prev) => [...saved, ...prev]);
      showToast(`Imported ${saved.length} transactions successfully`, 'success');
      return saved;
    },
    [showToast]
  );

  const saveBudget = useCallback(
    async (budget: Budget) => {
      const saved = await storage.saveBudget(budget);
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.month === saved.month);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      showToast('Budget saved', 'success');
      return saved;
    },
    [showToast]
  );

  const addCategory = useCallback(
    async (category: Category) => {
      const saved = await storage.saveCategory(category);
      setCategories((prev) => [...prev, saved]);
      showToast(`Category "${saved.name}" added`, 'success');
      return saved;
    },
    [showToast]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const success = await storage.deleteCategory(id);
      if (success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showToast('Category removed', 'info');
      }
      return success;
    },
    [showToast]
  );

  const updateSettings = useCallback(
    async (newSettings: UserSettings) => {
      const saved = await storage.saveSettings(newSettings);
      setSettings(saved);
      showToast('Settings saved', 'success');
      return saved;
    },
    [showToast]
  );

  const resetToDemoData = useCallback(async () => {
    storage.resetToSeedData();
    await loadInitialData();
    showToast('Loaded sample demo records', 'info');
  }, [loadInitialData, showToast]);

  const clearAllData = useCallback(async () => {
    storage.clearAllData();
    await loadInitialData();
    showToast('All transaction records cleared', 'info');
  }, [loadInitialData, showToast]);

  const value: FinanceContextType = {
    transactions,
    budgets,
    categories,
    settings,
    isLoading,
    activePeriod,
    periodOffset,
    currentInterval,
    periodTransactions,
    previousPeriodTransactions,
    totals,
    categoryBreakdown,
    periodComparison,
    currentBudget,
    budgetStatus,
    insights,
    hasSufficientData,
    isCloudMode: storage.isCloudMode(),
    isSupabaseReady: isSupabaseConfigured(),
    toasts,
    setActivePeriod,
    setPeriodOffset,
    navigatePrevious,
    navigateNext,
    resetPeriodToCurrent,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBatchTransactions,
    saveBudget,
    addCategory,
    deleteCategory,
    updateSettings,
    resetToDemoData,
    clearAllData,
    showToast,
    dismissToast,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

import { Transaction, Budget, Category, UserSettings, StorageAdapter } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { getSeedTransactions, getSeedBudget } from '../constants/seedData';
import { supabase, isSupabaseConfigured } from './supabase';

const KEYS = {
  TRANSACTIONS: 'spendsense_transactions_v1',
  BUDGETS: 'spendsense_budgets_v1',
  CATEGORIES: 'spendsense_categories_v1',
  SETTINGS: 'spendsense_settings_v1',
  HAS_INITIALIZED: 'spendsense_initialized_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'INR',
  userName: 'Personal Account',
  email: 'user@spendsense.app',
  enableAlerts: true,
};

class StorageService implements StorageAdapter {
  private isConfiguredCloud = isSupabaseConfigured();

  constructor() {
    this.ensureLocalStorageInitialized();
  }

  private ensureLocalStorageInitialized() {
    try {
      const initialized = localStorage.getItem(KEYS.HAS_INITIALIZED);
      if (!initialized) {
        // Initialize with default categories, sample transactions, and sample budget
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(getSeedTransactions()));
        localStorage.setItem(KEYS.BUDGETS, JSON.stringify([getSeedBudget()]));
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        localStorage.setItem(KEYS.HAS_INITIALIZED, 'true');
      }
    } catch {
      // LocalStorage unavailable (e.g. strict private window)
    }
  }

  public isCloudMode(): boolean {
    return this.isConfiguredCloud;
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    if (this.isConfiguredCloud && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase getTransactions error:', error);
      } else if (data) {
        return data.map((row) => ({
          id: row.id,
          amountCents: Number(row.amount_cents),
          type: row.type,
          category: row.category,
          description: row.description,
          date: row.date,
          paymentMethod: row.payment_method,
          notes: row.notes,
          userId: row.user_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    }

    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async saveTransaction(
    tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<Transaction> {
    const now = new Date().toISOString();
    const id = tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const fullTx: Transaction = {
      ...tx,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (this.isConfiguredCloud && supabase) {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const payload = {
          id: fullTx.id,
          user_id: user.user.id,
          amount_cents: fullTx.amountCents,
          type: fullTx.type,
          category: fullTx.category,
          description: fullTx.description,
          date: fullTx.date,
          payment_method: fullTx.paymentMethod,
          notes: fullTx.notes,
        };

        const { error } = await supabase.from('transactions').upsert(payload);
        if (error) console.error('Supabase saveTransaction error:', error);
      }
    }

    // Local storage fallback / mirror
    const existing = await this.getTransactions();
    const idx = existing.findIndex((t) => t.id === fullTx.id);
    let updated: Transaction[];
    if (idx !== -1) {
      updated = [...existing];
      updated[idx] = { ...existing[idx], ...fullTx, updatedAt: now };
    } else {
      updated = [fullTx, ...existing];
    }

    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
    return fullTx;
  }

  async saveBatchTransactions(transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Transaction[]> {
    const existing = await this.getTransactions();
    const now = new Date().toISOString();

    const created: Transaction[] = transactions.map((tx, idx) => ({
      ...tx,
      id: `tx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    }));

    const combined = [...created, ...existing];
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(combined));

    if (this.isConfiguredCloud && supabase) {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const payload = created.map((t) => ({
          id: t.id,
          user_id: user.user.id,
          amount_cents: t.amountCents,
          type: t.type,
          category: t.category,
          description: t.description,
          date: t.date,
          payment_method: t.paymentMethod,
          notes: t.notes,
        }));
        await supabase.from('transactions').insert(payload);
      }
    }

    return created;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    if (this.isConfiguredCloud && supabase) {
      await supabase.from('transactions').delete().eq('id', id);
    }

    const existing = await this.getTransactions();
    const filtered = existing.filter((t) => t.id !== id);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return true;
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    if (this.isConfiguredCloud && supabase) {
      const { data, error } = await supabase.from('budgets').select('*');
      if (!error && data) {
        return data.map((b) => ({
          id: b.id,
          month: b.month,
          overallLimitCents: Number(b.overall_limit_cents),
          categoryLimits: b.category_limits || {},
          alertThresholds: b.alert_thresholds || [75, 90, 100],
        }));
      }
    }

    try {
      const data = localStorage.getItem(KEYS.BUDGETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async saveBudget(budget: Budget): Promise<Budget> {
    const existing = await this.getBudgets();
    const idx = existing.findIndex((b) => b.month === budget.month);
    let updated: Budget[];
    if (idx !== -1) {
      updated = [...existing];
      updated[idx] = budget;
    } else {
      updated = [...existing, budget];
    }
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(updated));

    if (this.isConfiguredCloud && supabase) {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.from('budgets').upsert({
          id: budget.id,
          user_id: user.user.id,
          month: budget.month,
          overall_limit_cents: budget.overallLimitCents,
          category_limits: budget.categoryLimits,
          alert_thresholds: budget.alertThresholds,
        });
      }
    }

    return budget;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const data = localStorage.getItem(KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  async saveCategory(category: Category): Promise<Category> {
    const categories = await this.getCategories();
    const idx = categories.findIndex((c) => c.id === category.id);
    let updated: Category[];
    if (idx !== -1) {
      updated = [...categories];
      updated[idx] = category;
    } else {
      updated = [...categories, category];
    }
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(updated));
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const categories = await this.getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(filtered));
    return true;
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: UserSettings): Promise<UserSettings> {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }

  // Reset / Clear / Seed Actions
  clearAllData(): void {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify([]));
  }

  resetToSeedData(): void {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(getSeedTransactions()));
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify([getSeedBudget()]));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

export const storage = new StorageService();

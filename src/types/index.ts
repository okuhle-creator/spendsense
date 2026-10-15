export type TransactionType = 'expense' | 'income' | 'transfer' | 'refund';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'debit_card'
  | 'credit_card'
  | 'upi_gpay'
  | 'other';

export interface Transaction {
  id: string;
  amountCents: number; // Stored in minor units (e.g., paise/cents) to avoid floating point issues
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO 8601 string: YYYY-MM-DDTHH:mm:ss.sssZ
  paymentMethod: PaymentMethod;
  notes?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
  color?: string;
  iconName?: string;
}

export interface Budget {
  id: string;
  month: string; // Format: YYYY-MM
  overallLimitCents: number;
  categoryLimits: Record<string, number>; // category name -> limit in cents
  alertThresholds: number[]; // e.g. [75, 90, 100]
}

export type PeriodType = 'today' | 'week' | 'month';

export interface PeriodInterval {
  type: PeriodType;
  start: Date;
  end: Date;
  label: string;
  offset: number; // 0 = current, -1 = previous, +1 = next
}

export interface CategorySummary {
  category: string;
  totalCents: number;
  count: number;
  percentage: number;
}

export interface PeriodComparison {
  currentCents: number;
  previousCents: number;
  diffCents: number;
  percentageChange: number | null; // null if previous was 0
  isIncrease: boolean;
}

export interface FinancialInsight {
  id: string;
  type: 'info' | 'positive' | 'warning' | 'alert';
  message: string;
  detail?: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export interface UserSettings {
  currency: CurrencyCode;
  userName: string;
  email: string;
  monthlyIncomeGoalCents?: number;
  enableAlerts: boolean;
}

export interface CSVParseRow {
  date: string;
  amount: number;
  description: string;
  category?: string;
  type?: TransactionType;
  paymentMethod?: PaymentMethod;
  notes?: string;
  isDuplicate?: boolean;
  duplicateMatchId?: string;
  error?: string;
}

export interface StorageAdapter {
  getTransactions(): Promise<Transaction[]>;
  saveTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  getBudgets(): Promise<Budget[]>;
  saveBudget(budget: Budget): Promise<Budget>;
  getCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<UserSettings>;
}

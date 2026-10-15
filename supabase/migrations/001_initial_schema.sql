-- ====================================================================
-- SPENDSENSE DATABASE SCHEMA & ROW-LEVEL SECURITY POLICIES
-- ====================================================================

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Transactions Table
-- Monetary amounts are stored in minor units (BIGINT cents / paise)
-- to avoid floating-point inaccuracies.
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income', 'transfer', 'refund')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  overall_limit_cents BIGINT NOT NULL CHECK (overall_limit_cents >= 0),
  category_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  alert_thresholds INT[] NOT NULL DEFAULT ARRAY[75, 90, 100],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Categories Policies
CREATE POLICY "Users can view their categories or global defaults"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view only their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can view only their own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

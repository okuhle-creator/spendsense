# SpendSense

> A minimal, elegant personal expense management web application designed for calm, accurate financial tracking.

SpendSense provides instant clarity on where money goes across **daily**, **weekly**, and **monthly** horizons. Designed with an **institutional elegance** aesthetic inspired by academic portals, financial journals, and editorial software, SpendSense prioritizes readability, precision, and privacy over dashboard clutter.

---

## 1. Product Overview

SpendSense answers core financial questions immediately upon opening:
- **How much did I spend today?**
- **How much did I spend this week?** (Monday through Sunday)
- **How much did I spend this month?**
- **What did I spend money on?** (Category breakdowns and trends)
- **How much remains in my monthly budget?**
- **Is my spending increasing or decreasing compared to prior periods?**
- **Which transactions have been recorded?**

---

## 2. Key Features

- **Fast Expense Logging:**
  - Record purchases in under 5 seconds with numeric input mode and keyboard shortcuts.
  - Granular classification: *Expense*, *Income*, *Transfer*, and *Refund*.
  - Account transfers are excluded from expense totals; refunds cleanly offset categories.
  - Pre-loaded with sensible categories (*Food & Dining*, *Groceries*, *Transport*, *Education*, *Shopping*, *Bills & Utilities*, *Health*, *Entertainment*, *Accommodation*, *Other*) plus custom category creation.

- **Reliable Date-Based Engine:**
  - Strict calendar boundaries: **Today** (00:00 to 23:59), **This Week** (Monday 00:00 to Sunday 23:59), and **This Month** (1st through current date).
  - Offset navigation: Review yesterday, last week, last month, or historical periods.
  - Period-over-period percentage and absolute delta comparisons.

- **Budgets with In-App Alerts:**
  - Overall monthly limits and optional category-specific monthly caps.
  - Real-time progress bars and threshold warnings at **75%**, **90%**, and **100%+** limit breaches.
  - Safe zero-budget handling: no misleading zero-remaining numbers.

- **Reports & Restrained Analytics:**
  - Daily expenditure bar charts powered by Recharts with clearly labeled axes and tooltips.
  - Category breakdown tables with percentages and transaction counts.
  - Rule-based financial observations calculated strictly from recorded data (no AI chatbot or guessed figures).
  - One-click CSV export of filtered transaction histories.

- **Statement & Google Pay Import Pathway:**
  - Interactive CSV import for bank statements and UPI payment histories.
  - Auto-detection of columns (*Date*, *Amount*, *Description*, *Category*, *Type*).
  - Built-in duplicate detection matching date, amount, and payee.
  - Preview table with validation summaries and explicit user confirmation before committing.
  - Downloadable Google Pay/UPI reference template.

- **Dual Storage Architecture:**
  - **Local Mode (Default):** Works completely offline with `localStorage` persistence, zero configuration required.
  - **Cloud Mode:** Ready for Supabase PostgreSQL with strict Row Level Security (RLS).

---

## 3. Technologies Used

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Custom institutional palette: warm paper tones, charcoal typography, forest-green and muted burgundy accents)
- **Icons:** Lucide React (clean, restrained stroke weights)
- **Charts:** Recharts
- **Date Engine:** `date-fns` (Monday-first ISO week boundaries)
- **CSV Engine:** `papaparse`
- **Testing:** Vitest
- **Backend / Database (Optional):** Supabase (PostgreSQL with RLS)

---

## 4. Prerequisites

- **Node.js:** v18.0.0 or later (v20+ or v24+ recommended)
- **npm:** v9.0.0 or later
- **Git**

---

## 5. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/your-username/spendsense.git
cd spendsense

# Install dependencies
npm install
```

---

## 6. Running Locally

Start the Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. SpendSense will immediately launch in **Local Storage Mode** with sample records available.

To run the automated test suite:

```bash
npm test
```

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 7. Environment Variables

SpendSense runs out-of-the-box with **zero configuration** in Local Storage Mode.

To connect Supabase cloud persistence, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your project credentials:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*Note: Never commit `.env` or service role keys to GitHub. The `.gitignore` file is configured to exclude all `.env` files.*

---

## 8. Supabase Database Configuration (Optional)

If you wish to use Supabase cloud sync:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/001_initial_schema.sql` from this repository.
4. Run the SQL script. This sets up:
   - `profiles`, `categories`, `transactions`, and `budgets` tables.
   - Integer minor-unit (`BIGINT`) currency storage.
   - High-performance indexes on `(user_id, date)` and `(user_id, month)`.
   - **Row Level Security (RLS)** policies ensuring users can only read, insert, update, and delete their own records.
5. In your project settings, copy the **Project URL** and **Anon Public Key** into `.env`.
6. Restart Vite (`npm run dev`). SpendSense will detect the credentials and display the **Cloud Connected** indicator.

---

## 9. Deployment

### Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. (Optional) Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Environment Variables.

### Deploying to Netlify / GitHub Pages / Cloudflare Pages

Ensure that the build output folder is set to `dist`. For client-side routing fallback, standard SPA redirects are supported.

---

## 10. Integration Philosophy & Google Pay Transparency

SpendSense takes an honest, security-first approach to third-party payment integrations:

1. **No Silent Scraping or Credential Theft:**
   - Google Pay does not expose an open, public web API allowing external browsers to automatically read private transaction histories.
   - We **never** ask for your Google password, 2FA code, UPI PIN, or bank OTP.
   - We **never** scrape SMS in the background without explicit OS-level bank APIs.

2. **Supported Import Workflow:**
   - Export your monthly statement (CSV) from your bank or Google Takeout.
   - Use the **Import CSV** workflow in SpendSense. Our column detector matches dates, amounts, and payees automatically, identifies duplicate rows, and requires your explicit confirmation before saving.

3. **Future Extensibility:**
   - The application is structured with modular data adapters (`src/services/storage.ts`) ready to integrate with regulated Open Banking / Account Aggregator frameworks (e.g. Sahamati / Plaid) when institutional API credentials are provided.

---

## 11. Project Architecture

```
spendsense/
├── src/
│   ├── components/
│   │   ├── budgets/         # Budget configuration modals and progress cards
│   │   ├── common/          # Modals, confirmation dialogs, toasts, badges
│   │   ├── import/          # CSV parser wizard & Google Pay guide
│   │   ├── layout/          # Institutional header, desktop nav & mobile bottom nav
│   │   ├── overview/        # Period selector, metric cards, category breakdown
│   │   └── transactions/    # Fast expense logging form and table filters
│   ├── constants/           # Default categories, currencies, seed demo data
│   ├── context/             # FinanceContext unified state management
│   ├── engine/              # Pure calculation engine, insights, CSV parser & tests
│   ├── pages/               # Overview, Transactions, Budgets, Reports, Settings
│   ├── services/            # Storage adapter (Local storage fallback & Supabase RLS)
│   ├── types/               # TypeScript domain models and interfaces
│   ├── App.tsx              # Application root
│   ├── index.css            # Tailwind directives and typography
│   └── main.tsx             # Application bootstrap
├── supabase/
│   └── migrations/          # Complete SQL schema and Row Level Security policies
├── .env.example             # Safe environment variable template
├── .gitignore               # Strict exclusion of secrets and build files
├── package.json             # Manifest and test scripts
├── tailwind.config.js       # Institutional elegance theme configuration
└── vite.config.ts           # Bundler configuration
```

---

## 12. Quality Assurance & Verification

SpendSense includes an automated test suite executed with Vitest:

```bash
npm test
```

Verified test coverage includes:
- Monday-through-Sunday week boundary calculations.
- Today and Month start/end interval boundaries.
- Exclusion of account-to-account transfers from expenses.
- Category refund offsets and net cash flow calculations.
- Avoidance of IEEE-754 floating-point rounding errors via integer minor units.
- Budget percentage utilization and threshold warning triggers (75%, 90%, 100%).
- Multi-format international date parsing (ISO, YYYY-MM-DD, DD/MM/YYYY, etc.).
- Robust amount cleaning (symbols, commas, negative notations).
- Duplicate transaction detection (matching date, amount, description).
- Rule-based insight generation and insufficient-data edge cases.

---

## License

MIT License. Designed with care for financial calm.

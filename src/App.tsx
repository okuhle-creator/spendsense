import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { Navigation, TabKey } from './components/layout/Navigation';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/Toast';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { CSVImportModal } from './components/import/CSVImportModal';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Transaction } from './types';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsAddExpenseOpen(true);
  };

  const handleCloseForm = () => {
    setIsAddExpenseOpen(false);
    setTransactionToEdit(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper-100 text-charcoal-900 pb-16 md:pb-8">
      {/* Top Header */}
      <Header
        onOpenAddExpense={() => {
          setTransactionToEdit(null);
          setIsAddExpenseOpen(true);
        }}
        onOpenImport={() => setIsImportModalOpen(true)}
      />

      {/* Horizontal Nav Bar */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <OverviewPage
            onOpenAddExpense={() => {
              setTransactionToEdit(null);
              setIsAddExpenseOpen(true);
            }}
            onEditTransaction={handleEditTransaction}
            onNavigateToTransactions={() => setActiveTab('transactions')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsPage
            onOpenAddExpense={() => {
              setTransactionToEdit(null);
              setIsAddExpenseOpen(true);
            }}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'budgets' && <BudgetsPage />}

        {activeTab === 'reports' && <ReportsPage />}

        {activeTab === 'settings' && (
          <SettingsPage onOpenImportModal={() => setIsImportModalOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-charcoal-200 py-6 text-center text-xs text-charcoal-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SpendSense — Minimal, institutional personal expense management.</span>
          <span className="text-charcoal-400">Pure client & cloud architecture &bull; Zero telemetry tracking</span>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Quick Expense Form Modal */}
      <TransactionFormModal
        isOpen={isAddExpenseOpen}
        onClose={handleCloseForm}
        transactionToEdit={transactionToEdit}
      />

      {/* CSV & Statement Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Toast Feedback Notifications */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <FinanceProvider>
      <MainContent />
    </FinanceProvider>
  );
}

export default App;

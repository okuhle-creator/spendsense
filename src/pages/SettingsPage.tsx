import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CURRENCY_MAP } from '../constants/categories';
import { CurrencyCode, Category } from '../types';
import { GooglePayGuide } from '../components/import/GooglePayGuide';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Globe,
  Tag,
  Shield,
  Database,
  Trash2,
  Sparkles,
  Download,
  Plus,
  Check,
} from 'lucide-react';

interface SettingsPageProps {
  onOpenImportModal: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenImportModal }) => {
  const {
    settings,
    updateSettings,
    categories,
    addCategory,
    deleteCategory,
    transactions,
    budgets,
    resetToDemoData,
    clearAllData,
    isCloudMode,
    isSupabaseReady,
    showToast,
  } = useFinance();

  // Category creation
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Dialogs
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Currency update
  const handleCurrencyChange = (newCurr: CurrencyCode) => {
    updateSettings({ ...settings, currency: newCurr });
  };

  // Add category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const exists = categories.some(
      (c: Category) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (exists) {
      showToast('A category with this name already exists', 'warning');
      return;
    }

    await addCategory({
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      isDefault: false,
      color: '#334155',
    });
    setNewCategoryName('');
    setIsAddingCat(false);
  };

  // Backup Export JSON
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      categories,
      budgets,
      transactions,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `spendsense-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Full backup exported', 'success');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal-900 tracking-tight">Settings</h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Manage currency, categories, payment sources, and data persistence
        </p>
      </div>

      {/* 1. General Preferences: Currency */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100">
          <Globe className="w-4 h-4 text-forest-700" />
          <h3 className="text-sm font-semibold text-charcoal-900">Currency & Region</h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-2">
            Base Currency
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {(Object.keys(CURRENCY_MAP) as CurrencyCode[]).map((cCode) => {
              const info = CURRENCY_MAP[cCode];
              const isSelected = settings.currency === cCode;

              return (
                <button
                  key={cCode}
                  type="button"
                  onClick={() => handleCurrencyChange(cCode)}
                  className={`flex items-center justify-between p-3 rounded border text-left transition-all ${
                    isSelected
                      ? 'border-forest-700 bg-forest-50/50 text-forest-900 font-semibold'
                      : 'border-charcoal-200 bg-white text-charcoal-700 hover:border-charcoal-300'
                  }`}
                >
                  <div>
                    <span className="text-base mr-1.5">{info.symbol}</span>
                    <span>{cCode}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-forest-700" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-charcoal-500 mt-2">
            All stored amounts are formatted according to the selected base currency rules.
          </p>
        </div>
      </div>

      {/* 2. Category Management */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-forest-700" />
            <h3 className="text-sm font-semibold text-charcoal-900">Categories</h3>
          </div>
          {!isAddingCat && (
            <button
              type="button"
              onClick={() => setIsAddingCat(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add custom category</span>
            </button>
          )}
        </div>

        {isAddingCat && (
          <form
            onSubmit={handleAddCategory}
            className="flex items-center gap-2 p-3 bg-paper-50 rounded border border-charcoal-200"
          >
            <input
              type="text"
              placeholder="e.g. Subscriptions, Fitness, Pets"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
              className="px-3 py-1.5 text-xs rounded border border-charcoal-300 flex-1 bg-white focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-forest-800 rounded hover:bg-forest-900"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCat(false);
                setNewCategoryName('');
              }}
              className="px-3 py-1.5 text-xs text-charcoal-600 hover:bg-charcoal-100 rounded"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat: Category) => (
            <div
              key={cat.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-50 border border-charcoal-200 rounded text-xs text-charcoal-800"
            >
              <span>{cat.name}</span>
              {!cat.isDefault && (
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(cat)}
                  className="text-charcoal-400 hover:text-burgundy-700 transition-colors ml-1"
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Google Pay & Banking Integration Guide */}
      <GooglePayGuide onOpenImportModal={onOpenImportModal} />

      {/* 4. Storage Architecture & Cloud Sync Status */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100">
          <Database className="w-4 h-4 text-forest-700" />
          <h3 className="text-sm font-semibold text-charcoal-900">Database & Cloud Persistence</h3>
        </div>

        <div className="p-4 rounded border border-charcoal-200 bg-paper-50 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudMode && isSupabaseReady ? 'bg-forest-600' : 'bg-charcoal-400'
              }`}
            />
            <span className="font-semibold text-charcoal-900">
              {isCloudMode && isSupabaseReady
                ? 'Cloud Mode Active: Connected to Supabase'
                : 'Local Mode Active: Browser Storage Fallback'}
            </span>
          </div>

          <p className="text-charcoal-600 leading-relaxed">
            {isCloudMode && isSupabaseReady
              ? 'Your transactions are encrypted and synchronized with your personal Supabase PostgreSQL database using strict Row-Level Security (RLS).'
              : 'SpendSense is currently persisting data to your browser’s localStorage. No server credentials were detected in your environment. You can use all features offline without setup.'}
          </p>

          {!isSupabaseReady && (
            <div className="mt-3 pt-2 border-t border-charcoal-200">
              <p className="font-semibold text-charcoal-800 mb-1">
                To activate Supabase Cloud Storage:
              </p>
              <p className="text-charcoal-500 font-mono text-[11px] bg-white p-2 rounded border border-charcoal-200">
                VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                VITE_SUPABASE_ANON_KEY=your-anon-key
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Data Actions: Export, Reset, Clear */}
      <div className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100">
          <Shield className="w-4 h-4 text-forest-700" />
          <h3 className="text-sm font-semibold text-charcoal-900">Data Management</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 text-xs font-medium text-charcoal-800 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50 transition-colors"
          >
            <Download className="w-4 h-4 text-charcoal-500" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            className="flex items-center justify-center gap-2 p-3 text-xs font-medium text-charcoal-800 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-charcoal-500" />
            <span>Load Demo Dataset</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClearDialogOpen(true)}
            className="flex items-center justify-center gap-2 p-3 text-xs font-medium text-burgundy-700 bg-white border border-burgundy-200 rounded hover:bg-burgundy-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-burgundy-600" />
            <span>Clear All Records</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={resetToDemoData}
        title="Load Sample Dataset"
        message="This will replace current records with a realistic demonstration dataset covering today, this week, and this month."
        confirmLabel="Load Demo Data"
      />

      <ConfirmDialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={clearAllData}
        title="Clear All Records"
        message="Are you sure you want to delete all transactions and budgets? This action cannot be undone."
        confirmLabel="Clear Everything"
        isDestructive
      />

      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) deleteCategory(categoryToDelete.id);
        }}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"?`}
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  );
};

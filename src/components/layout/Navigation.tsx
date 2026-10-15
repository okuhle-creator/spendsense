import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';

export type TabKey = 'overview' | 'transactions' | 'budgets' | 'reports' | 'settings';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'transactions', label: 'Transactions', icon: Receipt },
    { key: 'budgets', label: 'Budgets', icon: PiggyBank },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="border-b border-charcoal-200 bg-white" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex space-x-1 sm:space-x-8 -mb-px overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-forest-800 text-forest-800 font-semibold'
                    : 'border-transparent text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-forest-800' : 'text-charcoal-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

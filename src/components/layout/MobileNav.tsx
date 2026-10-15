import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';
import { TabKey } from './Navigation';

interface MobileNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'transactions', label: 'Transactions', icon: Receipt },
    { key: 'budgets', label: 'Budgets', icon: PiggyBank },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-charcoal-200 pb-safe">
      <div className="grid grid-cols-5 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-forest-800' : 'text-charcoal-400 hover:text-charcoal-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

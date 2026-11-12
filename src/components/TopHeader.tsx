import React from 'react';
import { 
  Menu, 
  Search, 
  UserPlus, 
  Plus, 
  Coins, 
  Globe, 
  Sun, 
  Moon,
  LayoutDashboard,
  Users,
  MessageSquare,
  AlertTriangle,
  Activity,
  Cloud,
  LogIn
} from 'lucide-react';
import { Language, Currency, NavigationTab } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';

interface TopHeaderProps {
  activeTab: NavigationTab;
  onOpenMobileSidebar: () => void;
  onOpenAddPlayer: () => void;
  onOpenAddProspect: () => void;
  onOpenAddTrackedPlayer: () => void;
  playerCount: number;
  prospectCount: number;
  criticalAlertsCount: number;
  trackedCount: number;
  currency: Currency;
  onChangeCurrency: (currency: Currency) => void;
  language: Language;
  onToggleLanguage: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  currentUser?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  isCloudSyncing?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onOpenAddPlayer,
  onOpenAddProspect,
  onOpenAddTrackedPlayer,
  playerCount,
  prospectCount,
  criticalAlertsCount,
  trackedCount,
  currency,
  onChangeCurrency,
  language,
  onToggleLanguage,
  isDarkMode,
  setIsDarkMode,
  currentUser,
  onLogin,
  onLogout,
  isCloudSyncing = false
}) => {
  const t = TRANSLATIONS[language];

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t.dashboard;
      case 'roster':
        return t.agencyRoster;
      case 'in-talk':
        return t.inTalkWith;
      case 'alerts':
        return t.contractAlerts;
      case 'tracker':
        return t.playerTracker;
      default:
        return 'Overview';
    }
  };

  const getSectionIcon = () => {
    switch (activeTab) {
      case 'dashboard':
        return LayoutDashboard;
      case 'roster':
        return Users;
      case 'in-talk':
        return MessageSquare;
      case 'alerts':
        return AlertTriangle;
      case 'tracker':
        return Activity;
      default:
        return LayoutDashboard;
    }
  };

  const Icon = getSectionIcon();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile Sidebar Hamburger & Current Section Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileSidebar}
              aria-label="Open sidebar menu"
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden sm:flex">
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {getSectionTitle()}
              </h2>
            </div>
          </div>

          {/* Right: Quick Action context button & quick currency/lang indicators */}
          <div className="flex items-center gap-2">
            
            {/* Quick Context Add Button */}
            {activeTab === 'tracker' ? (
              <button
                onClick={onOpenAddTrackedPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.trackPlayerBtn}</span>
              </button>
            ) : activeTab === 'in-talk' ? (
              <button
                onClick={onOpenAddProspect}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addTalkProspect}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAddPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.addPlayer}</span>
              </button>
            )}

            {/* Cloud Sync Status Badge */}
            {currentUser ? (
              <div 
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 font-semibold"
                title={`Cloud Synced as ${currentUser.email}`}
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[120px]">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            ) : onLogin ? (
              <button
                onClick={onLogin}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                title="Connect your Google Account to sync data across all devices"
              >
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.signInGoogle}</span>
              </button>
            ) : null}

            {/* Quick currency display badge */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold font-mono-tabular text-slate-700 dark:text-slate-300">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currency === 'EUR' ? '€ EUR' : currency === 'USD' ? '$ USD' : '₪ NIS'}</span>
            </div>

            {/* Language quick switch on mobile/desktop */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'he' ? 'EN' : 'עב'}</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

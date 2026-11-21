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
  LogIn,
  Calculator,
  BellRing,
  UserCog
} from 'lucide-react';
import { Language, Currency, NavigationTab } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';

interface TopHeaderProps {
  activeTab: NavigationTab;
  onOpenMobileSidebar: () => void;
  onOpenAddPlayer: () => void;
  onOpenAddMalePlayer: () => void;
  onOpenAddProspect: () => void;
  onOpenAddTrackedPlayer: () => void;
  playerCount: number;
  malePlayerCount: number;
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
  onOpenAddMalePlayer,
  onOpenAddProspect,
  onOpenAddTrackedPlayer,
  playerCount,
  malePlayerCount,
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
      case 'male-roster':
        return t.maleRoster;
      case 'in-talk':
        return t.inTalkWith;
      case 'alerts':
        return t.alertsHub;
      case 'tracker':
        return t.playerTracker;
      case 'compensation':
        return t.trainingCompensation;
      case 'agent-settings':
        return t.agentSettings;
      default:
        return 'Overview';
    }
  };

  const getSectionIcon = () => {
    switch (activeTab) {
      case 'dashboard':
        return LayoutDashboard;
      case 'roster':
      case 'male-roster':
        return Users;
      case 'in-talk':
        return MessageSquare;
      case 'alerts':
        return BellRing;
      case 'tracker':
        return Activity;
      case 'compensation':
        return Calculator;
      case 'agent-settings':
        return UserCog;
      default:
        return LayoutDashboard;
    }
  };

  const Icon = getSectionIcon();

  const getSectionIconColor = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'compensation':
        return 'bg-gold-50 dark:bg-gold-950/60 text-gold-700 dark:text-gold-300 border-gold-200 dark:border-gold-700/60';
      case 'roster':
      case 'alerts':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      case 'male-roster':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      case 'in-talk':
        return 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-800/60';
      case 'tracker':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile Sidebar Hamburger, Mobile Brand Mark & Current Section Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileSidebar}
              aria-label="Open sidebar menu"
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="lg:hidden rounded-lg dark:bg-[#FAF8F3] dark:px-1.5 dark:py-1 shrink-0">
              <img
                src="/assets/aistudio/Brit_gold_c815fbe0.png"
                alt={t.brandName}
                referrerPolicy="no-referrer"
                className="h-7 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border hidden sm:flex ${getSectionIconColor()}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.trackPlayerBtn}</span>
              </button>
            ) : activeTab === 'in-talk' ? (
              <button
                onClick={onOpenAddProspect}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addTalkProspect}</span>
              </button>
            ) : activeTab === 'male-roster' ? (
              <button
                onClick={onOpenAddMalePlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.addMalePlayer}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAddPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gold-600 hover:bg-gold-700 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
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
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate max-w-[120px]">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
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
              <Coins className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
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

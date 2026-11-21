import React from 'react';
import { 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  LayoutDashboard, 
  UserPlus, 
  Sun, 
  Moon,
  Sparkles,
  Globe,
  Coins,
  Activity,
  Plus,
  Cloud,
  LogIn,
  LogOut,
  Download,
  Calculator,
  BellRing,
  UserCog,
  X
} from 'lucide-react';
import { Language, Currency, NavigationTab } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  playerCount: number;
  malePlayerCount: number;
  prospectCount: number;
  criticalAlertsCount: number;
  upcomingBirthdaysCount?: number;
  trackedCount: number;
  onOpenAddPlayer: () => void;
  onOpenAddMalePlayer: () => void;
  onOpenAddProspect: () => void;
  onOpenAddTrackedPlayer: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  language: Language;
  onToggleLanguage: () => void;
  currency: Currency;
  onChangeCurrency: (currency: Currency) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  isCloudSyncing?: boolean;
  onExportBackup?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  playerCount,
  malePlayerCount,
  prospectCount,
  criticalAlertsCount,
  upcomingBirthdaysCount = 0,
  trackedCount,
  onOpenAddPlayer,
  onOpenAddMalePlayer,
  onOpenAddProspect,
  onOpenAddTrackedPlayer,
  isDarkMode,
  setIsDarkMode,
  language,
  onToggleLanguage,
  currency,
  onChangeCurrency,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onLogin,
  onLogout,
  isCloudSyncing = false,
  onExportBackup
}) => {
  const t = TRANSLATIONS[language];

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const totalAlertsHubCount = criticalAlertsCount + upcomingBirthdaysCount;

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: t.dashboard,
      icon: LayoutDashboard,
      count: undefined,
      iconColor: 'text-gold-600 dark:text-gold-400'
    },
    {
      id: 'roster' as NavigationTab,
      label: t.agencyRoster,
      icon: Users,
      count: playerCount,
      iconColor: 'text-rose-500 dark:text-rose-400'
    },
    {
      id: 'male-roster' as NavigationTab,
      label: t.maleRoster,
      icon: Users,
      count: malePlayerCount,
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'in-talk' as NavigationTab,
      label: t.inTalkWith,
      icon: MessageSquare,
      count: prospectCount,
      iconColor: 'text-violet-600 dark:text-violet-400'
    },
    {
      id: 'alerts' as NavigationTab,
      label: t.alertsHub,
      icon: BellRing,
      count: totalAlertsHubCount > 0 ? totalAlertsHubCount : undefined,
      isAlert: criticalAlertsCount > 0,
      iconColor: 'text-rose-500 dark:text-rose-400'
    },
    {
      id: 'tracker' as NavigationTab,
      label: t.playerTracker,
      icon: Activity,
      count: trackedCount,
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'compensation' as NavigationTab,
      label: t.trainingCompensation,
      icon: Calculator,
      count: undefined,
      iconColor: 'text-gold-600 dark:text-gold-400'
    },
    {
      id: 'agent-settings' as NavigationTab,
      label: t.agentSettings,
      icon: UserCog,
      count: undefined,
      iconColor: 'text-slate-500 dark:text-slate-400'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-0 z-50 lg:z-30
        w-64 sm:w-72 h-screen
        bg-white dark:bg-slate-900 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-slate-800
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isOpenMobile 
          ? 'translate-x-0' 
          : 'ltr:-translate-x-full ltr:lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0'}
      `}>
        
        {/* Top Header & Official BRIT SPORT GROUP Brand Logo */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex flex-col items-start text-left rtl:text-right group min-w-0 flex-1"
            >
              <div className="rounded-xl transition-all dark:bg-[#FAF8F3] dark:px-3 dark:py-2 dark:border dark:border-gold-400/50 dark:shadow-xs">
                <img
                  src="/assets/aistudio/Brit_gold_c815fbe0.png"
                  alt={t.brandName}
                  referrerPolicy="no-referrer"
                  className="h-12 w-auto object-contain group-hover:opacity-90 transition-opacity"
                />
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-1.5 w-full">
                {t.brandSubtitle}
              </div>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg lg:hidden shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: Navigation Menu Links & Quick Action Buttons */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          
          {/* Main Navigation Tabs */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {language === 'he' ? 'ניווט ראשי' : 'Main Navigation'}
            </span>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-500/20 via-gold-400/10 to-transparent dark:from-gold-500/25 dark:via-gold-500/10 dark:to-transparent text-gold-900 dark:text-gold-200 border border-gold-400/60 dark:border-gold-400/40 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-gold-600 dark:text-gold-300' : item.iconColor
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-mono-tabular shrink-0 ${
                      item.isAlert
                        ? 'bg-rose-500 text-white font-extrabold'
                        : isActive
                        ? 'bg-gold-500/20 text-gold-900 dark:text-gold-200 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Launcher */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {language === 'he' ? 'פעולות הוספה' : 'Quick Actions'}
            </span>

            <button
              onClick={() => {
                onOpenAddPlayer();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-rose-500" />
              <span>{t.addPlayer}</span>
            </button>

            <button
              onClick={() => {
                onOpenAddMalePlayer();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>{t.addMalePlayer}</span>
            </button>

            <button
              onClick={() => {
                onOpenAddProspect();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-violet-500" />
              <span>{t.addTalkProspect}</span>
            </button>

            <button
              onClick={() => {
                onOpenAddTrackedPlayer();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.trackPlayerBtn}</span>
            </button>
          </div>

          {/* Firebase Cloud Sync & Authentication Status */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {currentUser ? (
              <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isCloudSyncing ? t.syncingStatus : t.syncedCloud}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-emerald-300 dark:border-emerald-700 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {(currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || 'Agency Agent'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title={t.signOut}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <Cloud className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.localMode}</span>
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Local</span>
                </div>
                {onLogin && (
                  <button
                    onClick={onLogin}
                    className="w-full py-1.5 px-2 text-xs font-bold rounded-lg bg-gold-600 hover:bg-gold-700 text-white shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t.signInGoogle}</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Section: Currency, Language & Theme Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
          
          {/* Currency Segmented Selector */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                <span>{t.currency}</span>
              </span>
              <span className="font-mono-tabular font-bold text-slate-700 dark:text-slate-300">
                {currency === 'EUR' ? '€ EUR' : currency === 'USD' ? '$ USD' : '₪ NIS'}
              </span>
            </div>

            <div className="grid grid-cols-3 p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => onChangeCurrency('EUR')}
                className={`py-1.5 rounded-md transition-all ${
                  currency === 'EUR'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                € EUR
              </button>
              <button
                onClick={() => onChangeCurrency('USD')}
                className={`py-1.5 rounded-md transition-all ${
                  currency === 'USD'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                $ USD
              </button>
              <button
                onClick={() => onChangeCurrency('ILS')}
                className={`py-1.5 rounded-md transition-all ${
                  currency === 'ILS'
                    ? 'bg-white dark:bg-slate-700 text-gold-700 dark:text-gold-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ₪ NIS
              </button>
            </div>
          </div>

          {/* Language Switcher & Dark Mode Toggle */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={onToggleLanguage}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.languageSwitch}</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

          {/* Export Full Agency Backup (JSON) */}
          {onExportBackup && (
            <button
              onClick={onExportBackup}
              title={t.exportBackup}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-slate-700/80"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t.exportBackup}</span>
            </button>
          )}

          <div className="text-[10px] text-slate-400 text-center font-medium">
            FIFA & UEFA Licensed Framework
          </div>

        </div>

      </aside>
    </>
  );
};

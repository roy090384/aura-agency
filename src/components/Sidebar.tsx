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
  Shield,
  Cloud,
  LogIn,
  LogOut,
  Download,
  Calculator,
  X
} from 'lucide-react';
import { Language, Currency, NavigationTab } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  playerCount: number;
  prospectCount: number;
  criticalAlertsCount: number;
  trackedCount: number;
  onOpenAddPlayer: () => void;
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
  prospectCount,
  criticalAlertsCount,
  trackedCount,
  onOpenAddPlayer,
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

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: t.dashboard,
      icon: LayoutDashboard,
      count: undefined,
      color: 'emerald'
    },
    {
      id: 'roster' as NavigationTab,
      label: t.agencyRoster,
      icon: Users,
      count: playerCount,
      color: 'emerald'
    },
    {
      id: 'in-talk' as NavigationTab,
      label: t.inTalkWith,
      icon: MessageSquare,
      count: prospectCount,
      color: 'emerald'
    },
    {
      id: 'alerts' as NavigationTab,
      label: t.contractAlerts,
      icon: AlertTriangle,
      count: criticalAlertsCount > 0 ? criticalAlertsCount : undefined,
      isAlert: criticalAlertsCount > 0,
      color: 'amber'
    },
    {
      id: 'tracker' as NavigationTab,
      label: t.playerTracker,
      icon: Activity,
      count: trackedCount,
      color: 'emerald'
    },
    {
      id: 'compensation' as NavigationTab,
      label: t.trainingCompensation,
      icon: Calculator,
      count: undefined,
      color: 'emerald'
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
        
        {/* Top Header & Brand Wordmark */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-3 text-left rtl:text-right group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform shrink-0">
                <Shield className="w-5 h-5 fill-current opacity-90" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-wider text-slate-900 dark:text-white uppercase font-sans">
                    {t.brandName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {t.brandSubtitle}
                </div>
              </div>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg lg:hidden"
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
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-xs border border-emerald-200/80 dark:border-emerald-800/80'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : item.isAlert 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-slate-400'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono-tabular shrink-0 ${
                      item.isAlert
                        ? 'bg-amber-500 text-white font-extrabold animate-pulse'
                        : isActive
                        ? 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold'
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
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {language === 'he' ? 'פעולות הוספה' : 'Quick Actions'}
            </span>

            <button
              onClick={() => {
                onOpenAddPlayer();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.addPlayer}</span>
            </button>

            <button
              onClick={() => {
                onOpenAddProspect();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>{t.addTalkProspect}</span>
            </button>

            <button
              onClick={() => {
                onOpenAddTrackedPlayer();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>{t.trackPlayerBtn}</span>
            </button>
          </div>

          {/* Firebase Cloud Sync & Authentication Status */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {currentUser ? (
              <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isCloudSyncing ? t.syncingStatus : t.syncedCloud}</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
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
                    className="w-full py-1.5 px-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors flex items-center justify-center gap-1.5"
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
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
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
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold'
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

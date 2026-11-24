import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  UserPlus,
  Plus,
  Coins,
  Globe,
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  MessageSquare,
  Activity,
  Cloud,
  Calculator,
  BellRing,
  UserCog,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react';
import { Language, Currency, NavigationTab, WorkspacePermissions } from '../types/player';
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
  permissions?: WorkspacePermissions;
}

const FULL_PERMISSIONS: WorkspacePermissions = {
  canViewPlayers: true,
  canCreatePlayers: true,
  canEditPlayers: true,
  canDeletePlayers: true,
  canAccessScouting: true,
  canEditTracker: true,
  isOwner: true
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onOpenAddPlayer,
  onOpenAddMalePlayer,
  onOpenAddProspect,
  onOpenAddTrackedPlayer,
  currency,
  onChangeCurrency,
  language,
  onToggleLanguage,
  isDarkMode,
  setIsDarkMode,
  currentUser,
  onLogin,
  isCloudSyncing = false,
  permissions
}) => {
  const t = TRANSLATIONS[language];
  const isHe = language === 'he';
  const perms = permissions || FULL_PERMISSIONS;

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const newMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setShowNewMenu(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNewMenu(false);
        setShowCurrencyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const createOptions = [
    {
      key: 'female' as const,
      label: t.addPlayer,
      icon: UserPlus,
      accentClass: 'text-gold-600 dark:text-gold-400',
      visible: perms.canCreatePlayers,
      onClick: onOpenAddPlayer
    },
    {
      key: 'male' as const,
      label: t.addMalePlayer,
      icon: UserPlus,
      accentClass: 'text-blue-600 dark:text-blue-400',
      visible: perms.canCreatePlayers,
      onClick: onOpenAddMalePlayer
    },
    {
      key: 'prospect' as const,
      label: t.addTalkProspect,
      icon: MessageSquare,
      accentClass: 'text-violet-600 dark:text-violet-400',
      visible: perms.canAccessScouting,
      onClick: onOpenAddProspect
    },
    {
      key: 'tracker' as const,
      label: t.trackPlayerBtn,
      icon: Activity,
      accentClass: 'text-emerald-600 dark:text-emerald-400',
      visible: perms.canEditTracker,
      onClick: onOpenAddTrackedPlayer
    }
  ].filter(option => option.visible);

  const preferredCreateKey =
    activeTab === 'tracker'
      ? 'tracker'
      : activeTab === 'in-talk'
      ? 'prospect'
      : activeTab === 'male-roster'
      ? 'male'
      : 'female';

  const primaryCreateOption =
    createOptions.find(opt => opt.key === preferredCreateKey) || createOptions[0] || null;

  const currencyLabels: Record<Currency, string> = {
    EUR: '€ EUR',
    USD: '$ USD',
    ILS: '₪ NIS'
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Left: Mobile Sidebar Hamburger, Mobile Brand Mark & CRM Breadcrumb */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              aria-label="Open sidebar menu"
              className="p-2 -ml-2 rtl:-ml-0 rtl:-mr-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden shrink-0"
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

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0">
              <span className="hidden md:inline text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-tight whitespace-nowrap">
                BRIT CRM
              </span>
              <ChevronRight className="hidden md:inline w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 rtl:rotate-180" />
              <div className="flex items-center gap-2 min-w-0">
                <span className="hidden sm:flex p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-gold-600 dark:text-gold-400 shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {getSectionTitle()}
                </h2>
              </div>
            </nav>
          </div>

          {/* Right: Unified + New Split Action + Interactive Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Unified + New Quick-Create Split Dropdown */}
            {primaryCreateOption && (
              <div className="relative" ref={newMenuRef}>
                <div className="inline-flex items-stretch rounded-lg shadow-2xs overflow-hidden bg-slate-900 dark:bg-gold-600 text-white">
                  <button
                    type="button"
                    onClick={primaryCreateOption.onClick}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold hover:bg-slate-800 dark:hover:bg-gold-500 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{primaryCreateOption.label}</span>
                    <span className="sm:hidden">{isHe ? 'חדש' : 'New'}</span>
                  </button>
                  {createOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowNewMenu(prev => !prev)}
                      aria-haspopup="menu"
                      aria-expanded={showNewMenu}
                      aria-label={isHe ? 'אפשרויות יצירה נוספות' : 'More create actions'}
                      className="px-1.5 border-l rtl:border-l-0 rtl:border-r border-white/15 hover:bg-slate-800 dark:hover:bg-gold-500 transition-colors flex items-center justify-center"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showNewMenu ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {showNewMenu && createOptions.length > 1 && (
                  <div
                    role="menu"
                    className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50"
                  >
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {isHe ? 'הוספה מהירה' : 'Quick Create'}
                    </div>
                    {createOptions.map(option => {
                      const OptionIcon = option.icon;
                      const isPrimary = option.key === primaryCreateOption.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setShowNewMenu(false);
                            option.onClick();
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold transition-colors text-left rtl:text-right ${
                            isPrimary
                              ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <OptionIcon className={`w-3.5 h-3.5 shrink-0 ${option.accentClass}`} />
                            <span className="truncate">{option.label}</span>
                          </span>
                          {isPrimary && (
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                              {isHe ? 'נוכחי' : 'Current'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Cloud Sync Status / Google Sign-In */}
            {currentUser ? (
              <div
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-200 font-semibold"
                title={`Cloud Synced as ${currentUser.email}`}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  {isCloudSyncing && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="truncate max-w-[110px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </div>
            ) : onLogin ? (
              <button
                type="button"
                onClick={onLogin}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Connect your Google Account to sync data across all devices"
              >
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.signInGoogle}</span>
              </button>
            ) : null}

            {/* Interactive Currency Selector */}
            <div className="relative hidden sm:block" ref={currencyMenuRef}>
              <button
                type="button"
                onClick={() => setShowCurrencyMenu(prev => !prev)}
                aria-haspopup="menu"
                aria-expanded={showCurrencyMenu}
                title={isHe ? 'שנה מטבע' : 'Switch currency'}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold font-mono-tabular text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                <span>{currencyLabels[currency]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCurrencyMenu && (
                <div
                  role="menu"
                  className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg py-1 z-50"
                >
                  {(['EUR', 'USD', 'ILS'] as Currency[]).map(curr => (
                    <button
                      key={curr}
                      type="button"
                      role="menuitemradio"
                      aria-checked={currency === curr}
                      onClick={() => {
                        onChangeCurrency(curr);
                        setShowCurrencyMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono-tabular transition-colors ${
                        currency === curr
                          ? 'bg-gold-50 dark:bg-gold-950/50 text-gold-900 dark:text-gold-200 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{currencyLabels[curr]}</span>
                      {currency === curr && <Check className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language quick switch */}
            <button
              type="button"
              onClick={onToggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={t.languageSwitch}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{language === 'he' ? 'EN' : 'עב'}</span>
            </button>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

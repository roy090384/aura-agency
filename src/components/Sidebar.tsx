import React from 'react';
import { 
  Users, 
  MessageSquare, 
  LayoutDashboard, 
  Sun, 
  Moon,
  Globe,
  Coins,
  Activity,
  Cloud,
  LogIn,
  LogOut,
  Download,
  Calculator,
  BellRing,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import { Language, Currency, NavigationTab, WorkspacePermissions } from '../types/player';
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
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  language: Language;
  onToggleLanguage: () => void;
  currency: Currency;
  onChangeCurrency: (currency: Currency) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentUser?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  isCloudSyncing?: boolean;
  onExportBackup?: () => void;
  permissions?: WorkspacePermissions;
  accessRoleLabel?: string;
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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  playerCount,
  malePlayerCount,
  prospectCount,
  criticalAlertsCount,
  upcomingBirthdaysCount = 0,
  trackedCount,
  isDarkMode,
  setIsDarkMode,
  language,
  onToggleLanguage,
  currency,
  onChangeCurrency,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  currentUser,
  onLogin,
  onLogout,
  isCloudSyncing = false,
  onExportBackup,
  permissions,
  accessRoleLabel
}) => {
  const t = TRANSLATIONS[language];
  const isHe = language === 'he';
  const perms = permissions || FULL_PERMISSIONS;

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const totalAlertsHubCount = criticalAlertsCount + upcomingBirthdaysCount;

  const coreNavItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: t.dashboard,
      icon: LayoutDashboard,
      count: undefined,
      isAlert: false,
      visible: true
    },
    {
      id: 'roster' as NavigationTab,
      label: t.agencyRoster,
      icon: Users,
      count: playerCount,
      isAlert: false,
      visible: perms.canViewPlayers
    },
    {
      id: 'male-roster' as NavigationTab,
      label: t.maleRoster,
      icon: Users,
      count: malePlayerCount,
      isAlert: false,
      visible: perms.canViewPlayers
    },
    {
      id: 'in-talk' as NavigationTab,
      label: t.inTalkWith,
      icon: MessageSquare,
      count: prospectCount,
      isAlert: false,
      visible: perms.canAccessScouting
    },
    {
      id: 'alerts' as NavigationTab,
      label: t.alertsHub,
      icon: BellRing,
      count: totalAlertsHubCount > 0 ? totalAlertsHubCount : undefined,
      isAlert: criticalAlertsCount > 0,
      visible: perms.canViewPlayers
    },
    {
      id: 'tracker' as NavigationTab,
      label: t.playerTracker,
      icon: Activity,
      count: trackedCount,
      isAlert: false,
      visible: perms.canViewPlayers || perms.canEditTracker
    }
  ].filter(item => item.visible);

  const toolsNavItems = [
    {
      id: 'compensation' as NavigationTab,
      label: t.trainingCompensation,
      icon: Calculator,
      count: undefined,
      isAlert: false,
      visible: perms.canViewPlayers
    },
    {
      id: 'agent-settings' as NavigationTab,
      label: t.agentSettings,
      icon: UserCog,
      count: undefined,
      isAlert: false,
      visible: perms.isOwner
    }
  ].filter(item => item.visible);

  const renderNavButton = (item: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number | undefined;
    isAlert: boolean;
  }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        type="button"
        title={isCollapsed ? item.label : undefined}
        onClick={() => handleNavClick(item.id)}
        className={`group relative w-full flex items-center ${
          isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between px-3'
        } py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all ${
          isActive
            ? 'bg-gold-500/12 dark:bg-gold-500/18 text-gold-900 dark:text-gold-200 border border-gold-400/50 dark:border-gold-400/35'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white border border-transparent'
        }`}
      >
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'lg:gap-0' : ''}`}>
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive
                ? 'text-gold-600 dark:text-gold-300'
                : item.isAlert
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
            }`}
          />
          <span className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
        </div>

        {item.count !== undefined && (
          <>
            <span
              className={`${
                isCollapsed ? 'lg:hidden' : ''
              } text-[11px] px-1.5 py-0.5 rounded-md font-mono-tabular shrink-0 ${
                item.isAlert
                  ? 'bg-rose-500 text-white font-extrabold'
                  : isActive
                  ? 'bg-gold-500/20 text-gold-900 dark:text-gold-200 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.count}
            </span>

            {isCollapsed && (
              <span
                className={`hidden lg:flex absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full text-[10px] font-mono-tabular font-bold border border-white dark:border-slate-900 ${
                  item.isAlert
                    ? 'bg-rose-500 text-white'
                    : isActive
                    ? 'bg-gold-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {item.count}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

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
      <aside
        className={`
          fixed lg:sticky top-0 z-50 lg:z-30 h-screen shrink-0
          ${isCollapsed ? 'w-64 lg:w-[76px]' : 'w-64'}
          bg-white dark:bg-slate-900 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-slate-800
          flex flex-col justify-between
          transition-all duration-200 ease-in-out
          ${isOpenMobile
            ? 'translate-x-0'
            : 'ltr:-translate-x-full ltr:lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0'}
        `}
      >
        {/* Top Header & Official BRIT SPORT GROUP Brand Logo */}
        <div className={`border-b border-slate-100 dark:border-slate-800/80 ${isCollapsed ? 'px-3 lg:px-2.5 py-3.5' : 'px-4 py-3.5'}`}>
          <div className={`flex items-center justify-between gap-2 ${isCollapsed ? 'lg:flex-col lg:gap-2.5' : ''}`}>
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className={`flex items-center gap-2.5 text-left rtl:text-right group min-w-0 ${isCollapsed ? 'lg:justify-center' : 'flex-1'}`}
              title={t.brandName}
            >
              {isCollapsed ? (
                <>
                  <div className="lg:hidden rounded-xl dark:bg-[#FAF8F3] dark:px-2.5 dark:py-1.5 dark:border dark:border-gold-400/50">
                    <img
                      src="/assets/aistudio/Brit_gold_c815fbe0.png"
                      alt={t.brandName}
                      referrerPolicy="no-referrer"
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                  <div className="hidden lg:flex w-10 h-10 rounded-xl bg-slate-900 dark:bg-[#FAF8F3] border border-gold-400/60 items-center justify-center font-extrabold text-sm text-gold-400 dark:text-slate-900 shadow-2xs">
                    BG
                  </div>
                </>
              ) : (
                <div className="min-w-0">
                  <div className="rounded-xl transition-all dark:bg-[#FAF8F3] dark:px-2.5 dark:py-1.5 dark:border dark:border-gold-400/50 dark:shadow-xs inline-block">
                    <img
                      src="/assets/aistudio/Brit_gold_c815fbe0.png"
                      alt={t.brandName}
                      referrerPolicy="no-referrer"
                      className="h-10 w-auto object-contain group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-1">
                    {t.brandSubtitle}
                  </div>
                </div>
              )}
            </button>

            {/* Desktop Collapse / Expand Toggle */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? (isHe ? 'הרחב תפריט' : 'Expand sidebar') : isHe ? 'כווץ תפריט' : 'Collapse sidebar'}
                className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 rtl:rotate-180" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 rtl:rotate-180" />
                )}
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg lg:hidden shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: Grouped CRM Navigation */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin py-4 space-y-5 ${isCollapsed ? 'px-3 lg:px-2' : 'px-3'}`}>
          {/* Core CRM Group */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5">
                {isHe ? 'ניהול סוכנות' : 'Workspace'}
              </span>
            )}
            {coreNavItems.map(renderNavButton)}
          </div>

          {/* Tools & Admin Group */}
          {toolsNavItems.length > 0 && (
            <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              {!isCollapsed && (
                <span className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5">
                  {isHe ? 'כלים והגדרות' : 'Tools & Admin'}
                </span>
              )}
              {toolsNavItems.map(renderNavButton)}
            </div>
          )}
        </div>

        {/* Bottom Section: Account + Compact Utilities */}
        <div className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5 ${isCollapsed ? 'p-3 lg:p-2' : 'p-3.5'}`}>
          {/* User / Cloud Sync Card */}
          {currentUser ? (
            <div
              className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 ${
                isCollapsed ? 'p-2 lg:flex lg:justify-center' : 'p-2.5'
              }`}
              title={isCollapsed ? `${currentUser.displayName || currentUser.email} (${accessRoleLabel || 'Synced'})` : undefined}
            >
              <div className={`flex items-center gap-2.5 ${isCollapsed ? 'lg:justify-center' : ''}`}>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {(currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
                  </div>
                )}

                <div className={`min-w-0 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || 'Agency Agent'}
                    </span>
                    {isCloudSyncing && (
                      <Cloud className="w-3 h-3 text-emerald-600 animate-pulse shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {accessRoleLabel ? `${accessRoleLabel} · ${currentUser.email || ''}` : currentUser.email}
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className={`p-1 text-slate-400 hover:text-rose-600 rounded transition-colors ${isCollapsed ? 'lg:hidden' : ''}`}
                    title={t.signOut}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            onLogin && (
              <button
                type="button"
                onClick={onLogin}
                title={t.signInGoogle}
                className={`w-full py-2 px-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-gold-600 dark:hover:bg-gold-500 text-white shadow-2xs transition-colors flex items-center justify-center gap-1.5`}
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className={isCollapsed ? 'lg:hidden' : ''}>{t.signInGoogle}</span>
              </button>
            )
          )}

          {/* Currency Selector (hidden in icon-rail mode — also accessible in TopHeader) */}
          <div className={isCollapsed ? 'lg:hidden' : ''}>
            <div className="grid grid-cols-3 p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-[11px] font-semibold">
              {(['EUR', 'USD', 'ILS'] as Currency[]).map(curr => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => onChangeCurrency(curr)}
                  className={`py-1 rounded-md transition-all ${
                    currency === curr
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {curr === 'EUR' ? '€ EUR' : curr === 'USD' ? '$ USD' : '₪ NIS'}
                </button>
              ))}
            </div>
          </div>

          {/* Language, Theme & Backup Controls */}
          <div className={`flex items-center gap-1.5 ${isCollapsed ? 'lg:flex-col' : ''}`}>
            <button
              type="button"
              onClick={onToggleLanguage}
              title={t.languageSwitch}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                isCollapsed ? 'lg:w-full' : 'flex-1'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className={isCollapsed ? 'lg:hidden' : ''}>{t.languageSwitch}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
              className={`p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                isCollapsed ? 'lg:w-full lg:flex lg:justify-center' : ''
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {onExportBackup && (
              <button
                type="button"
                onClick={onExportBackup}
                title={t.exportBackup}
                className={`p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                  isCollapsed ? 'lg:w-full lg:flex lg:justify-center' : ''
                }`}
              >
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </button>
            )}
          </div>

          {!isCollapsed && (
            <div className="text-[10px] text-slate-400 text-center font-medium pt-0.5">
              BRIT SPORT GROUP · FIFA & UEFA Framework
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

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
  Activity
} from 'lucide-react';
import { Language, Currency, NavigationTab } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  playerCount: number;
  prospectCount: number;
  criticalAlertsCount: number;
  trackedCount?: number;
  onOpenAddPlayer: () => void;
  onOpenAddProspect: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  language: Language;
  onToggleLanguage: () => void;
  currency: Currency;
  onChangeCurrency: (currency: Currency) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  playerCount,
  prospectCount,
  criticalAlertsCount,
  trackedCount = 0,
  onOpenAddPlayer,
  onOpenAddProspect,
  isDarkMode,
  setIsDarkMode,
  language,
  onToggleLanguage,
  currency,
  onChangeCurrency
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Wordmark (Strict single-line display) */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-500/20 group-hover:bg-emerald-500 transition-colors">
                A
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white block leading-none">
                  {t.brandName}
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 block leading-tight">
                  {t.brandSubtitle}
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links - Single-line text with clean active indicator */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t.dashboard}</span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'roster'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.agencyRoster}</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono-tabular">
                {playerCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('in-talk')}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'in-talk'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t.inTalkWith}</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono-tabular font-medium">
                {prospectCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 relative ${
                activeTab === 'alerts'
                  ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${criticalAlertsCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`} />
              <span>{t.contractAlerts}</span>
              {criticalAlertsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-500 text-white font-mono-tabular">
                  {criticalAlertsCount}
                </span>
              )}
            </button>

            {/* Player Tracker Navigation Tab */}
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'tracker'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t.playerTracker}</span>
              {trackedCount > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono-tabular">
                  {trackedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Action Area: Currency, Language & Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Currency Switcher: NIS (₪), Dollar ($), Euros (€) */}
            <div 
              className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              title={`${t.currency}: NIS, Dollar, Euros`}
            >
              <button
                type="button"
                onClick={() => onChangeCurrency('EUR')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                  currency === 'EUR'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-mono-tabular'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-mono-tabular'
                }`}
                title="Euros (€)"
              >
                € EUR
              </button>
              <button
                type="button"
                onClick={() => onChangeCurrency('USD')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                  currency === 'USD'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-mono-tabular'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-mono-tabular'
                }`}
                title="US Dollars ($)"
              >
                $ USD
              </button>
              <button
                type="button"
                onClick={() => onChangeCurrency('ILS')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                  currency === 'ILS'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-mono-tabular'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-mono-tabular'
                }`}
                title="Israeli Shekel (₪ NIS)"
              >
                ₪ NIS
              </button>
            </div>

            {/* Language Switcher Button (English ⇄ Hebrew) */}
            <button
              onClick={onToggleLanguage}
              aria-label="Toggle language between English and Hebrew"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
              title="Switch Language / החלף שפה"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'עברית' : 'English'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle color theme"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {activeTab === 'in-talk' ? (
              <button
                onClick={onOpenAddProspect}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.addTalkProspect}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAddPlayer}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.addPlayer}</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

import React, { useMemo } from 'react';
import { Player, AgentProfile, Language } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';
import { getContractDaysRemaining } from '../utils/contractAlerts';
import { getUpcomingBirthdays } from '../utils/birthdayAlerts';
import { ContractAlertsView } from './ContractAlertsView';
import { BirthdaysView } from './BirthdaysView';
import { AlertTriangle, Cake, BellRing } from 'lucide-react';

interface AlertsHubViewProps {
  femalePlayers: Player[];
  malePlayers: Player[];
  agents: AgentProfile[];
  subTab: 'contracts' | 'birthdays';
  onSubTabChange: (tab: 'contracts' | 'birthdays') => void;
  onSelectPlayer: (player: Player, rosterType: 'female' | 'male') => void;
  onQuickExtend: (player: Player, rosterType: 'female' | 'male') => void;
  onEditPlayer: (player: Player, rosterType: 'female' | 'male') => void;
  language: Language;
}

export const AlertsHubView: React.FC<AlertsHubViewProps> = ({
  femalePlayers,
  malePlayers,
  agents,
  subTab,
  onSubTabChange,
  onSelectPlayer,
  onQuickExtend,
  onEditPlayer,
  language
}) => {
  const t = TRANSLATIONS[language];
  const isHe = language === 'he';

  const urgentContractsCount = useMemo(() => {
    const fCount = femalePlayers.filter(p => getContractDaysRemaining(p.contractExpiryDate) <= 30).length;
    const mCount = malePlayers.filter(p => getContractDaysRemaining(p.contractExpiryDate) <= 30).length;
    return fCount + mCount;
  }, [femalePlayers, malePlayers]);

  const upcomingBirthdaysCount = useMemo(() => {
    return (
      getUpcomingBirthdays(femalePlayers, 30).length +
      getUpcomingBirthdays(malePlayers, 30).length
    );
  }, [femalePlayers, malePlayers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Unified Alerts Hub Header & Sub-Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.alertsHub}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t.alertsHubDesc}
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs: Contract Alerts | Birthdays */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={() => onSubTabChange('contracts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              subTab === 'contracts'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t.contractAlerts}</span>
            <span
              className={`text-[11px] font-mono-tabular px-2 py-0.5 rounded-full ${
                urgentContractsCount > 0
                  ? 'bg-amber-500 text-white font-extrabold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {urgentContractsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSubTabChange('birthdays')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              subTab === 'birthdays'
                ? 'bg-white dark:bg-slate-900 text-pink-700 dark:text-pink-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cake className="w-4 h-4 shrink-0" />
            <span>{t.birthdays}</span>
            <span
              className={`text-[11px] font-mono-tabular px-2 py-0.5 rounded-full ${
                subTab === 'birthdays'
                  ? 'bg-pink-600 text-white font-extrabold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {upcomingBirthdaysCount}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-View Content */}
      {subTab === 'contracts' ? (
        <ContractAlertsView
          femalePlayers={femalePlayers}
          malePlayers={malePlayers}
          onSelectPlayer={onSelectPlayer}
          onQuickExtend={onQuickExtend}
          onEditPlayer={onEditPlayer}
          language={language}
        />
      ) : (
        <BirthdaysView
          femalePlayers={femalePlayers}
          malePlayers={malePlayers}
          agents={agents}
          onSelectPlayer={onSelectPlayer}
          language={language}
        />
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  Player,
  TalkProspect,
  ForeignProspect,
  AgentProfile,
  TrackedPlayer,
  Language,
  Currency,
  NavigationTab
} from '../types/player';
import { DEFAULT_AGENTS, findAgentProfile } from '../data/defaultAgents';
import {
  FOREIGN_STATUS_STALE_DAYS,
  getDaysSinceForeignStatusChange,
  isForeignProspectStatusStale
} from '../utils/foreignProspectUtils';
import {
  getContractDaysRemaining,
  formatDatePretty
} from '../utils/contractAlerts';
import { TRANSLATIONS } from '../translations/translations';
import {
  AlertTriangle,
  Users,
  MessageSquare,
  Clock,
  ArrowRight,
  Play,
  Globe,
  CheckCircle2,
  Cake,
  UserCheck,
  UserPlus,
  Activity,
  Calculator
} from 'lucide-react';
import { getUpcomingBirthdays } from '../utils/birthdayAlerts';
import { findCountry } from '../data/countries';
import { loadIfaClubs } from '../data/ifaClubs';
import {
  estimatePlayerTrainingCompensation,
  formatIls,
  getDefaultNextTransferWindowDate,
  getSavedFemaleCpiPct
} from '../utils/trainingCompensation';
import { formatCurrencyAmount } from '../utils/currency';

type DivisionScope = 'all' | 'female' | 'male';

interface ScopedPlayer {
  player: Player;
  rosterType: 'female' | 'male';
}

interface DashboardViewProps {
  players: Player[];
  malePlayers: Player[];
  prospects: TalkProspect[];
  foreignProspects: ForeignProspect[];
  trackedPlayers?: TrackedPlayer[];
  agents?: AgentProfile[];
  onNavigateTab: (tab: NavigationTab) => void;
  onNavigateAlertsHub?: (subTab: 'contracts' | 'birthdays') => void;
  onNavigateForeignProspects: () => void;
  onSelectPlayer: (player: Player, rosterType: 'female' | 'male') => void;
  onSelectProspect: (prospect: TalkProspect) => void;
  onSelectForeignProspect: (prospect: ForeignProspect) => void;
  onOpenQuickExtend: (player: Player, rosterType: 'female' | 'male') => void;
  onOpenAddPlayer: (rosterType: 'female' | 'male') => void;
  language: Language;
  currency?: Currency;
  nextTransferWindowDate?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  players,
  malePlayers,
  prospects,
  foreignProspects,
  trackedPlayers = [],
  agents = DEFAULT_AGENTS,
  onNavigateTab,
  onNavigateAlertsHub,
  onNavigateForeignProspects,
  onSelectPlayer,
  onSelectProspect,
  onSelectForeignProspect,
  onOpenQuickExtend,
  onOpenAddPlayer,
  language,
  currency = 'EUR',
  nextTransferWindowDate = getDefaultNextTransferWindowDate()
}) => {
  const t = TRANSLATIONS[language];
  const isHe = language === 'he';

  const [scope, setScope] = useState<DivisionScope>('all');

  const clubs = useMemo(() => loadIfaClubs(), []);
  const femaleCpiPct = useMemo(() => getSavedFemaleCpiPct(), []);

  // Combined roster tagged with division
  const allScopedPlayers = useMemo<ScopedPlayer[]>(() => {
    return [
      ...players.map(player => ({ player, rosterType: 'female' as const })),
      ...malePlayers.map(player => ({ player, rosterType: 'male' as const }))
    ];
  }, [players, malePlayers]);

  const visiblePlayers = useMemo<ScopedPlayer[]>(() => {
    if (scope === 'female') {
      return players.map(player => ({ player, rosterType: 'female' as const }));
    }
    if (scope === 'male') {
      return malePlayers.map(player => ({ player, rosterType: 'male' as const }));
    }
    return allScopedPlayers;
  }, [scope, players, malePlayers, allScopedPlayers]);

  // Division & Active Counts
  const activeCount = visiblePlayers.filter(x => x.player.status === 'Active').length;
  const femaleActiveCount = players.filter(p => p.status === 'Active').length;
  const maleActiveCount = malePlayers.filter(p => p.status === 'Active').length;
  const youthCount = visiblePlayers.filter(
    x => x.player.youthCategory && x.player.youthCategory !== 'Senior'
  ).length;
  const seniorCount = visiblePlayers.length - youthCount;
  const uniqueClubsCount = useMemo(
    () => new Set(visiblePlayers.map(x => x.player.clubName).filter(Boolean)).size,
    [visiblePlayers]
  );

  // Critical Contracts (<= 30 days) & Approaching (31-90 days)
  const criticalExpiring = useMemo(() => {
    return visiblePlayers
      .filter(x => getContractDaysRemaining(x.player.contractExpiryDate) <= 30)
      .sort(
        (a, b) =>
          getContractDaysRemaining(a.player.contractExpiryDate) -
          getContractDaysRemaining(b.player.contractExpiryDate)
      );
  }, [visiblePlayers]);

  const upcoming90Days = useMemo(() => {
    return visiblePlayers
      .filter(x => {
        const days = getContractDaysRemaining(x.player.contractExpiryDate);
        return days > 30 && days <= 90;
      })
      .sort(
        (a, b) =>
          getContractDaysRemaining(a.player.contractExpiryDate) -
          getContractDaysRemaining(b.player.contractExpiryDate)
      );
  }, [visiblePlayers]);

  const femaleCriticalCount = players.filter(
    p => getContractDaysRemaining(p.contractExpiryDate) <= 30
  ).length;
  const maleCriticalCount = malePlayers.filter(
    p => getContractDaysRemaining(p.contractExpiryDate) <= 30
  ).length;

  // Upcoming Birthdays (Next 30 days) across filtered scope
  const scopedBirthdays = useMemo(() => {
    const fBirthdays =
      scope === 'male'
        ? []
        : getUpcomingBirthdays(players, 30).map(b => ({ ...b, rosterType: 'female' as const }));
    const mBirthdays =
      scope === 'female'
        ? []
        : getUpcomingBirthdays(malePlayers, 30).map(b => ({ ...b, rosterType: 'male' as const }));

    return [...fBirthdays, ...mBirthdays].sort((a, b) => a.daysUntil - b.daysUntil);
  }, [scope, players, malePlayers]);

  const femaleBdayCount = useMemo(() => getUpcomingBirthdays(players, 30).length, [players]);
  const maleBdayCount = useMemo(() => getUpcomingBirthdays(malePlayers, 30).length, [malePlayers]);
  const todayBdayCount = scopedBirthdays.filter(b => b.isToday).length;

  // Combined Estimated Training Compensation Pool (reusing existing engine)
  const compensationSummary = useMemo(() => {
    let femaleTotalIls = 0;
    let maleTotalIls = 0;
    let calculatedCount = 0;

    if (scope !== 'male') {
      for (const p of players) {
        const est = estimatePlayerTrainingCompensation(
          p,
          'female',
          nextTransferWindowDate,
          clubs,
          femaleCpiPct
        );
        if (est.status === 'calculated') {
          femaleTotalIls += est.amountIls;
          calculatedCount += 1;
        }
      }
    }

    if (scope !== 'female') {
      for (const p of malePlayers) {
        const est = estimatePlayerTrainingCompensation(
          p,
          'male',
          nextTransferWindowDate,
          clubs,
          femaleCpiPct
        );
        if (est.status === 'calculated') {
          maleTotalIls += est.amountIls;
          calculatedCount += 1;
        }
      }
    }

    return {
      totalIls: femaleTotalIls + maleTotalIls,
      femaleTotalIls,
      maleTotalIls,
      calculatedCount
    };
  }, [scope, players, malePlayers, nextTransferWindowDate, clubs, femaleCpiPct]);

  // Squad Positions Balance across visible scope
  const posCount = useMemo(
    () => ({
      GK: visiblePlayers.filter(x => x.player.position.includes('Goalkeeper')).length,
      DEF: visiblePlayers.filter(x => x.player.position.includes('Back')).length,
      MID: visiblePlayers.filter(x => x.player.position.includes('Midfield')).length,
      FWD: visiblePlayers.filter(
        x => x.player.position.includes('Striker') || x.player.position.includes('Winger')
      ).length
    }),
    [visiblePlayers]
  );

  // Agent Distribution across Female + Male (with division split for dual-color progress bar)
  const agentStats = useMemo(() => {
    const totalVisible = visiblePlayers.length;
    return agents.map(agent => {
      const fCount =
        scope === 'male'
          ? 0
          : players.filter(p => !!findAgentProfile([agent], p.assignedAgent)).length;
      const mCount =
        scope === 'female'
          ? 0
          : malePlayers.filter(p => !!findAgentProfile([agent], p.assignedAgent)).length;
      const total = fCount + mCount;
      const femalePct = totalVisible > 0 ? Math.round((fCount / totalVisible) * 100) : 0;
      const malePct = totalVisible > 0 ? Math.round((mCount / totalVisible) * 100) : 0;
      const sharePct = totalVisible > 0 ? Math.round((total / totalVisible) * 100) : 0;

      return {
        agent,
        fCount,
        mCount,
        total,
        femalePct,
        malePct,
        sharePct
      };
    });
  }, [agents, scope, players, malePlayers, visiblePlayers.length]);

  const unassignedCount = visiblePlayers.filter(
    x => !findAgentProfile(agents, x.player.assignedAgent)
  ).length;

  // Foreign Prospects & Scouting Tracker
  const staleForeignProspects = useMemo(
    () =>
      foreignProspects
        .filter(fp => isForeignProspectStatusStale(fp, FOREIGN_STATUS_STALE_DAYS))
        .sort(
          (a, b) =>
            getDaysSinceForeignStatusChange(b) - getDaysSinceForeignStatusChange(a)
        ),
    [foreignProspects]
  );
  const totalForeignClubOffers = useMemo(
    () => foreignProspects.reduce((sum, fp) => sum + (fp.clubsOfferedTo?.length || 0), 0),
    [foreignProspects]
  );
  const maleTrackedCount = trackedPlayers.filter(tp => tp.gender === 'Male').length;
  const femaleTrackedCount = trackedPlayers.filter(tp => tp.gender === 'Female').length;
  const localProspectsCount = prospects.filter(p => p.scope === 'Local').length;
  const intlProspectsCount = prospects.filter(p => p.scope === 'International').length;

  const divisionLabel = (rosterType: 'female' | 'male') =>
    rosterType === 'female' ? (isHe ? 'נשים' : 'Female') : isHe ? 'גברים/נוער' : 'Male';

  return (
    <div className="space-y-6">
      {/* Unified Command Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isHe ? 'מרכז שליטה מאוחד — סוכנות BRIT SPORT GROUP' : 'Unified Agency Command'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isHe
                ? `${players.length} שחקניות נשים · ${malePlayers.length} שחקני בנים ונוער · ${uniqueClubsCount} מועדונים`
                : `${players.length} Female · ${malePlayers.length} Male & Youth · ${uniqueClubsCount} clubs represented`}
            </p>
          </div>

          {/* Interactive Division Filter: All | Female | Male */}
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start">
            {(
              [
                { id: 'all', label: isHe ? 'הכל' : 'All', count: players.length + malePlayers.length },
                { id: 'female', label: isHe ? 'נשים' : 'Female', count: players.length },
                { id: 'male', label: isHe ? 'בנים/נוער' : 'Male', count: malePlayers.length }
              ] as const
            ).map(option => {
              const active = scope === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setScope(option.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('agent-settings')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.agentSettings}</span>
          </button>

          {scope !== 'male' && (
            <button
              type="button"
              onClick={() => onOpenAddPlayer('female')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isHe ? '+ שחקנית' : '+ Female Player'}</span>
            </button>
          )}

          {scope !== 'female' && (
            <button
              type="button"
              onClick={() => onOpenAddPlayer('male')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isHe ? '+ שחקן' : '+ Male Player'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Unified Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Represented Roster */}
        <div
          onClick={() => onNavigateTab(scope === 'male' ? 'male-roster' : 'roster')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isHe ? 'סגל מיוצג פעיל' : 'Represented Roster'}
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {activeCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isHe ? `פעילים מתוך ${visiblePlayers.length}` : `active of ${visiblePlayers.length}`}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            {scope === 'all' ? (
              <>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {isHe ? 'נשים' : 'Female'}: {femaleActiveCount}/{players.length}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-sky-700 dark:text-sky-400 font-semibold">
                  {isHe ? 'גברים' : 'Male'}: {maleActiveCount}/{malePlayers.length}
                </span>
              </>
            ) : (
              <>
                <span>Senior: {seniorCount}</span>
                <span aria-hidden="true">·</span>
                <span>Youth: {youthCount}</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Critical Contract Expirations */}
        <div
          onClick={() => (onNavigateAlertsHub ? onNavigateAlertsHub('contracts') : onNavigateTab('alerts'))}
          className={`p-5 rounded-xl border cursor-pointer transition-colors ${
            criticalExpiring.length > 0
              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/70 hover:border-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {t.metricAlertsTitle}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
              {criticalExpiring.length}
            </span>
            <span className="text-xs text-amber-800 dark:text-amber-300">
              {t.metricAlertsSub}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            <span>
              {isHe ? '90 ימים' : '90d'}: {upcoming90Days.length}
            </span>
            <span aria-hidden="true">·</span>
            {scope === 'all' ? (
              <span>
                {isHe ? 'נ׳' : 'F'}: {femaleCriticalCount} / {isHe ? 'ג׳' : 'M'}: {maleCriticalCount}
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                {isHe ? 'פתח התראות' : 'Review Alerts'} &rarr;
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Upcoming Birthdays (Next 30d) */}
        <div
          onClick={() => (onNavigateAlertsHub ? onNavigateAlertsHub('birthdays') : onNavigateTab('alerts'))}
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              {t.birthdays} (30d)
            </span>
            <Cake className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {scopedBirthdays.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {todayBdayCount > 0
                ? isHe
                  ? `${todayBdayCount} היום`
                  : `${todayBdayCount} today`
                : isHe
                ? 'ב-30 הימים הקרובים'
                : 'next 30 days'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            {scope === 'all' ? (
              <>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {isHe ? 'נשים' : 'Female'}: {femaleBdayCount}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-sky-700 dark:text-sky-400">
                  {isHe ? 'גברים' : 'Male'}: {maleBdayCount}
                </span>
              </>
            ) : (
              <>
                <span>
                  {isHe ? 'היום' : 'Today'}: {todayBdayCount}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  {t.alertsHub} &rarr;
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Est. Training Compensation Pool */}
        <div
          onClick={() => onNavigateTab('compensation')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {t.estTrainingCompensation}
            </span>
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {formatCurrencyAmount(compensationSummary.totalIls, 'ILS', currency)}
            </span>
            {currency !== 'ILS' && (
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                ({formatIls(compensationSummary.totalIls)})
              </span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums gap-2">
            <span className="truncate">
              {t.estimatedAsOf.replace('{date}', formatDatePretty(nextTransferWindowDate))}
            </span>
            <span className="shrink-0">
              {compensationSummary.calculatedCount}/{visiblePlayers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Side-by-Side Priority Radar: Urgent Contracts (L) & Upcoming Birthdays (R) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Urgent Contracts Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {isHe ? 'התראות חוזה דחופות (עד 30 יום)' : 'Urgent Contract Radar (≤30d)'}
              </h2>
              <span className="text-xs font-mono tabular-nums text-amber-700 dark:text-amber-400 font-bold">
                ({criticalExpiring.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => (onNavigateAlertsHub ? onNavigateAlertsHub('contracts') : onNavigateTab('alerts'))}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <span>{t.alertsHub}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          {criticalExpiring.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {criticalExpiring.slice(0, 5).map(({ player, rosterType }) => {
                const days = getContractDaysRemaining(player.contractExpiryDate);
                return (
                  <div
                    key={`${rosterType}-${player.id}`}
                    className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectPlayer(player, rosterType)}
                      className="min-w-0 flex-1 text-left rtl:text-right"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate">
                        {player.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <span
                          className={`font-semibold ${
                            rosterType === 'female'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-sky-700 dark:text-sky-400'
                          }`}
                        >
                          {divisionLabel(rosterType)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{player.clubName}</span>
                        {player.assignedAgent && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{player.assignedAgent}</span>
                          </>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400">
                        {days < 0 ? `${Math.abs(days)}d ${t.expiredOverdue}` : `${days}d`}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenQuickExtend(player, rosterType)}
                        className="px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0"
                      >
                        {t.extend}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 flex-1 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {isHe
                  ? 'אין חוזים דחופים להארכה ב-30 הימים הקרובים.'
                  : 'No urgent contracts expiring in the next 30 days.'}
              </span>
            </div>
          )}
        </div>

        {/* Upcoming Birthdays Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Cake className="w-4 h-4 text-rose-500 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {t.birthdayRadarTitle}
              </h2>
              <span className="text-xs font-mono tabular-nums text-rose-600 dark:text-rose-400 font-bold">
                ({scopedBirthdays.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => (onNavigateAlertsHub ? onNavigateAlertsHub('birthdays') : onNavigateTab('alerts'))}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <span>{t.birthdays}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          {scopedBirthdays.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {scopedBirthdays.slice(0, 4).map(b => {
                const country = findCountry(b.player.nationality);
                return (
                  <button
                    key={`${b.rosterType}-${b.player.id}`}
                    type="button"
                    onClick={() => onSelectPlayer(b.player, b.rosterType)}
                    className="w-full px-5 py-3 text-left rtl:text-right hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        {country && <span>{country.flag}</span>}
                        <span className="truncate">{b.player.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <span
                          className={`font-semibold ${
                            b.rosterType === 'female'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-sky-700 dark:text-sky-400'
                          }`}
                        >
                          {divisionLabel(b.rosterType)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{t.turningAge.replace('{age}', String(b.upcomingAge))}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{b.formattedDate}</span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono tabular-nums font-bold shrink-0 ${
                        b.isToday ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {b.isToday ? t.birthdayToday : t.birthdayInDays.replace('{days}', String(b.daysUntil))}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 flex-1 flex items-center justify-center gap-2">
              <Cake className="w-4 h-4 text-slate-400" />
              <span>{t.noUpcomingBirthdays}</span>
            </div>
          )}
        </div>
      </div>

      {/* Unified Agent Portfolio & Squad Balance Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isHe ? 'חלוקת סגל לפי סוכן מטפל ומאזן עמדות' : 'Agent Portfolio & Squad Balance'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHe
                ? 'שיוך מאוחד של שחקניות נשים (ירוק) ושחקני בנים ונוער (כחול) לפי סוכן'
                : 'Combined Female (emerald) and Male (sky) portfolio distribution across agency representatives'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
              <span>{isHe ? 'נשים' : 'Female'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" />
              <span>{isHe ? 'גברים/נוער' : 'Male'}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {agentStats.map(({ agent, fCount, mCount, total, femalePct, malePct, sharePct }) => (
            <div
              key={agent.id}
              className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {agent.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono tabular-nums">
                    {agent.phone || agent.email || (isHe ? 'ללא פרטי קשר' : 'No contact info')}
                  </div>
                </div>
                <div className="text-right rtl:text-left shrink-0">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {total}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-500 font-mono tabular-nums">
                    {sharePct}%
                  </span>
                </div>
              </div>

              {/* Dual-division stacked progress bar */}
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                {femalePct > 0 && (
                  <div
                    className="h-full bg-emerald-600 transition-all"
                    style={{ width: `${femalePct}%` }}
                  />
                )}
                {malePct > 0 && (
                  <div
                    className="h-full bg-sky-600 transition-all"
                    style={{ width: `${malePct}%` }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                <span className="text-emerald-700 dark:text-emerald-400">
                  {isHe ? 'נשים' : 'Female'}: {fCount}
                </span>
                <span className="text-sky-700 dark:text-sky-400">
                  {isHe ? 'גברים' : 'Male'}: {mCount}
                </span>
              </div>
            </div>
          ))}

          {/* Squad Position Balance & Unassigned Summary */}
          <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {t.metricBalanceTitle}
              </span>
              <span className="text-slate-500 font-mono tabular-nums">
                {t.unassigned}: <strong>{unassignedCount}</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono tabular-nums">
              {[
                { label: 'GK', val: posCount.GK },
                { label: 'DEF', val: posCount.DEF },
                { label: 'MID', val: posCount.MID },
                { label: 'FWD', val: posCount.FWD }
              ].map(pos => (
                <div
                  key={pos.label}
                  className="py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70"
                >
                  <span className="block text-[10px] font-semibold text-slate-400">{pos.label}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{pos.val}</span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>
                {isHe ? 'מועדונים מיוצגים' : 'Clubs represented'}: <strong className="font-mono tabular-nums">{uniqueClubsCount}</strong>
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('agent-settings')}
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
              >
                {t.agentSettings} &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Scouting & Pipeline Split (no duplicate Contracts Expiry Radar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Foreign Prospects Monitor */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {isHe ? 'שחקניות זרות ובינלאומיות' : 'Foreign Prospects Monitor'}
                </h2>
                <span className="text-xs font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold">
                  ({staleForeignProspects.length > 0 ? `${staleForeignProspects.length} ${isHe ? 'ממתינות' : 'stale'}` : foreignProspects.length})
                </span>
              </div>
              <button
                type="button"
                onClick={onNavigateForeignProspects}
                className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <span>{t.exploreAll}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x rtl:divide-x-reverse divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 text-center">
              <div className="py-3 px-2">
                <div className={`text-lg font-extrabold font-mono tabular-nums ${
                  staleForeignProspects.length > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {staleForeignProspects.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHe ? 'ללא שינוי 5+ ימים' : 'Stale 5+ Days'}
                </div>
              </div>
              <div className="py-3 px-2">
                <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                  {foreignProspects.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHe ? 'סה״כ זרות' : 'Foreign Pool'}
                </div>
              </div>
              <div className="py-3 px-2">
                <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {totalForeignClubOffers}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHe ? 'הצעות לקבוצות' : 'Club Offers'}
                </div>
              </div>
            </div>

            {staleForeignProspects.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {staleForeignProspects.slice(0, 4).map(fp => {
                  const daysStale = getDaysSinceForeignStatusChange(fp);
                  return (
                    <button
                      key={fp.id}
                      type="button"
                      onClick={() => onSelectForeignProspect(fp)}
                      className="w-full px-5 py-3 text-left rtl:text-right hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {fp.fullName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {fp.nationalityPassport} · {fp.currentClub} · {fp.negotiationStatus}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{daysStale}d</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : foreignProspects.length > 0 ? (
              <div className="p-6 text-center text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isHe
                    ? `כל ${foreignProspects.length} השחקניות הזרות עודכנו ב-5 הימים האחרונים.`
                    : `All ${foreignProspects.length} foreign prospects updated within the last 5 days.`}
                </span>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                {isHe ? 'אין כרגע שחקניות זרות במעקב.' : 'No foreign prospects logged yet.'}
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {isHe ? 'מעקב ייצוג ושיבוץ בישראל ואירופה' : 'Israel & Europe placement pipeline'}
            </span>
            <button
              type="button"
              onClick={onNavigateForeignProspects}
              className="font-semibold text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
            >
              {isHe ? 'נהל זרות' : 'Manage Foreign'} &rarr;
            </button>
          </div>
        </div>

        {/* In Talk & Match Minutes Tracker */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {isHe ? 'מועמדות בשיחות ומעקב דקות' : 'In Talk & Match Tracker'}
                </h2>
                <span className="text-xs font-mono tabular-nums text-slate-500 font-bold">
                  ({prospects.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('in-talk')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <span>{t.exploreAll}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x rtl:divide-x-reverse divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 text-center">
              <div className="py-3 px-2">
                <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                  {localProspectsCount}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHe ? 'שיחות מקומיות' : 'Local Talks'}
                </div>
              </div>
              <div className="py-3 px-2">
                <div className="text-lg font-extrabold font-mono tabular-nums text-sky-700 dark:text-sky-400">
                  {intlProspectsCount}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHe ? 'בינלאומיות' : 'International'}
                </div>
              </div>
              <div
                onClick={() => onNavigateTab('tracker')}
                className="py-3 px-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {trackedPlayers.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHe ? `מעקב (נ:${femaleTrackedCount} / ג:${maleTrackedCount})` : `Tracked (F:${femaleTrackedCount} / M:${maleTrackedCount})`}
                </div>
              </div>
            </div>

            {prospects.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {prospects.slice(0, 4).map(prospect => (
                  <div
                    key={prospect.id}
                    className="px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectProspect(prospect)}
                        className="text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate block text-left rtl:text-right"
                      >
                        {prospect.name}
                      </button>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {prospect.scope} · {prospect.currentClub} · {prospect.talkStage}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectProspect(prospect)}
                      className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      {prospect.videoUrl?.trim() && <Play className="w-3 h-3" />}
                      <span>{isHe ? 'פתיחה' : 'Open'}</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                {isHe ? 'אין מועמדות פעילות בשיחות.' : 'No active talks in pipeline.'}
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isHe
                  ? `${trackedPlayers.length} שחקנים/ות במעקב דקות משחק`
                  : `${trackedPlayers.length} players in Match Minutes Tracker`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('tracker')}
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              {t.playerTracker} &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

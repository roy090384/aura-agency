import React from 'react';
import { Player, TalkProspect, Language, Currency, NavigationTab } from '../types/player';
import { 
  getContractDaysRemaining, 
  getContractUrgency, 
  getUrgencyBadgeConfig, 
  formatDatePretty 
} from '../utils/contractAlerts';
import { 
  TRANSLATIONS, 
  POSITION_TRANSLATIONS, 
  getYouthBadgeColor 
} from '../translations/translations';
import { 
  AlertTriangle, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Play, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Cake,
  Gift
} from 'lucide-react';
import { getUpcomingBirthdays, BirthdayInfo } from '../utils/birthdayAlerts';
import { findCountry } from '../data/countries';

interface DashboardViewProps {
  players: Player[];
  prospects: TalkProspect[];
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectPlayer: (player: Player) => void;
  onSelectProspect: (prospect: TalkProspect) => void;
  onOpenQuickExtend: (player: Player) => void;
  onOpenAddPlayer: () => void;
  language: Language;
  currency?: Currency;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  players,
  prospects,
  onNavigateTab,
  onSelectPlayer,
  onSelectProspect,
  onOpenQuickExtend,
  onOpenAddPlayer,
  language,
  currency = 'EUR'
}) => {
  const t = TRANSLATIONS[language];

  // Urgent contracts: Expiring in <= 30 days (1 month alert) or already expired
  const criticalExpiringPlayers = players
    .filter(p => {
      const days = getContractDaysRemaining(p.contractExpiryDate);
      return days <= 30;
    })
    .sort((a, b) => getContractDaysRemaining(a.contractExpiryDate) - getContractDaysRemaining(b.contractExpiryDate));

  // Secondary upcoming: Expiring in 31 to 90 days (~1 to 3 months)
  const upcoming90DaysPlayers = players
    .filter(p => {
      const days = getContractDaysRemaining(p.contractExpiryDate);
      return days > 30 && days <= 90;
    })
    .sort((a, b) => getContractDaysRemaining(a.contractExpiryDate) - getContractDaysRemaining(b.contractExpiryDate));

  // Prospects in talk stats
  const localProspects = prospects.filter(p => p.scope === 'Local');
  const intlProspects = prospects.filter(p => p.scope === 'International');

  // Positions count
  const posCount = {
    GK: players.filter(p => p.position.includes('Goalkeeper')).length,
    DEF: players.filter(p => p.position.includes('Back')).length,
    MID: players.filter(p => p.position.includes('Midfield')).length,
    FWD: players.filter(p => p.position.includes('Striker') || p.position.includes('Winger')).length,
  };

  // Birthday alerts: players with birthdays in the next 30 days
  const upcomingBirthdays = getUpcomingBirthdays(players, 30);
  const todayBirthdays = upcomingBirthdays.filter(b => b.isToday);
  const thisWeekBirthdays = upcomingBirthdays.filter(b => b.isThisWeek);

  return (
    <div className="space-y-6">

      {/* Hero Welcome & Quick Notice */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-sm">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="/src/assets/images/match_floodlights_stadium_1794074974336.jpg" 
            alt="Football Stadium"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.heroBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {t.heroTitle}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t.heroDesc}
          </p>
        </div>
      </div>

      {/* CRITICAL 1-MONTH ALERT RADAR BANNER (Triggered when any contract is <= 30 days) */}
      {criticalExpiringPlayers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-800/60 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                    {t.warningTitle} ({criticalExpiringPlayers.length})
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-semibold">
                    {t.warningSub}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-1">
                  {t.warningDesc}
                </p>

                {/* Quick list of urgent players */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {criticalExpiringPlayers.map(p => {
                    const days = getContractDaysRemaining(p.contractExpiryDate);
                    return (
                      <button
                        key={p.id}
                        onClick={() => onSelectPlayer(p)}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 hover:border-amber-400 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
                      >
                        <span className="font-semibold">{p.name}</span>
                        {p.youthCategory && p.youthCategory !== 'Senior' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getYouthBadgeColor(p.youthCategory)}`}>
                            {p.youthCategory}
                          </span>
                        )}
                        <span className="text-slate-400">({p.clubName})</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono-tabular">
                          {days < 0 ? `${Math.abs(days)}d ${t.expiredOverdue}` : `${days}d`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => onNavigateTab('alerts')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs"
              >
                <span>{t.manageAlerts}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATORY BIRTHDAY RADAR ALERT BANNER (Active when players have birthdays within 30 days) */}
      {upcomingBirthdays.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl border border-pink-200 dark:border-pink-900/60 bg-gradient-to-r from-pink-50/90 via-rose-50/70 to-amber-50/50 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-slate-900 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shrink-0 mt-0.5 shadow-sm">
                <Cake className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-pink-950 dark:text-pink-200 flex items-center gap-1.5">
                    <span>{t.birthdayRadarTitle}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-200 dark:bg-pink-900/80 text-pink-900 dark:text-pink-200 font-bold font-mono-tabular">
                      {upcomingBirthdays.length}
                    </span>
                  </h3>
                  {todayBirthdays.length > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold shadow-xs">
                      {t.birthdayToday}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-pink-800 dark:text-pink-300/90 mt-1">
                  {t.birthdayRadarDesc}
                </p>

                {/* Quick list of birthday players */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {upcomingBirthdays.map(b => {
                    const country = findCountry(b.player.nationality);
                    return (
                      <button
                        key={b.player.id}
                        onClick={() => onSelectPlayer(b.player)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all shadow-2xs ${
                          b.isToday
                            ? 'bg-white dark:bg-slate-900 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/50 font-bold text-rose-900 dark:text-rose-200'
                            : b.isThisWeek
                            ? 'bg-white dark:bg-slate-900 border-pink-300 dark:border-pink-800 font-semibold text-slate-800 dark:text-slate-200'
                            : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {country && <span className="text-sm">{country.flag}</span>}
                        <span>{b.player.name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-pink-600 dark:text-pink-400 font-semibold">
                          {t.turningAge.replace('{age}', String(b.upcomingAge))}
                        </span>
                        <span className={`text-[11px] font-mono-tabular font-bold px-1.5 py-0.5 rounded ${
                          b.isToday 
                            ? 'bg-rose-500 text-white' 
                            : b.isThisWeek 
                            ? 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {b.isToday ? 'TODAY 🎂' : t.birthdayInDays.replace('{days}', String(b.daysUntil))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Represented Players */}
        <div 
          onClick={() => onNavigateTab('roster')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.metricRosterTitle}
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
              {players.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t.metricRosterSub}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>U15-U19: {players.filter(p => p.youthCategory && p.youthCategory !== 'Senior').length}</span>
            <span>·</span>
            <span>Senior: {players.filter(p => !p.youthCategory || p.youthCategory === 'Senior').length}</span>
            <span>·</span>
            <span>Active: {players.filter(p => p.status === 'Active').length}</span>
          </div>
        </div>

        {/* Metric 2: 1-Month Contract Alerts */}
        <div 
          onClick={() => onNavigateTab('alerts')}
          className={`p-5 rounded-xl border shadow-2xs cursor-pointer transition-all ${
            criticalExpiringPlayers.length > 0 
              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/70 hover:border-amber-400' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {t.metricAlertsTitle}
            </span>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 font-mono-tabular">
              {criticalExpiringPlayers.length}
            </span>
            <span className="text-xs text-amber-800 dark:text-amber-300">
              {t.metricAlertsSub}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Next 90 Days: {upcoming90DaysPlayers.length}</span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Click to review</span>
          </div>
        </div>

        {/* Metric 3: In Talk With Pipeline */}
        <div 
          onClick={() => onNavigateTab('in-talk')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t.metricPipelineTitle}
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
              {prospects.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t.metricPipelineSub}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {t.local}: {localProspects.length}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-sky-600" />
              {t.international}: {intlProspects.length}
            </span>
          </div>
        </div>

        {/* Metric 4: Squad Balance */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.metricBalanceTitle}
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
              <span className="block text-xs font-semibold text-slate-400">GK</span>
              <span className="text-base font-bold text-slate-800 dark:text-white font-mono-tabular">{posCount.GK}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
              <span className="block text-xs font-semibold text-slate-400">DEF</span>
              <span className="text-base font-bold text-slate-800 dark:text-white font-mono-tabular">{posCount.DEF}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
              <span className="block text-xs font-semibold text-slate-400">MID</span>
              <span className="text-base font-bold text-slate-800 dark:text-white font-mono-tabular">{posCount.MID}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
              <span className="block text-xs font-semibold text-slate-400">FWD</span>
              <span className="text-base font-bold text-slate-800 dark:text-white font-mono-tabular">{posCount.FWD}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 text-center">
            {players.length} players across {new Set(players.map(p => p.clubName)).size} clubs
          </div>
        </div>

      </div>

      {/* Main 2-Column Split: Attention View & Active Recruitment Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Contracts Requiring Agency Action (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.contractsExpiryRadar}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.contractsRadarDesc}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>{t.viewAllAlerts}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs overflow-hidden">
            {[...criticalExpiringPlayers, ...upcoming90DaysPlayers].slice(0, 5).map(player => {
              const days = getContractDaysRemaining(player.contractExpiryDate);
              const urgency = getContractUrgency(player.contractExpiryDate);
              const badge = getUrgencyBadgeConfig(urgency, days);
              const youthCat = player.youthCategory || 'Senior';

              return (
                <div 
                  key={player.id} 
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    {player.photoUrl ? (
                      <img 
                        src={player.photoUrl} 
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-sm border border-emerald-200 dark:border-emerald-800 shrink-0">
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onSelectPlayer(player)}
                          className="font-semibold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate text-left rtl:text-right"
                        >
                          {player.name}
                        </button>
                        {youthCat !== 'Senior' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getYouthBadgeColor(youthCat)}`}>
                            {youthCat}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{player.age} yrs</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{player.clubName}</span>
                        <span>·</span>
                        <span>{POSITION_TRANSLATIONS[language][player.position] || player.position}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right rtl:text-left">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${badge.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}></span>
                        <span>{badge.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono-tabular">
                        Expiry: {formatDatePretty(player.contractExpiryDate)}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenQuickExtend(player)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Quick Extend Agency Contract"
                    >
                      {t.extend}
                    </button>
                  </div>
                </div>
              );
            })}

            {criticalExpiringPlayers.length === 0 && upcoming90DaysPlayers.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium">All agency contracts are in good standing.</p>
                <p className="text-xs text-slate-400 mt-1">No contracts expiring in the next 90 days.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: "In Talk With" Active Recruitment Pipeline (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.activePipelineSnapshot}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.activePipelineDesc}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('in-talk')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>{t.exploreAll} ({prospects.length})</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs overflow-hidden">
            {prospects.slice(0, 4).map(prospect => {
              const youthCat = prospect.youthCategory || 'Senior';
              return (
                <div 
                  key={prospect.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onSelectProspect(prospect)}
                          className="font-semibold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate text-left rtl:text-right"
                        >
                          {prospect.name}
                        </button>
                        {youthCat !== 'Senior' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getYouthBadgeColor(youthCat)}`}>
                            {youthCat}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          prospect.scope === 'International' 
                            ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300' 
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {prospect.scope}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {prospect.currentClub} · {POSITION_TRANSLATIONS[language][prospect.position] || prospect.position}
                      </div>
                    </div>

                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {prospect.talkStage}
                    </span>
                  </div>

                  {/* Video indicator & conversation snippet */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                      {prospect.videoUrl?.trim() ? (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{prospect.videoTitle || 'Video Highlights'}</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {t.noVideoAttached || (language === 'he' ? 'אין סרטון מצורף' : 'No video reel')}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => onSelectProspect(prospect)}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline shrink-0 ml-2"
                    >
                      {language === 'he' ? 'תיק מועמדת' : 'Dossier'} &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Birthday Radar Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
              <Cake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t.birthdayRadarTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 font-bold font-mono-tabular">
                  {upcomingBirthdays.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.birthdayRadarDesc}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('roster')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>{t.rosterTitle}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {upcomingBirthdays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBirthdays.map(b => {
              const country = findCountry(b.player.nationality);
              const youthCat = b.player.youthCategory || 'Senior';
              return (
                <div
                  key={b.player.id}
                  onClick={() => onSelectPlayer(b.player)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
                    b.isToday
                      ? 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30 border-rose-300 dark:border-rose-700 ring-2 ring-rose-400/50'
                      : b.isThisWeek
                      ? 'bg-white dark:bg-slate-900 border-pink-200 dark:border-pink-900/60 hover:border-pink-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      b.isToday
                        ? 'bg-rose-600 text-white animate-pulse'
                        : b.isThisWeek
                        ? 'bg-pink-100 dark:bg-pink-900/80 text-pink-800 dark:text-pink-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      <Cake className="w-3 h-3" />
                      <span>{b.isToday ? t.birthdayToday : t.birthdayInDays.replace('{days}', String(b.daysUntil))}</span>
                    </span>

                    <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
                      {t.turningAge.replace('{age}', String(b.upcomingAge))}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {b.player.photoUrl ? (
                      <img
                        src={b.player.photoUrl}
                        alt={b.player.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300 font-bold flex items-center justify-center text-sm border border-pink-200 dark:border-pink-800 shrink-0">
                        {b.player.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        {country && <span>{country.flag}</span>}
                        <span>{b.player.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {b.player.clubName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono-tabular mt-1 flex items-center justify-between">
                        <span>{b.formattedDate}</span>
                        {youthCat !== 'Senior' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getYouthBadgeColor(youthCat)}`}>
                            {youthCat}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400 text-xs">
            <Cake className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="font-medium text-slate-600 dark:text-slate-400">{t.noUpcomingBirthdays}</p>
          </div>
        )}
      </div>

    </div>
  );
};

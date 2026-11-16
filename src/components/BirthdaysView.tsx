import React, { useState, useMemo } from 'react';
import { Player, AgentProfile, Language } from '../types/player';
import { getUpcomingBirthdays, BirthdayInfo } from '../utils/birthdayAlerts';
import { TRANSLATIONS, getYouthBadgeColor } from '../translations/translations';
import { findCountry } from '../data/countries';
import { findAgentProfile } from '../data/defaultAgents';
import {
  Cake,
  Search,
  Phone,
  UserCheck,
  Gift,
  Calendar,
  Users
} from 'lucide-react';

interface UnifiedBirthdayItem extends BirthdayInfo {
  rosterType: 'female' | 'male';
}

interface BirthdaysViewProps {
  femalePlayers: Player[];
  malePlayers: Player[];
  agents: AgentProfile[];
  onSelectPlayer: (player: Player, rosterType: 'female' | 'male') => void;
  language: Language;
}

export const BirthdaysView: React.FC<BirthdaysViewProps> = ({
  femalePlayers,
  malePlayers,
  agents,
  onSelectPlayer,
  language
}) => {
  const t = TRANSLATIONS[language];
  const isHe = language === 'he';

  const [rosterFilter, setRosterFilter] = useState<'ALL' | 'female' | 'male'>('ALL');
  const [windowDays, setWindowDays] = useState<number>(30);
  const [searchQuery, setSearchQuery] = useState('');

  const allBirthdays = useMemo<UnifiedBirthdayItem[]>(() => {
    const fList = getUpcomingBirthdays(femalePlayers, windowDays).map(item => ({
      ...item,
      rosterType: 'female' as const
    }));
    const mList = getUpcomingBirthdays(malePlayers, windowDays).map(item => ({
      ...item,
      rosterType: 'male' as const
    }));
    return [...fList, ...mList].sort((a, b) => a.daysUntil - b.daysUntil);
  }, [femalePlayers, malePlayers, windowDays]);

  const filteredBirthdays = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allBirthdays.filter(item => {
      if (rosterFilter !== 'ALL' && item.rosterType !== rosterFilter) return false;
      if (!q) return true;
      return (
        item.player.name.toLowerCase().includes(q) ||
        item.player.clubName.toLowerCase().includes(q) ||
        (item.player.assignedAgent || '').toLowerCase().includes(q) ||
        (item.player.parentName || '').toLowerCase().includes(q)
      );
    });
  }, [allBirthdays, rosterFilter, searchQuery]);

  const todayCount = allBirthdays.filter(b => b.isToday).length;
  const thisWeekCount = allBirthdays.filter(b => b.isThisWeek || b.isToday).length;
  const femaleCount = allBirthdays.filter(b => b.rosterType === 'female').length;
  const maleCount = allBirthdays.filter(b => b.rosterType === 'male').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 dark:text-pink-400">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.birthdays}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isHe
                  ? 'מעקב מאוחד של ימי הולדת קרובים עבור סגל הנשים וסגל הבנים והנוער.'
                  : 'Unified upcoming birthday radar across both Female and Male rosters.'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 text-xs font-bold border border-rose-200 dark:border-rose-900">
            <Gift className="w-3.5 h-3.5" />
            <span>{isHe ? `היום: ${todayCount}` : `Today: ${todayCount}`}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-800 dark:text-pink-300 text-xs font-semibold border border-pink-200 dark:border-pink-900/60">
            <Calendar className="w-3.5 h-3.5" />
            <span>{isHe ? `7 ימים: ${thisWeekCount}` : `Next 7d: ${thisWeekCount}`}</span>
          </span>
        </div>
      </div>

      {/* Filters Bar: All / Female / Male + Time Window + Search */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Roster Filter Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setRosterFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              rosterFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.rosterFilterAll} ({allBirthdays.length})
          </button>
          <button
            type="button"
            onClick={() => setRosterFilter('female')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              rosterFilter === 'female'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.femaleLabel} ({femaleCount})
          </button>
          <button
            type="button"
            onClick={() => setRosterFilter('male')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              rosterFilter === 'male'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.maleLabel} ({maleCount})
          </button>
        </div>

        {/* Search & Window Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <select
            value={windowDays}
            onChange={e => setWindowDays(Number(e.target.value))}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium"
          >
            <option value={7}>{isHe ? '7 ימים הקרובים' : 'Next 7 Days'}</option>
            <option value={30}>{isHe ? '30 ימים הקרובים' : 'Next 30 Days'}</option>
            <option value={90}>{isHe ? '90 ימים הקרובים' : 'Next 90 Days'}</option>
            <option value={366}>{isHe ? 'כל השנה (365 ימים)' : 'Full Year (365 Days)'}</option>
          </select>
        </div>
      </div>

      {/* Birthday Cards Grid */}
      {filteredBirthdays.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <Cake className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.noUpcomingBirthdays}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHe
              ? 'נסו להרחיב את טווח הימים או לשנות את סינון הסגל.'
              : 'Try expanding the day range or switching the roster filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBirthdays.map(b => {
            const country = findCountry(b.player.nationality);
            const youthCat = b.player.youthCategory || 'Senior';
            const isMalePlayer = b.rosterType === 'male';
            const agentInfo = findAgentProfile(agents, b.player.assignedAgent);

            return (
              <div
                key={`${b.rosterType}-${b.player.id}`}
                onClick={() => onSelectPlayer(b.player, b.rosterType)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
                  b.isToday
                    ? 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30 border-rose-300 dark:border-rose-700 ring-2 ring-rose-400/50'
                    : b.isThisWeek
                    ? 'bg-white dark:bg-slate-900 border-pink-200 dark:border-pink-900/60 hover:border-pink-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* Top Badges: Roster Badge + Countdown + Turning Age */}
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isMalePlayer
                          ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {isMalePlayer ? t.maleLabel : t.femaleLabel}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        b.isToday
                          ? 'bg-rose-600 text-white animate-pulse'
                          : b.isThisWeek
                          ? 'bg-pink-100 dark:bg-pink-900/80 text-pink-800 dark:text-pink-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Cake className="w-3 h-3" />
                      <span>
                        {b.isToday
                          ? t.birthdayToday
                          : t.birthdayInDays.replace('{days}', String(b.daysUntil))}
                      </span>
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
                    {t.turningAge.replace('{age}', String(b.upcomingAge))}
                  </span>
                </div>

                {/* Player Info */}
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
                    <div className="text-[11px] text-slate-400 font-mono-tabular mt-1 flex items-center justify-between gap-2">
                      <span>{b.formattedDate} ({b.birthDate})</span>
                      {youthCat !== 'Senior' && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getYouthBadgeColor(youthCat)}`}>
                          {youthCat}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact & Assigned Agent Footer */}
                {(b.player.contactPhone || b.player.parentName || b.player.assignedAgent) && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {b.player.contactPhone ? (
                      <a
                        href={`tel:${b.player.contactPhone}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-mono-tabular hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{b.player.contactPhone}</span>
                      </a>
                    ) : b.player.parentName ? (
                      <span className="truncate">
                        {isHe ? 'הורה:' : 'Parent:'} {b.player.parentName}
                      </span>
                    ) : (
                      <span />
                    )}

                    {b.player.assignedAgent && (
                      <span
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300"
                        title={
                          agentInfo
                            ? `${agentInfo.name}${agentInfo.phone ? ` · ${agentInfo.phone}` : ''}${agentInfo.email ? ` · ${agentInfo.email}` : ''}`
                            : b.player.assignedAgent
                        }
                      >
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>{b.player.assignedAgent}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

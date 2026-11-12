import React, { useState, useMemo } from 'react';
import { TrackedPlayer, TrackerCategory, PlayerGender, Language } from '../types/player';
import { TRANSLATIONS, TRACKER_CATEGORY_LABELS, getTrackerCategoryBadgeColor } from '../translations/translations';
import { 
  getGameDurationMinutes, 
  calculatePlayTimePercentage, 
  getTotalPossibleMinutes, 
  calculateGoalInvolvements,
  calculateTargetProgress,
  getTargetProgressColor,
  getPercentageColor 
} from '../utils/trackerCalculations';
import { 
  Activity, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Users, 
  Edit, 
  Trash2, 
  Sparkles, 
  Award, 
  LayoutGrid, 
  List, 
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
  Calendar,
  Share2,
  Target,
  Check,
  X
} from 'lucide-react';

interface PlayerTrackerViewProps {
  players: TrackedPlayer[];
  onOpenAddPlayer: (defaultCategory?: TrackerCategory) => void;
  onEditPlayer: (player: TrackedPlayer) => void;
  onOpenManualMinutes: (player: TrackedPlayer) => void;
  onUpdateTarget?: (playerId: string, target: number) => void;
  onRequestDeletePlayer: (player: TrackedPlayer) => void;
  onRequestDeleteMultiple: (playerIds: string[]) => void;
  onQuickAddGoal: (playerId: string) => void;
  onQuickAddAssist: (playerId: string) => void;
  onQuickAddMinutes: (playerId: string, minutes: number) => void;
  onQuickAddMatch: (playerId: string) => void;
  language: Language;
}

export const PlayerTrackerView: React.FC<PlayerTrackerViewProps> = ({
  players,
  onOpenAddPlayer,
  onEditPlayer,
  onOpenManualMinutes,
  onUpdateTarget,
  onRequestDeletePlayer,
  onRequestDeleteMultiple,
  onQuickAddGoal,
  onQuickAddAssist,
  onQuickAddMinutes,
  onQuickAddMatch,
  language
}) => {
  const t = TRANSLATIONS[language];

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<TrackerCategory | 'ALL'>('ALL');
  const [selectedGender, setSelectedGender] = useState<PlayerGender | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'playTimePct' | 'minutes' | 'involvements' | 'targetPct' | 'name'>('playTimePct');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Quick target adjustment modal
  const [editingTargetPlayer, setEditingTargetPlayer] = useState<TrackedPlayer | null>(null);
  const [newTargetValue, setNewTargetValue] = useState<number>(10);

  // Multi-select for deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Minutes dropdown open state for a player
  const [openMinutesMenuId, setOpenMinutesMenuId] = useState<string | null>(null);

  // Filtered and sorted players
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      // Gender filter
      if (selectedGender !== 'ALL' && p.gender !== selectedGender) return false;
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches = 
          p.name.toLowerCase().includes(q) ||
          p.clubName.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q) ||
          (p.league && p.league.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'playTimePct') {
        const pctA = calculatePlayTimePercentage(a.minutesPlayed, a.matchesEligible, a.category);
        const pctB = calculatePlayTimePercentage(b.minutesPlayed, b.matchesEligible, b.category);
        return sortOrder === 'desc' ? pctB - pctA : pctA - pctB;
      }
      if (sortBy === 'minutes') {
        return sortOrder === 'desc' ? b.minutesPlayed - a.minutesPlayed : a.minutesPlayed - b.minutesPlayed;
      }
      if (sortBy === 'involvements') {
        const invA = calculateGoalInvolvements(a.goals, a.assists);
        const invB = calculateGoalInvolvements(b.goals, b.assists);
        return sortOrder === 'desc' ? invB - invA : invA - invB;
      }
      if (sortBy === 'targetPct') {
        const tA = calculateTargetProgress(a.goals, a.assists, a.goalInvolvementTarget).percentage;
        const tB = calculateTargetProgress(b.goals, b.assists, b.goalInvolvementTarget).percentage;
        return sortOrder === 'desc' ? tB - tA : tA - tB;
      }
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return 0;
    });
  }, [players, selectedCategory, selectedGender, searchQuery, sortBy, sortOrder]);

  // Overall metric totals across filtered view
  const metrics = useMemo(() => {
    const totalPlayers = filteredPlayers.length;
    const totalMinutes = filteredPlayers.reduce((sum, p) => sum + p.minutesPlayed, 0);
    const totalGoals = filteredPlayers.reduce((sum, p) => sum + p.goals, 0);
    const totalAssists = filteredPlayers.reduce((sum, p) => sum + p.assists, 0);
    const totalInvolvements = totalGoals + totalAssists;

    const playersWithTargetCount = filteredPlayers.filter(p => (p.goalInvolvementTarget ?? 0) > 0).length;
    const targetsMetCount = filteredPlayers.filter(p => {
      const prog = calculateTargetProgress(p.goals, p.assists, p.goalInvolvementTarget);
      return prog.hasTarget && prog.isReached;
    }).length;

    const avgPct = totalPlayers > 0 
      ? Math.round(filteredPlayers.reduce((sum, p) => sum + calculatePlayTimePercentage(p.minutesPlayed, p.matchesEligible, p.category), 0) / totalPlayers) 
      : 0;

    return { 
      totalPlayers, 
      totalMinutes, 
      totalGoals, 
      totalAssists, 
      totalInvolvements, 
      avgPct,
      playersWithTargetCount,
      targetsMetCount
    };
  }, [filteredPlayers]);

  // Bulk selection toggles
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredPlayers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPlayers.map(p => p.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.playerTracker}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {players.length} {t.playersLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.trackerSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Easy Bulk Delete Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => onRequestDeleteMultiple(selectedIds)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteSelected} ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={() => onOpenAddPlayer(selectedCategory !== 'ALL' ? selectedCategory : undefined)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.trackPlayerBtn}</span>
          </button>
        </div>
      </div>

      {/* Regulation Rule Info Bar */}
      <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 text-sky-900 dark:text-sky-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="font-medium">
            <strong>{t.ruleBadgeNotice}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-sky-700 dark:text-sky-400 font-mono-tabular">
          <span>U15/U16: 80m</span>
          <span>·</span>
          <span>U17/U19/Woman's: 90m</span>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Tracked Players */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            {t.trackerSummaryTotalPlayers}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
              {metrics.totalPlayers}
            </span>
            <span className="text-xs text-slate-400">active</span>
          </div>
        </div>

        {/* Metric 2: Total Pitch Minutes */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            {t.trackerSummaryTotalMinutes}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-tabular">
              {metrics.totalMinutes.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">mins</span>
          </div>
        </div>

        {/* Metric 3: Goals & Assists and Targets */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              {t.trackerSummaryTotalInvolvements}
            </span>
            {metrics.targetsMetCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {metrics.targetsMetCount} 🎯 Met
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono-tabular">
              {metrics.totalInvolvements}
            </span>
            <span className="text-xs text-slate-500 font-mono-tabular">
              ({metrics.totalGoals}G + {metrics.totalAssists}A)
            </span>
          </div>
        </div>

        {/* Metric 4: Average Play Time % */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            {t.trackerSummaryAvgPlayPct}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
              {metrics.avgPct}%
            </span>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden ml-2">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all" 
                style={{ width: `${metrics.avgPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Category Switcher Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        
        {/* Category Tabs: All, U15, U16, U17, U19, Woman's */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.allCategories} ({players.length})
          </button>

          {(['U15', 'U16', 'U17', 'U19', 'Womans'] as TrackerCategory[]).map(cat => {
            const count = players.filter(p => p.category === cat).length;
            const duration = getGameDurationMinutes(cat);
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat === 'Womans' ? "Woman's" : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count} · {duration}m
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Bar: Gender filter, Search, Sorting, View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Gender Filter (All, Female, Male) */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setSelectedGender('ALL')}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedGender === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {language === 'he' ? 'כולם' : 'All'}
              </button>
              <button
                onClick={() => setSelectedGender('Female')}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedGender === 'Female'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                👩 {t.female}
              </button>
              <button
                onClick={() => setSelectedGender('Male')}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedGender === 'Male'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                👦 {t.male}
              </button>
            </div>
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">{t.sortBy}</span>
            <button
              onClick={() => {
                if (sortBy === 'playTimePct') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                else { setSortBy('playTimePct'); setSortOrder('desc'); }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sortBy === 'playTimePct' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Play Time % {sortBy === 'playTimePct' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>

            <button
              onClick={() => {
                if (sortBy === 'involvements') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                else { setSortBy('involvements'); setSortOrder('desc'); }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sortBy === 'involvements' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              G+A {sortBy === 'involvements' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>

            <button
              onClick={() => {
                if (sortBy === 'targetPct') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                else { setSortBy('targetPct'); setSortOrder('desc'); }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                sortBy === 'targetPct' ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Sort by Goal Involvement Target %"
            >
              <Target className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Target % {sortBy === 'targetPct' && (sortOrder === 'desc' ? '↓' : '↑')}</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Table / Grid view toggles */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
              <button
                onClick={() => setViewMode('table')}
                aria-label={t.tableView}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-label={t.gridView}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Main Content Area */}
      {filteredPlayers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No players found in this category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your category or gender filter, or track a new player.
          </p>
          <button
            onClick={() => onOpenAddPlayer(selectedCategory !== 'ALL' ? selectedCategory : undefined)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {t.trackPlayerBtn}
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-8">
                    <input 
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredPlayers.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">{t.thPlayer}</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-4">Club</th>
                  <th className="py-3 px-4 text-center">Appearances</th>
                  <th className="py-3 px-4 text-center">{t.minutesPlayed}</th>
                  <th className="py-3 px-4 text-center min-w-[140px]">{t.playTimePercentage}</th>
                  <th className="py-3 px-3 text-center">{t.goals}</th>
                  <th className="py-3 px-3 text-center">{t.assists}</th>
                  <th className="py-3 px-4 text-center">G+A</th>
                  <th className="py-3 px-4 text-center min-w-[130px]">{t.gaTarget}</th>
                  <th className="py-3 px-4 text-center min-w-[200px]">{t.quickStatsAction}</th>
                  <th className="py-3 px-3 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredPlayers.map(player => {
                  const duration = getGameDurationMinutes(player.category);
                  const totalPossible = getTotalPossibleMinutes(player.matchesEligible, player.category, player.minutesPlayed);
                  const playPct = calculatePlayTimePercentage(player.minutesPlayed, player.matchesEligible, player.category);
                  const pctStyle = getPercentageColor(playPct);
                  const goalInvolvements = calculateGoalInvolvements(player.goals, player.assists);
                  const targetProgress = calculateTargetProgress(player.goals, player.assists, player.goalInvolvementTarget);
                  const targetStyle = getTargetProgressColor(targetProgress);
                  const isSelected = selectedIds.includes(player.id);
                  const isMenuOpen = openMinutesMenuId === player.id;

                  return (
                    <tr 
                      key={player.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(player.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Player Profile & Gender */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {player.photoUrl ? (
                            <img 
                              src={player.photoUrl} 
                              alt={player.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {player.gender === 'Female' ? '👩' : '👦'}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {player.name}
                              </span>
                              {player.jerseyNumber && (
                                <span className="text-slate-400 text-xs font-mono-tabular">
                                  #{player.jerseyNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{player.position}</span>
                              <span>·</span>
                              <span>{player.age} yrs</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge with Game Duration Rule */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getTrackerCategoryBadgeColor(player.category)}`}>
                            {player.category === 'Womans' ? "Woman's" : player.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-tabular">
                            {duration}m / game
                          </span>
                        </div>
                      </td>

                      {/* Club */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {player.clubName}
                        </div>
                        {player.league && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {player.league}
                          </div>
                        )}
                      </td>

                      {/* Appearances */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono-tabular">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {player.matchesPlayed}
                        </span>
                        <span className="text-slate-400 text-xs"> / {player.matchesEligible}</span>
                      </td>

                      {/* Minutes Played - Click to manually add or edit */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono-tabular">
                        <button
                          onClick={() => onOpenManualMinutes(player)}
                          className="group/min inline-flex flex-col items-center p-1 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                          title="Click to add or edit playing time manually"
                        >
                          <div className="font-bold text-slate-900 dark:text-white group-hover/min:text-emerald-600 dark:group-hover/min:text-emerald-400 flex items-center gap-1">
                            <span>{player.minutesPlayed}m</span>
                            <Clock className="w-3 h-3 opacity-0 group-hover/min:opacity-100 text-emerald-600" />
                          </div>
                          <div className="text-[10px] text-slate-400">
                            of {totalPossible}m max
                          </div>
                        </button>
                      </td>

                      {/* Play Time Percentage with Progress Bar */}
                      <td className="py-3 px-4 text-center whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className={pctStyle.text}>{playPct}%</span>
                          <span className="text-[10px] text-slate-400 font-mono-tabular font-normal">
                            ({player.minutesPlayed}/{totalPossible})
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full ${pctStyle.barColor} transition-all duration-300`}
                            style={{ width: `${playPct}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Goals */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white font-mono-tabular">
                        {player.goals}
                      </td>

                      {/* Assists */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white font-mono-tabular">
                        {player.assists}
                      </td>

                      {/* Goal Involvements (G+A) */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-mono-tabular">
                          {goalInvolvements}
                        </span>
                      </td>

                      {/* Goal Involvement Target Column */}
                      <td className="py-3 px-4 text-center whitespace-nowrap min-w-[130px]">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTargetPlayer(player);
                            setNewTargetValue(player.goalInvolvementTarget ?? 10);
                          }}
                          className="group/tgt inline-flex flex-col items-center p-1.5 rounded-lg hover:bg-amber-50/80 dark:hover:bg-amber-950/40 transition-all cursor-pointer w-full text-center"
                          title={language === 'he' ? 'לחץ לעדכון יעד מעורבות בשערים' : 'Click to set or edit Goal Involvement Target'}
                        >
                          {targetProgress.hasTarget ? (
                            <div className="w-full space-y-1">
                              <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                                <span className="font-mono-tabular text-slate-800 dark:text-slate-200 group-hover/tgt:text-amber-600 flex items-center gap-1">
                                  <Target className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>{goalInvolvements} / {player.goalInvolvementTarget}</span>
                                </span>
                                <span className={`font-mono-tabular text-[10px] px-1.5 py-0.2 rounded-full border ${targetStyle.badgeBg} ${targetStyle.badgeText} ${targetStyle.badgeBorder}`}>
                                  {targetProgress.isReached ? '🎯' : `${targetProgress.percentage}%`}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full ${targetStyle.barColor} transition-all duration-300`}
                                  style={{ width: `${Math.min(targetProgress.percentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-dashed border-amber-300 dark:border-amber-800">
                              <Target className="w-3 h-3" />
                              <span>+ {t.setTarget}</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* QUICK ACTIONS BUTTONS */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* +1 Goal Button */}
                          <button
                            onClick={() => onQuickAddGoal(player.id)}
                            className="px-2 py-1 text-xs font-bold rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                            title="Add 1 Goal"
                          >
                            +1 G
                          </button>

                          {/* +1 Assist Button */}
                          <button
                            onClick={() => onQuickAddAssist(player.id)}
                            className="px-2 py-1 text-xs font-bold rounded bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors"
                            title="Add 1 Assist"
                          >
                            +1 A
                          </button>

                          {/* +Minutes Dropdown Popover */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setOpenMinutesMenuId(isMenuOpen ? null : player.id)}
                              className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                              title="Add Minutes"
                            >
                              <span>+Mins</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 rtl:right-auto rtl:left-0 z-30 mt-1 w-44 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 text-xs text-left rtl:text-right space-y-1 animate-in fade-in zoom-in-95">
                                <button
                                  onClick={() => {
                                    onQuickAddMinutes(player.id, duration);
                                    setOpenMinutesMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-between"
                                >
                                  <span>Full Game</span>
                                  <span className="font-mono-tabular text-emerald-600 font-bold">+{duration}m</span>
                                </button>

                                <button
                                  onClick={() => {
                                    onQuickAddMinutes(player.id, 45);
                                    setOpenMinutesMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                                >
                                  <span>Half Match</span>
                                  <span className="font-mono-tabular text-sky-600 font-bold">+45m</span>
                                </button>

                                <button
                                  onClick={() => {
                                    onQuickAddMinutes(player.id, 20);
                                    setOpenMinutesMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                                >
                                  <span>Substitution</span>
                                  <span className="font-mono-tabular text-slate-500 font-bold">+20m</span>
                                </button>

                                <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>

                                <button
                                  onClick={() => {
                                    onOpenManualMinutes(player);
                                    setOpenMinutesMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between"
                                >
                                  <span>✏️ {language === 'he' ? 'הזן דקות ידנית...' : 'Enter Manually...'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Edit and Delete Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditPlayer(player)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title={t.editPlayer}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRequestDeletePlayer(player)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors"
                            title={t.deletePlayer}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlayers.map(player => {
            const duration = getGameDurationMinutes(player.category);
            const totalPossible = getTotalPossibleMinutes(player.matchesEligible, player.category, player.minutesPlayed);
            const playPct = calculatePlayTimePercentage(player.minutesPlayed, player.matchesEligible, player.category);
            const pctStyle = getPercentageColor(playPct);
            const goalInvolvements = calculateGoalInvolvements(player.goals, player.assists);
            const targetProgress = calculateTargetProgress(player.goals, player.assists, player.goalInvolvementTarget);
            const targetStyle = getTargetProgressColor(targetProgress);

            return (
              <div
                key={player.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Category & Gender Tags */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getTrackerCategoryBadgeColor(player.category)}`}>
                        {player.category === 'Womans' ? "Woman's" : player.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {duration}m game
                      </span>
                    </div>

                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      player.gender === 'Female' 
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' 
                        : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                    }`}>
                      {player.gender === 'Female' ? '👩 Female' : '👦 Male'}
                    </span>
                  </div>

                  {/* Player Identity */}
                  <div className="flex items-start gap-3 mb-4">
                    {player.photoUrl ? (
                      <img 
                        src={player.photoUrl} 
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-lg shrink-0">
                        {player.gender === 'Female' ? '👩' : '👦'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {player.name}
                        {player.jerseyNumber && (
                          <span className="text-slate-400 font-normal text-xs ml-1">#{player.jerseyNumber}</span>
                        )}
                      </h3>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {player.clubName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {player.position} · {player.age} yrs
                      </div>
                    </div>
                  </div>

                  {/* Play Time Percentage Highlight Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Play Time %</span>
                      <span className={`font-mono-tabular font-extrabold text-sm ${pctStyle.text}`}>
                        {playPct}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full ${pctStyle.barColor} transition-all duration-300`}
                        style={{ width: `${playPct}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-tabular pt-1">
                      <span>{player.minutesPlayed} mins played</span>
                      <span>{totalPossible} mins max ({player.matchesEligible} × {duration}m)</span>
                    </div>
                  </div>

                  {/* 3 Key Stats Counters: Appearances, Goals, Assists, Involvements */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Games</span>
                      <span className="text-sm font-bold font-mono-tabular text-slate-900 dark:text-white">
                        {player.matchesPlayed}/{player.matchesEligible}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Goals & Ast</span>
                      <span className="text-sm font-bold font-mono-tabular text-slate-900 dark:text-white">
                        {player.goals}G · {player.assists}A
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                      <span className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-400 block">G+A Total</span>
                      <span className="text-sm font-extrabold font-mono-tabular text-amber-800 dark:text-amber-300">
                        {goalInvolvements}
                      </span>
                    </div>
                  </div>

                  {/* Goal Involvement Target Progress Card Block */}
                  <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                        <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{t.goalInvolvementTarget}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTargetPlayer(player);
                          setNewTargetValue(player.goalInvolvementTarget ?? 10);
                        }}
                        className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit className="w-2.5 h-2.5" />
                        <span>{player.goalInvolvementTarget ? t.editTarget : `+ ${t.setTarget}`}</span>
                      </button>
                    </div>

                    {targetProgress.hasTarget ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono-tabular">
                          <span className="text-slate-800 dark:text-slate-200 font-bold">
                            {goalInvolvements} / {player.goalInvolvementTarget} <span className="text-[10px] text-slate-400 font-normal">({player.goals}G + {player.assists}A)</span>
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${targetStyle.badgeBg} ${targetStyle.badgeText} ${targetStyle.badgeBorder}`}>
                            {targetProgress.isReached ? t.targetReached : `${targetProgress.remaining} ${t.remainingToTarget}`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full ${targetStyle.barColor} transition-all duration-300`}
                            style={{ width: `${Math.min(targetProgress.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">{t.noTargetSet}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTargetPlayer(player);
                            setNewTargetValue(10);
                          }}
                          className="text-xs font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40"
                        >
                          + {t.setTarget}
                        </button>
                      </div>
                    )}
                  </div>

                  {player.notes && (
                    <p className="text-xs text-slate-500 italic line-clamp-2 mb-3">
                      "{player.notes}"
                    </p>
                  )}
                </div>

                {/* Card Quick Actions Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onQuickAddGoal(player.id)}
                      className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      title="Add 1 Goal"
                    >
                      +1 Goal
                    </button>
                    <button
                      onClick={() => onQuickAddAssist(player.id)}
                      className="px-2.5 py-1 text-xs font-bold rounded bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                      title="Add 1 Assist"
                    >
                      +1 Assist
                    </button>
                    <button
                      onClick={() => onQuickAddMinutes(player.id, duration)}
                      className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      title={`Add Full Game (+${duration}m)`}
                    >
                      +{duration}m
                    </button>
                    <button
                      onClick={() => onOpenManualMinutes(player)}
                      className="px-2 py-1 text-xs font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                      title="Add or Edit Playing Time Manually"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{language === 'he' ? 'דקות ידניות' : 'Manual Mins'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditPlayer(player)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title={t.editPlayer}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRequestDeletePlayer(player)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md"
                      title={t.deletePlayer}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Quick Goal Involvement Target Modal */}
      {editingTargetPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-600 text-white">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.goalInvolvementTarget}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingTargetPlayer.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTargetPlayer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.manualTargetHelp}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Current G+A:</span>
              <strong className="font-mono-tabular text-amber-600 dark:text-amber-400 text-sm">
                {calculateGoalInvolvements(editingTargetPlayer.goals, editingTargetPlayer.assists)} ({editingTargetPlayer.goals}G + {editingTargetPlayer.assists}A)
              </strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Set Target Number (Goals + Assists):
              </label>

              <div className="flex items-center gap-2 mb-2">
                {[5, 10, 15, 20, 25].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNewTargetValue(val)}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${
                      newTargetValue === val
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="0"
                value={newTargetValue}
                onChange={e => setNewTargetValue(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-center text-lg font-extrabold font-mono-tabular rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingTargetPlayer(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateTarget) {
                    onUpdateTarget(editingTargetPlayer.id, newTargetValue);
                  }
                  setEditingTargetPlayer(null);
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Target</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

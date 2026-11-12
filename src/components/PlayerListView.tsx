import React, { useState, useMemo } from 'react';
import { Player, PlayerPosition, PlayerStatus, YouthCategory, Language, Currency } from '../types/player';
import { 
  getContractDaysRemaining, 
  getContractUrgency, 
  getUrgencyBadgeConfig, 
  formatDatePretty 
} from '../utils/contractAlerts';
import { 
  TRANSLATIONS, 
  POSITION_TRANSLATIONS, 
  STATUS_TRANSLATIONS, 
  getYouthBadgeColor,
  YOUTH_CATEGORY_LABELS 
} from '../translations/translations';
import { convertMarketValueString } from '../utils/currency';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Download, 
  LayoutGrid, 
  List, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Check, 
  Clock, 
  Sparkles,
  Shield,
  ArrowUpDown,
  Tag
} from 'lucide-react';

interface PlayerListViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onEditPlayer: (player: Player) => void;
  onRequestDeletePlayer: (player: Player) => void;
  onRequestDeleteMultiple: (playerIds: string[]) => void;
  onQuickExtend: (player: Player) => void;
  onOpenAddPlayer: () => void;
  onUpdateYouthCategory: (playerId: string, category: YouthCategory) => void;
  language: Language;
  currency?: Currency;
}

export const PlayerListView: React.FC<PlayerListViewProps> = ({
  players,
  onSelectPlayer,
  onEditPlayer,
  onRequestDeletePlayer,
  onRequestDeleteMultiple,
  onQuickExtend,
  onOpenAddPlayer,
  onUpdateYouthCategory,
  language,
  currency = 'EUR'
}) => {
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [youthFilter, setYouthFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'age'>('expiry');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selected player IDs for easy bulk deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtered & sorted players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        player.name.toLowerCase().includes(q) ||
        player.clubName.toLowerCase().includes(q) ||
        player.nationality.toLowerCase().includes(q) ||
        player.position.toLowerCase().includes(q);

      // Position filter
      const matchesPosition = positionFilter === 'ALL' || player.position.includes(positionFilter);

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || player.status === statusFilter;

      // Youth Category Filter (U15, U17, U19, Senior)
      const matchesYouth = youthFilter === 'ALL' || (player.youthCategory || 'Senior') === youthFilter;

      // Urgency filter
      const urgency = getContractUrgency(player.contractExpiryDate);
      let matchesUrgency = true;
      if (urgencyFilter === 'CRITICAL_1_MONTH') {
        matchesUrgency = urgency === 'CRITICAL_1_MONTH';
      } else if (urgencyFilter === 'APPROACHING_3_MONTHS') {
        matchesUrgency = urgency === 'APPROACHING_3_MONTHS';
      } else if (urgencyFilter === 'EXPIRED') {
        matchesUrgency = urgency === 'EXPIRED';
      } else if (urgencyFilter === 'HEALTHY') {
        matchesUrgency = urgency === 'HEALTHY';
      }

      return matchesSearch && matchesPosition && matchesStatus && matchesYouth && matchesUrgency;
    }).sort((a, b) => {
      if (sortBy === 'expiry') {
        const daysA = getContractDaysRemaining(a.contractExpiryDate);
        const daysB = getContractDaysRemaining(b.contractExpiryDate);
        return sortOrder === 'asc' ? daysA - daysB : daysB - daysA;
      }
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'age') {
        return sortOrder === 'asc' ? a.age - b.age : b.age - a.age;
      }
      return 0;
    });
  }, [players, searchQuery, positionFilter, statusFilter, youthFilter, urgencyFilter, sortBy, sortOrder]);

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

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Age Category', 'Age', 'Nationality', 'Club', 'League', 'Position', 'Status', 'Contract Expiry', 'Days Remaining', 'Market Value', 'Agency Fee %'];
    const rows = filteredPlayers.map(p => [
      p.id,
      `"${p.name}"`,
      p.youthCategory || 'Senior',
      p.age,
      `"${p.nationality}"`,
      `"${p.clubName}"`,
      `"${p.league}"`,
      `"${p.position}"`,
      p.status,
      p.contractExpiryDate,
      getContractDaysRemaining(p.contractExpiryDate),
      `"${convertMarketValueString(p.marketValue, currency)}"`,
      `${p.agencyFeePct}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AURA_Agency_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const criticalCount = players.filter(p => getContractUrgency(p.contractExpiryDate) === 'CRITICAL_1_MONTH').length;

  return (
    <div className="space-y-5">

      {/* Top Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.rosterTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {players.length} {t.rosterSubtitle} · {criticalCount} {t.contracts1MonthPriority}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Easy Bulk Delete Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => onRequestDeleteMultiple(selectedIds)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteSelected} ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>

          <button
            onClick={onOpenAddPlayer}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addPlayer}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Youth Age Category Filter (U15, U17, U19, Senior) */}
          <div>
            <select
              value={youthFilter}
              onChange={e => setYouthFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">{t.allAges}</option>
              <option value="Senior">{t.senior}</option>
              <option value="U19">{t.u19}</option>
              <option value="U17">{t.u17}</option>
              <option value="U15">{t.u15}</option>
            </select>
          </div>

          {/* Position Selector */}
          <div>
            <select
              value={positionFilter}
              onChange={e => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            >
              <option value="ALL">{t.allPositions}</option>
              <option value="Goalkeeper">{language === 'he' ? 'שוערת (GK)' : 'Goalkeepers (GK)'}</option>
              <option value="Back">{language === 'he' ? 'בלמות ומגנות' : 'Defenders (CB / LB / RB)'}</option>
              <option value="Midfield">{language === 'he' ? 'קשריות' : 'Midfielders (CDM / CM / CAM)'}</option>
              <option value="Winger">{language === 'he' ? 'שחקניות כנף' : 'Wingers (LW / RW)'}</option>
              <option value="Striker">{language === 'he' ? 'חלוצות' : 'Strikers (ST)'}</option>
            </select>
          </div>

          {/* Expiration Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value)}
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium ${
                urgencyFilter === 'CRITICAL_1_MONTH' 
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300' 
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
              }`}
            >
              <option value="ALL">{t.allContractExpiries}</option>
              <option value="CRITICAL_1_MONTH">{t.critical1MonthOption} ({criticalCount})</option>
              <option value="APPROACHING_3_MONTHS">{t.approaching90dOption}</option>
              <option value="EXPIRED">{t.expiredOption}</option>
              <option value="HEALTHY">{t.healthyOption}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            >
              <option value="ALL">{t.allStatuses}</option>
              <option value="Active">{t.active}</option>
              <option value="Injured">{t.injured}</option>
              <option value="On Loan">{t.onLoan}</option>
              <option value="Pending Renewal">{t.pendingRenewal}</option>
              <option value="Negotiating">{t.negotiating}</option>
              <option value="Free Agent">{t.freeAgent}</option>
            </select>
          </div>

        </div>

        {/* Sub-bar: Active filters tags and View Mode Switch */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              {t.showingCount} <strong className="text-slate-800 dark:text-white font-mono-tabular">{filteredPlayers.length}</strong> {t.ofCount} {players.length} {t.playersLabel}
            </span>
            {urgencyFilter === 'CRITICAL_1_MONTH' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                {t.critical1MonthOption}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs">{t.sortBy}</span>
            <button
              onClick={() => {
                if (sortBy === 'expiry') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('expiry'); setSortOrder('asc'); }
              }}
              className={`px-2 py-1 rounded text-xs transition-colors ${sortBy === 'expiry' ? 'bg-slate-200 dark:bg-slate-700 font-semibold text-slate-900 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {t.sortExpiry} {sortBy === 'expiry' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <button
              onClick={() => {
                if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('name'); setSortOrder('asc'); }
              }}
              className={`px-2 py-1 rounded text-xs transition-colors ${sortBy === 'name' ? 'bg-slate-200 dark:bg-slate-700 font-semibold text-slate-900 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {t.sortName} {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* View Mode */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
              <button
                onClick={() => setViewMode('table')}
                aria-label={t.tableView}
                className={`p-1 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-label={t.gridView}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {filteredPlayers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            No players match the criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search query, age category filter, or urgency threshold.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setPositionFilter('ALL');
              setStatusFilter('ALL');
              setYouthFilter('ALL');
              setUrgencyFilter('ALL');
            }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW WITH EASY BULK CHECKBOXES & QUICK DELETE */
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
                      title="Select all"
                    />
                  </th>
                  <th className="py-3 px-4">{t.thPlayer}</th>
                  <th className="py-3 px-3">{t.thCategory}</th>
                  <th className="py-3 px-4">{t.thClub}</th>
                  <th className="py-3 px-4">{t.thPosition}</th>
                  <th className="py-3 px-4">{t.thContractExpiry}</th>
                  <th className="py-3 px-4">{t.thStatus}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t.thMarketValue}</th>
                  <th className="py-3 px-4 text-center">{t.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredPlayers.map(player => {
                  const days = getContractDaysRemaining(player.contractExpiryDate);
                  const urgency = getContractUrgency(player.contractExpiryDate);
                  const badge = getUrgencyBadgeConfig(urgency, days);
                  const is1MonthAlert = urgency === 'CRITICAL_1_MONTH';
                  const isSelected = selectedIds.includes(player.id);
                  const youthCat = player.youthCategory || 'Senior';

                  return (
                    <tr 
                      key={player.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : is1MonthAlert ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Checkbox for easy selection */}
                      <td className="py-3 px-3">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(player.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Player info */}
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
                              {player.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <button
                              onClick={() => onSelectPlayer(player)}
                              className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-left rtl:text-right block"
                            >
                              {player.name}
                            </button>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{player.age} {language === 'he' ? 'שנים' : 'yrs'}</span>
                              <span>·</span>
                              <span>{player.nationality}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Youth Category Badge (U15, U17, U19, Senior) with quick click toggle */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={youthCat}
                          onChange={e => onUpdateYouthCategory(player.id, e.target.value as YouthCategory)}
                          className={`text-xs font-bold px-2 py-0.5 rounded-md border cursor-pointer focus:ring-1 focus:ring-emerald-500 ${getYouthBadgeColor(youthCat)}`}
                          title="Click to change age category (U15, U17, U19, Senior)"
                        >
                          <option value="Senior">Senior</option>
                          <option value="U19">U19</option>
                          <option value="U17">U17</option>
                          <option value="U15">U15</option>
                        </select>
                      </td>

                      {/* Club & League */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">
                          {player.clubName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {player.league}
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {POSITION_TRANSLATIONS[language][player.position] || player.position}
                        </span>
                        {player.jerseyNumber > 0 && (
                          <span className="text-slate-400 text-xs ml-1 font-mono-tabular">
                            #{player.jerseyNumber}
                          </span>
                        )}
                      </td>

                      {/* Contract Expiration with 1-Month Alert */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start rtl:items-end gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${badge.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}></span>
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular">
                            {formatDatePretty(player.contractExpiryDate)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          player.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                            : player.status === 'Injured'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            : player.status === 'Pending Renewal' || player.status === 'Negotiating'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {STATUS_TRANSLATIONS[language][player.status] || player.status}
                        </span>
                      </td>

                      {/* Market Value */}
                      <td className="py-3 px-4 text-right rtl:text-left font-mono-tabular font-bold text-slate-900 dark:text-white">
                        {convertMarketValueString(player.marketValue, currency)}
                      </td>

                      {/* Actions: View, Extend, Edit, Easy Delete */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectPlayer(player)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title={t.viewDossier}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onQuickExtend(player)}
                            className="px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-md transition-colors"
                            title="Extend Contract"
                          >
                            {t.extend}
                          </button>

                          <button
                            onClick={() => onEditPlayer(player)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title={t.editPlayer}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Easy 1-click Delete Button with dedicated confirmation modal */}
                          <button
                            onClick={() => onRequestDeletePlayer(player)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                            title={t.deletePlayer}
                          >
                            <Trash2 className="w-4 h-4" />
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
            const days = getContractDaysRemaining(player.contractExpiryDate);
            const urgency = getContractUrgency(player.contractExpiryDate);
            const badge = getUrgencyBadgeConfig(urgency, days);
            const is1MonthAlert = urgency === 'CRITICAL_1_MONTH';
            const youthCat = player.youthCategory || 'Senior';

            return (
              <div 
                key={player.id}
                className={`rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                  is1MonthAlert 
                    ? 'border-amber-300 dark:border-amber-800/70 bg-amber-50/20' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Bar with Status, Youth Category & Expiry */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        player.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {STATUS_TRANSLATIONS[language][player.status] || player.status}
                      </span>

                      {/* Youth Category tag (U15, U17, U19) */}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getYouthBadgeColor(youthCat)}`}>
                        {youthCat}
                      </span>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${badge.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}></span>
                      <span>{badge.shortLabel}</span>
                    </div>
                  </div>

                  {/* Player header */}
                  <div className="flex items-start gap-3.5 mb-3">
                    {player.photoUrl ? (
                      <img 
                        src={player.photoUrl} 
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold flex items-center justify-center text-base border border-emerald-200 dark:border-emerald-800 shrink-0">
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 
                        onClick={() => onSelectPlayer(player)}
                        className="font-bold text-base text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer truncate"
                      >
                        {player.name}
                      </h3>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        {player.clubName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {POSITION_TRANSLATIONS[language][player.position] || player.position} · {player.age} {language === 'he' ? 'שנים' : 'yrs'} · {player.nationality}
                      </div>
                    </div>
                  </div>

                  {/* Contract Details Box */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>{t.thContractExpiry}:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono-tabular">
                        {formatDatePretty(player.contractExpiryDate)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>{t.thMarketValue}:</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                        {convertMarketValueString(player.marketValue, currency)}
                      </strong>
                    </div>
                  </div>

                  {player.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic mb-3">
                      "{player.notes}"
                    </p>
                  )}
                </div>

                {/* Card Action Buttons with Easy Delete */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectPlayer(player)}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-center transition-colors"
                  >
                    {t.viewDossier}
                  </button>

                  <button
                    onClick={() => onQuickExtend(player)}
                    className="py-1.5 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {t.extend}
                  </button>

                  <button
                    onClick={() => onEditPlayer(player)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title={t.editPlayer}
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Easy Delete Icon */}
                  <button
                    onClick={() => onRequestDeletePlayer(player)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                    title={t.deletePlayer}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

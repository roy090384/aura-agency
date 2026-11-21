import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Player,
  Language,
  NextMatchInfo
} from '../types/player';
import {
  CalendarClock,
  RefreshCw,
  Users,
  ExternalLink,
  X,
  Search,
  Check,
  MapPin,
  Trophy,
  Globe,
  Clock,
  Plus,
  Home,
  Plane
} from 'lucide-react';

interface RosterOption {
  key: string; // `${rosterType}:${player.id}`
  player: Player;
  rosterType: 'female' | 'male';
}

interface NextMatchWindowProps {
  players: Player[];
  malePlayers: Player[];
  scope: 'all' | 'female' | 'male';
  watchedKeys: string[];
  onChangeWatchedKeys: (keys: string[]) => void;
  onSelectPlayer: (player: Player, rosterType: 'female' | 'male') => void;
  language: Language;
}

const MATCH_CACHE_STORAGE_KEY = 'aura_next_match_cache_v1';
const CLIENT_CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_WATCHED_PLAYERS = 24;

function loadCachedMatches(): Record<string, NextMatchInfo> {
  try {
    const raw = localStorage.getItem(MATCH_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function saveCachedMatches(cache: Record<string, NextMatchInfo>) {
  try {
    localStorage.setItem(MATCH_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

function getRelativeCountdown(kickoffIso: string, isHe: boolean): { label: string; urgent: boolean } {
  const ts = Date.parse(kickoffIso);
  if (Number.isNaN(ts)) return { label: '', urgent: false };

  const now = Date.now();
  const diffMs = ts - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0 && diffMs > -3 * 60 * 60 * 1000) {
    return { label: isHe ? 'מתחיל עכשיו / חי' : 'Matchday Live', urgent: true };
  }
  if (diffHours < 24) {
    const h = Math.max(1, diffHours);
    return { label: isHe ? `בעוד ${h} שעות` : `In ${h}h`, urgent: true };
  }
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return { label: isHe ? 'מחר' : 'Tomorrow', urgent: true };
  }
  return {
    label: isHe ? `בעוד ${diffDays} ימים` : `In ${diffDays}d`,
    urgent: diffDays <= 3
  };
}

function formatKickoffDateTime(kickoffIso: string, language: Language): string {
  const d = new Date(kickoffIso);
  if (Number.isNaN(d.getTime())) return kickoffIso;
  const locale = language === 'he' ? 'he-IL' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export const NextMatchWindow: React.FC<NextMatchWindowProps> = ({
  players,
  malePlayers,
  scope,
  watchedKeys,
  onChangeWatchedKeys,
  onSelectPlayer,
  language
}) => {
  const isHe = language === 'he';

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTab, setPickerTab] = useState<'all' | 'female' | 'male'>('all');
  const [matchMap, setMatchMap] = useState<Record<string, NextMatchInfo>>(() => loadCachedMatches());
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const initialFetchDoneRef = useRef<Set<string>>(new Set());

  // Build combined roster index
  const allRosterOptions = useMemo<RosterOption[]>(() => {
    const f = players.map(player => ({
      key: `female:${player.id}`,
      player,
      rosterType: 'female' as const
    }));
    const m = malePlayers.map(player => ({
      key: `male:${player.id}`,
      player,
      rosterType: 'male' as const
    }));
    return [...f, ...m];
  }, [players, malePlayers]);

  const rosterLookup = useMemo(() => {
    const map = new Map<string, RosterOption>();
    for (const item of allRosterOptions) {
      map.set(item.key, item);
    }
    return map;
  }, [allRosterOptions]);

  const selectedItems = useMemo(() => {
    return watchedKeys
      .map(k => rosterLookup.get(k))
      .filter((x): x is RosterOption => Boolean(x));
  }, [watchedKeys, rosterLookup]);

  const visibleSelectedItems = useMemo(() => {
    const filtered = selectedItems.filter(item => scope === 'all' || item.rosterType === scope);
    // Sort by kickoff date ascending; found matches before not_found
    return [...filtered].sort((a, b) => {
      const ma = matchMap[a.key];
      const mb = matchMap[b.key];
      const ta = ma?.status === 'found' && ma.kickoffIso ? Date.parse(ma.kickoffIso) : Number.POSITIVE_INFINITY;
      const tb = mb?.status === 'found' && mb.kickoffIso ? Date.parse(mb.kickoffIso) : Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return a.player.name.localeCompare(b.player.name);
    });
  }, [selectedItems, scope, matchMap]);

  const fetchMatchesForItems = useCallback(
    async (itemsToFetch: RosterOption[], forceRefresh = false) => {
      if (itemsToFetch.length === 0) return;

      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch('/api/next-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            forceRefresh,
            players: itemsToFetch.map(item => ({
              key: item.key,
              playerId: item.player.id,
              rosterType: item.rosterType,
              playerName: item.player.name,
              clubName: item.player.clubName,
              league: item.player.league,
              youthCategory: item.player.youthCategory || 'Senior',
              nationality: item.player.nationality
            }))
          })
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const results: NextMatchInfo[] = Array.isArray(data?.results) ? data.results : [];

        setMatchMap(prev => {
          const next = { ...prev };
          for (const r of results) {
            if (r?.key) {
              next[r.key] = r;
            }
          }
          saveCachedMatches(next);
          return next;
        });
        setLastSyncedAt(data?.fetchedAt || new Date().toISOString());
      } catch (err) {
        console.error('Failed to fetch next matches:', err);
        setFetchError(
          isHe
            ? 'לא ניתן היה לעדכן משחקים מאתרי הספורט כרגע.'
            : 'Could not reach sports schedule lookup service right now.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isHe]
  );

  // Auto-fetch stale or missing fixtures when selected players change
  useEffect(() => {
    const now = Date.now();
    const needsFetch = selectedItems.filter(item => {
      const cached = matchMap[item.key];
      if (!cached) {
        if (initialFetchDoneRef.current.has(item.key)) return false;
        initialFetchDoneRef.current.add(item.key);
        return true;
      }
      const fetchedTs = Date.parse(cached.fetchedAt || '');
      const isStale = Number.isNaN(fetchedTs) || now - fetchedTs > CLIENT_CACHE_TTL_MS;
      const isPastKickoff =
        cached.status === 'found' &&
        cached.kickoffIso &&
        Date.parse(cached.kickoffIso) < now - 3 * 60 * 60 * 1000;
      if ((isStale || isPastKickoff) && !initialFetchDoneRef.current.has(`${item.key}:refresh`)) {
        initialFetchDoneRef.current.add(`${item.key}:refresh`);
        return true;
      }
      return false;
    });

    if (needsFetch.length > 0) {
      fetchMatchesForItems(needsFetch, false);
    }
  }, [selectedItems, matchMap, fetchMatchesForItems]);

  const handleTogglePlayer = (key: string) => {
    if (watchedKeys.includes(key)) {
      onChangeWatchedKeys(watchedKeys.filter(k => k !== key));
    } else {
      if (watchedKeys.length >= MAX_WATCHED_PLAYERS) return;
      onChangeWatchedKeys([...watchedKeys, key]);
    }
  };

  const pickerFilteredOptions = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return allRosterOptions.filter(item => {
      if (pickerTab !== 'all' && item.rosterType !== pickerTab) return false;
      if (!q) return true;
      return (
        item.player.name.toLowerCase().includes(q) ||
        item.player.clubName.toLowerCase().includes(q) ||
        (item.player.league || '').toLowerCase().includes(q)
      );
    });
  }, [allRosterOptions, pickerSearch, pickerTab]);

  const hiddenCount = selectedItems.length - visibleSelectedItems.length;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-gold-500 to-blue-500" />

      {/* Window Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isHe ? 'חלון המשחק הקרוב (גברים ונשים)' : 'Next Match Center'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                {selectedItems.length} {isHe ? 'נבחרו' : 'selected'}
              </span>
              {hiddenCount > 0 && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ({hiddenCount} {isHe ? 'מוסתרים בסינון הנוכחי' : 'in other division'})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isHe
                ? 'מעודכן מאתרי ספורט (FotMob, TheSportsDB וחיפוש משחקים ברשת) עבור שחקנים ושחקניות נבחרים'
                : 'Choose Male & Female players to track their upcoming fixtures updated from live sports websites'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {lastSyncedAt && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums hidden md:inline">
              {isHe ? 'עודכן:' : 'Updated'}{' '}
              {new Date(lastSyncedAt).toLocaleTimeString(isHe ? 'he-IL' : 'en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}

          {selectedItems.length > 0 && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fetchMatchesForItems(selectedItems, true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? (isHe ? 'מעדכן...' : 'Syncing...') : (isHe ? 'רענן מאתרי ספורט' : 'Refresh from Sports Sites')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPickerTab(scope === 'all' ? 'all' : scope);
              setIsPickerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-gold-600 hover:bg-gold-700 text-white transition-colors whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isHe ? 'בחר שחקנים / שחקניות' : 'Choose Players'}</span>
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={() => setFetchError(null)}
            className="text-amber-700 dark:text-amber-300 hover:underline font-semibold"
          >
            {isHe ? 'סגור' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Body Content */}
      <div className="p-5">
        {selectedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 p-8 text-center space-y-3">
            <div className="w-11 h-11 rounded-full bg-gold-100 dark:bg-gold-950/60 border border-gold-300/70 dark:border-gold-700/60 flex items-center justify-center mx-auto">
              <CalendarClock className="w-5 h-5 text-gold-700 dark:text-gold-400" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isHe ? 'לא נבחרו עדיין שחקנים או שחקניות למעקב משחקים' : 'No players selected for Next Match tracking yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHe
                  ? 'בחרו שחקנים מהסגל הנשים והגברים כדי לראות כאן את המשחק הבא שלהם, מועד הפתיחה, יריבה וקישור ישיר לאתר הספורט.'
                  : 'Pick Male and Female athletes from your rosters to monitor their next kickoff time, opponent, competition, and live sports website links right here.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-gold-600 hover:bg-gold-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHe ? 'בחר שחקנים (גברים ונשים)' : 'Select Male & Female Players'}</span>
            </button>
          </div>
        ) : visibleSelectedItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {isHe
              ? 'כל השחקנים שנבחרו שייכים לחטיבה השנייה. העבר את הסינון למעלה ל"הכל" או בחר שחקנים נוספים.'
              : 'Your selected players belong to the other division filter. Switch Dashboard filter to "All" or select players here.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleSelectedItems.map(item => {
              const { player, rosterType, key } = item;
              const match = matchMap[key];
              const isFemale = rosterType === 'female';
              const countdown =
                match?.status === 'found' && match.kickoffIso
                  ? getRelativeCountdown(match.kickoffIso, isHe)
                  : null;

              return (
                <div
                  key={key}
                  className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-gold-400/60 dark:hover:border-gold-500/40 transition-all flex flex-col justify-between"
                >
                  {/* Top Division Strip */}
                  <div
                    className={`h-1 w-full bg-gradient-to-r ${
                      isFemale ? 'from-rose-500 to-pink-500' : 'from-blue-500 to-indigo-500'
                    }`}
                  />

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Player Header Row */}
                    <div className="flex items-start justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectPlayer(player, rosterType)}
                        className="flex items-center gap-2.5 min-w-0 text-left rtl:text-right group"
                      >
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className={`w-10 h-10 rounded-full object-cover shrink-0 border-2 ${
                              isFemale ? 'border-rose-400/60' : 'border-blue-400/60'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                              isFemale ? 'bg-rose-600' : 'bg-blue-600'
                            }`}
                          >
                            {player.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 truncate transition-colors">
                            {player.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            <span
                              className={`font-bold ${
                                isFemale ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {isFemale ? (isHe ? 'נשים' : 'Female') : isHe ? 'גברים' : 'Male'}
                            </span>
                            {player.youthCategory && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">{player.youthCategory}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                              {player.clubName}
                            </span>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        title={isHe ? 'הסר מהחלון' : 'Remove from Next Match window'}
                        onClick={() => handleTogglePlayer(key)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Fixture Content */}
                    {!match && isLoading ? (
                      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>{isHe ? 'מחפש משחק קרוב באתרי ספורט...' : 'Checking live sports websites...'}</span>
                      </div>
                    ) : match?.status === 'found' ? (
                      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 space-y-2.5">
                        {/* Competition & Countdown */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                            <Trophy className="w-3 h-3 text-gold-600 dark:text-gold-400 shrink-0" />
                            <span className="truncate">{match.competition || player.league || (isHe ? 'ליגה רשמית' : 'Official Fixture')}</span>
                          </span>
                          {countdown?.label && (
                            <span
                              className={`text-[11px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                countdown.urgent
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {countdown.label}
                            </span>
                          )}
                        </div>

                        {/* Opponent / Home-Away */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white truncate">
                              {match.isHome === true ? (
                                <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : match.isHome === false ? (
                                <Plane className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                              ) : null}
                              <span className="truncate">
                                {match.isHome === true
                                  ? `vs ${match.opponent}`
                                  : match.isHome === false
                                  ? `@ ${match.opponent}`
                                  : match.homeTeam && match.awayTeam
                                  ? `${match.homeTeam} vs ${match.awayTeam}`
                                  : match.opponent}
                              </span>
                            </div>
                            {match.homeTeam && match.awayTeam && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {match.homeTeam} — {match.awayTeam}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Kickoff Time & Venue */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          {match.kickoffIso && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                              <span>{formatKickoffDateTime(match.kickoffIso, language)}</span>
                            </span>
                          )}
                          {match.venue && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{match.venue}</span>
                            </span>
                          )}
                        </div>

                        {match.teamScopeNote && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30 px-2 py-1 rounded">
                            {match.teamScopeNote}
                          </p>
                        )}

                        {/* Live Source Link */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 truncate">
                            <Globe className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate">
                              {isHe ? 'מקור:' : 'Source:'} {match.sourceName || 'Sports Web'}
                            </span>
                          </span>
                          {match.sourceUrl && (
                            <a
                              href={match.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                            >
                              <span>{isHe ? 'צפה במשחק' : 'View Fixture'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {isHe
                            ? 'לא פורסם עדיין משחק עתידי מאומת במקורות הספורט האוטומטיים (ייתכן ליגת נוער מקומית או פגרה).'
                            : 'No upcoming match published yet on automated feeds for this squad. Check live sports sites directly:'}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(match?.lookupLinks || [
                            { label: 'FotMob', url: `https://www.fotmob.com/search?q=${encodeURIComponent(player.clubName)}` },
                            { label: 'Flashscore', url: `https://www.flashscore.com/?s=${encodeURIComponent(player.clubName)}` }
                          ]).map(link => (
                            <a
                              key={link.label}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gold-50 hover:text-gold-700 dark:hover:bg-gold-950/50 dark:hover:text-gold-300 transition-colors"
                            >
                              <span>{link.label}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Male & Female Player Selector Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHe ? 'בחר שחקנים ושחקניות ללוח המשחק הקרוב' : 'Choose Players for Next Match Window'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHe
                    ? `נבחרו ${watchedKeys.length} מתוך ${MAX_WATCHED_PLAYERS} מקסימום`
                    : `${watchedKeys.length} of ${MAX_WATCHED_PLAYERS} max selected across Female & Male rosters`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Division Filter */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-800/30">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  placeholder={isHe ? 'חפש שם שחקן/ית, מועדון או ליגה...' : 'Search player name, club, or league...'}
                  className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-gold-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {(
                    [
                      { id: 'all', label: isHe ? 'הכל' : 'All', count: allRosterOptions.length },
                      { id: 'female', label: isHe ? 'נשים' : 'Female', count: players.length },
                      { id: 'male', label: isHe ? 'בנים/נוער' : 'Male', count: malePlayers.length }
                    ] as const
                  ).map(tab => {
                    const active = pickerTab === tab.id;
                    const cls =
                      tab.id === 'female'
                        ? 'bg-rose-500 text-white'
                        : tab.id === 'male'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gold-600 text-white';
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPickerTab(tab.id)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          active ? cls : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="font-mono tabular-nums text-[11px] opacity-85">{tab.count}</span>
                      </button>
                    );
                  })}
                </div>

                {watchedKeys.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChangeWatchedKeys([])}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    {isHe ? 'נקה בחירה' : 'Clear all'}
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Player List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
              {pickerFilteredOptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  {isHe ? 'לא נמצאו שחקנים מתאימים לחיפוש.' : 'No matching players found.'}
                </div>
              ) : (
                pickerFilteredOptions.map(item => {
                  const selected = watchedKeys.includes(item.key);
                  const isFemale = item.rosterType === 'female';
                  const disabled = !selected && watchedKeys.length >= MAX_WATCHED_PLAYERS;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleTogglePlayer(item.key)}
                      className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 text-left rtl:text-right transition-colors ${
                        selected
                          ? 'bg-gold-50/70 dark:bg-gold-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      } ${disabled ? 'opacity-45 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.player.photoUrl ? (
                          <img
                            src={item.player.photoUrl}
                            alt={item.player.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                              isFemale ? 'bg-rose-600' : 'bg-blue-600'
                            }`}
                          >
                            {item.player.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {item.player.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                            <span
                              className={`font-bold ${
                                isFemale ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {isFemale ? (isHe ? 'נשים' : 'Female') : isHe ? 'גברים' : 'Male'}
                            </span>
                            {item.player.youthCategory && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{item.player.youthCategory}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{item.player.clubName}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? 'bg-gold-600 border-gold-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isHe
                  ? 'הנתונים מתעדכנים אוטומטית מאתרי ספורט מובילים'
                  : 'Fixtures sync automatically from live sports websites'}
              </span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-gold-600 hover:bg-gold-700 text-white transition-colors"
              >
                {isHe ? 'שמור והצג משחקים' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

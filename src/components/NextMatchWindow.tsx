import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Player,
  Language,
  NextMatchInfo,
  UpcomingMatchFixture
} from '../types/player';
import {
  CalendarClock,
  RefreshCw,
  Users,
  ExternalLink,
  X,
  Search,
  Check,
  Plus,
  Shield,
  Home,
  Plane,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface RosterOption {
  key: string; // `${rosterType}:${player.id}`
  player: Player;
  rosterType: 'female' | 'male';
}

interface TimelineMatchNode {
  nodeId: string;
  option: RosterOption;
  fixture: UpcomingMatchFixture;
  kickoffMs: number;
  countdown: { label: string; isLive: boolean; isSoon: boolean };
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

const MATCH_CACHE_STORAGE_KEY = 'aura_next_match_cache_v2';
const CLIENT_CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_WATCHED_PLAYERS = 24;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LIVE_WINDOW_PAST_MS = 2 * 60 * 60 * 1000;

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

function getPlayerLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return fullName.trim();
  const last = parts[parts.length - 1];
  if (parts.length >= 3 && /^(jr\.?|sr\.?|ii|iii)$/i.test(last)) {
    return `${parts[parts.length - 2]} ${last}`;
  }
  return last;
}

function getClubMonogram(clubName: string): string {
  const words = clubName
    .replace(/['"()\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !/^(fc|sc|wfc|u19|u17|w)$/i.test(w));
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  const clean = clubName.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '');
  return clean.slice(0, 2).toUpperCase() || 'FC';
}

function getCompactCountdown(
  kickoffMs: number,
  nowMs: number,
  isHe: boolean
): { label: string; isLive: boolean; isSoon: boolean } {
  const diffMs = kickoffMs - nowMs;
  if (diffMs <= 0 && diffMs >= -LIVE_WINDOW_PAST_MS) {
    return { label: isHe ? 'חי' : 'LIVE', isLive: true, isSoon: true };
  }

  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) {
    const roundedH = Math.max(1, Math.round(diffHours));
    if (roundedH >= 24) {
      return { label: isHe ? '1 י׳' : '1d', isLive: false, isSoon: true };
    }
    return {
      label: isHe ? `${roundedH}ש׳` : `${roundedH}h`,
      isLive: false,
      isSoon: true
    };
  }

  const days = Math.min(7, Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24))));
  return {
    label: isHe ? `${days} י׳` : `${days}d`,
    isLive: false,
    isSoon: days <= 2
  };
}

function formatCompactDayTime(kickoffIso: string, language: Language): string {
  const d = new Date(kickoffIso);
  if (Number.isNaN(d.getTime())) return '';
  const locale = language === 'he' ? 'he-IL' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

const OpponentCrest: React.FC<{ logoUrl?: string; opponentName: string; sizeClass?: string }> = ({
  logoUrl,
  opponentName,
  sizeClass = 'w-7 h-7'
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [logoUrl]);

  if (logoUrl && !imgFailed) {
    return (
      <div className={`${sizeClass} rounded-full bg-white ring-2 ring-slate-900 p-0.5 flex items-center justify-center shrink-0 shadow-xs`}>
        <img
          src={logoUrl}
          alt={opponentName}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      title={opponentName}
      className={`${sizeClass} rounded-full bg-slate-800 ring-2 ring-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0 text-slate-200`}
    >
      <Shield className="w-2.5 h-2.5 text-slate-400 -mb-0.5" />
      <span className="text-[7px] font-extrabold leading-none tracking-tighter">
        {getClubMonogram(opponentName)}
      </span>
    </div>
  );
};

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
  const [showIdleList, setShowIdleList] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTab, setPickerTab] = useState<'all' | 'female' | 'male'>('all');
  const [matchMap, setMatchMap] = useState<Record<string, NextMatchInfo>>(() => loadCachedMatches());
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
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
    return selectedItems.filter(item => scope === 'all' || item.rosterType === scope);
  }, [selectedItems, scope]);

  // Flatten and strictly filter upcoming fixtures to ONLY the next 7 days
  const { timelineNodes, itemsWithoutUpcoming7d } = useMemo(() => {
    const nowMs = Date.now();
    const minCutoff = nowMs - LIVE_WINDOW_PAST_MS;
    const maxCutoff = nowMs + SEVEN_DAYS_MS;

    const nodes: TimelineMatchNode[] = [];
    const without7d: RosterOption[] = [];

    for (const option of visibleSelectedItems) {
      const match = matchMap[option.key];
      let addedForOption = 0;

      if (match?.status === 'found') {
        const candidates: UpcomingMatchFixture[] =
          Array.isArray(match.upcomingMatches7d) && match.upcomingMatches7d.length > 0
            ? match.upcomingMatches7d
            : match.kickoffIso && match.opponent
            ? [
                {
                  id: `${option.key}-${match.kickoffIso}`,
                  homeTeam: match.homeTeam,
                  awayTeam: match.awayTeam,
                  opponent: match.opponent,
                  opponentLogoUrl: match.opponentLogoUrl,
                  isHome: match.isHome,
                  kickoffIso: match.kickoffIso,
                  competition: match.competition,
                  venue: match.venue,
                  sourceName: match.sourceName,
                  sourceUrl: match.sourceUrl
                }
              ]
            : [];

        for (const fix of candidates) {
          const ts = Date.parse(fix.kickoffIso);
          if (Number.isNaN(ts) || ts < minCutoff || ts > maxCutoff) continue;
          nodes.push({
            nodeId: `${option.key}:${fix.id}`,
            option,
            fixture: fix,
            kickoffMs: ts,
            countdown: getCompactCountdown(ts, nowMs, isHe)
          });
          addedForOption += 1;
        }
      }

      if (addedForOption === 0) {
        without7d.push(option);
      }
    }

    nodes.sort((a, b) => a.kickoffMs - b.kickoffMs);
    return { timelineNodes: nodes, itemsWithoutUpcoming7d: without7d };
  }, [visibleSelectedItems, matchMap, isHe]);

  const MAX_VISIBLE_GAMES = 3;
  const maxCarouselIndex = Math.max(0, timelineNodes.length - MAX_VISIBLE_GAMES);
  const safeCarouselIndex = Math.min(carouselIndex, maxCarouselIndex);
  const visibleCarouselNodes = timelineNodes.slice(
    safeCarouselIndex,
    safeCarouselIndex + MAX_VISIBLE_GAMES
  );
  const hasCarousel = timelineNodes.length > MAX_VISIBLE_GAMES;

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

        if (data?.geminiQuotaLimited && results.some(r => r.status === 'not_found')) {
          setFetchError(
            isHe
              ? 'מכסת החיפוש החכם הגיעה לתקרה הזמנית; מוצגים לוחות 365Scores, FotMob ו-TheSportsDB.'
              : 'AI search fallback reached quota limit; showing live 365Scores, FotMob & TheSportsDB feeds.'
          );
        }

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

  // Auto-fetch missing or stale fixtures (including entries missing upcomingMatches7d)
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
      const missing7dArray = cached.status === 'found' && !Array.isArray(cached.upcomingMatches7d);
      const isStale = Number.isNaN(fetchedTs) || now - fetchedTs > CLIENT_CACHE_TTL_MS || missing7dArray;
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

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-950 text-white border border-slate-800/90 shadow-md w-full max-w-[660px]">
      {/* Top Broadcast Hairline */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-gold-400 to-sky-500" />
      {/* Subtle Ambient Broadcast Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -left-10 w-44 h-28 rounded-full bg-emerald-500/10 blur-2xl"
      />

      {/* Compact Single-Line Header */}
      <div className="relative px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h2 className="text-xs font-bold tracking-tight text-white truncate">
            {isHe ? 'מרכז משחקים' : 'Match Center'}
          </h2>
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold font-mono tabular-nums text-emerald-300 shrink-0">
            {hasCarousel
              ? `${safeCarouselIndex + 1}–${safeCarouselIndex + visibleCarouselNodes.length}/${timelineNodes.length}`
              : `${timelineNodes.length} · 7d`}
          </span>

          {itemsWithoutUpcoming7d.length > 0 && (
            <button
              type="button"
              onClick={() => setShowIdleList(prev => !prev)}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors shrink-0 ${
                showIdleList
                  ? 'bg-slate-800 border-gold-400/50 text-gold-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
              title={isHe ? 'שחקנים ללא משחק ב-7 הימים הקרובים' : 'Players with no match in the next 7 days'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span className="font-mono tabular-nums">
                {itemsWithoutUpcoming7d.length} {isHe ? 'פנויים' : 'idle'}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasCarousel && (
            <div className="inline-flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-md p-0.5">
              <button
                type="button"
                aria-label={isHe ? 'משחק קודם' : 'Previous matches'}
                disabled={safeCarouselIndex === 0}
                onClick={() => setCarouselIndex(prev => Math.max(0, Math.min(prev, maxCarouselIndex) - 1))}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                aria-label={isHe ? 'משחק הבא' : 'Next matches'}
                disabled={safeCarouselIndex >= maxCarouselIndex}
                onClick={() => setCarouselIndex(prev => Math.min(maxCarouselIndex, prev + 1))}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          )}

          {selectedItems.length > 0 && (
            <button
              type="button"
              disabled={isLoading}
              title={isHe ? 'רענן מאתרי ספורט' : 'Refresh from sports sites'}
              onClick={() => fetchMatchesForItems(selectedItems, true)}
              className="w-6 h-6 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-emerald-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPickerTab(scope === 'all' ? 'all' : scope);
              setIsPickerOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md bg-gold-600 hover:bg-gold-500 text-white transition-colors whitespace-nowrap"
          >
            <Users className="w-3 h-3" />
            <span>{isHe ? 'שחקנים' : 'Players'}</span>
            {selectedItems.length > 0 && (
              <span className="px-1 rounded bg-black/25 text-[10px] font-mono tabular-nums">
                {selectedItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="px-3 py-1 bg-amber-950/60 border-b border-amber-500/30 text-[11px] text-amber-200 flex items-center justify-between gap-2">
          <span className="truncate">{fetchError}</span>
          <button
            type="button"
            onClick={() => setFetchError(null)}
            className="text-amber-300 hover:underline font-semibold shrink-0"
          >
            {isHe ? 'סגור' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Collapsible Idle Players Drawer (Only when clicked) */}
      {showIdleList && itemsWithoutUpcoming7d.length > 0 && (
        <div className="px-3 py-2 bg-slate-900/95 border-b border-white/10 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1 rtl:mr-0 rtl:ml-1">
            {isHe ? 'ללא משחק ב-7 ימים:' : 'No match in 7d:'}
          </span>
          {itemsWithoutUpcoming7d.map(option => {
            const isFemale = option.rosterType === 'female';
            const lastName = getPlayerLastName(option.player.name);
            const cached = matchMap[option.key];
            const fallbackUrl =
              cached?.sourceUrl ||
              cached?.lookupLinks?.[0]?.url ||
              `https://www.fotmob.com/search?q=${encodeURIComponent(option.player.clubName)}`;

            return (
              <span
                key={option.key}
                className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-slate-200"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isFemale ? 'bg-rose-400' : 'bg-sky-400'}`} />
                <button
                  type="button"
                  onClick={() => onSelectPlayer(option.player, option.rosterType)}
                  title={`${option.player.name} · ${option.player.clubName}`}
                  className="font-semibold hover:text-gold-300"
                >
                  {lastName}
                </button>
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={option.player.clubName}
                  className="text-slate-400 hover:text-emerald-400"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleTogglePlayer(option.key)}
                  title={isHe ? 'הסר' : 'Remove'}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Compact Bento Dock Body */}
      <div className="px-3 py-2.5">
        {selectedItems.length === 0 ? (
          <div className="flex items-center justify-between gap-2.5 rounded-lg border border-dashed border-white/15 bg-white/5 px-3 py-2">
            <span className="text-[11px] text-slate-300">
              {isHe
                ? 'בחרו שחקנים להצגת משחקים ב-7 הימים הקרובים.'
                : 'Select players to view fixtures in the next 7 days.'}
            </span>
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-gold-600 hover:bg-gold-500 text-white transition-colors shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>{isHe ? 'בחר שחקנים' : 'Select'}</span>
            </button>
          </div>
        ) : visibleSelectedItems.length === 0 ? (
          <div className="py-2 text-center text-[11px] text-slate-400">
            {isHe
              ? 'השחקנים שנבחרו שייכים לחטיבה השנייה. העבר ל"הכל" או בחר שחקנים כאן.'
              : 'Selected players are in the other division filter. Switch filter to "All" or pick players here.'}
          </div>
        ) : timelineNodes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {visibleCarouselNodes.map(node => {
              const { option, fixture, countdown } = node;
              const { player, rosterType, key } = option;
              const isFemale = rosterType === 'female';
              const lastName = getPlayerLastName(player.name);

              const cardTone = countdown.isLive
                ? 'border-rose-500/70 bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-900 shadow-[0_0_14px_-4px_rgba(244,63,94,0.6)]'
                : countdown.isSoon
                ? 'border-gold-500/45 bg-gradient-to-br from-emerald-950/35 via-slate-900 to-slate-900 hover:border-gold-400/75'
                : 'border-white/10 bg-slate-900/90 hover:border-white/25';

              return (
                <div
                  key={node.nodeId}
                  className={`relative group/node rounded-lg border p-2 transition-all flex flex-col justify-between gap-1.5 min-w-0 ${cardTone}`}
                >
                  {/* Top Row: Overlapping Avatar + Crest Lockup & Countdown */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectPlayer(player, rosterType)}
                        title={`${player.name} · ${player.clubName}`}
                        className="relative z-10 shrink-0 focus:outline-hidden"
                      >
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className={`w-7 h-7 rounded-full object-cover ring-2 transition-transform group-hover/node:scale-105 ${
                              isFemale ? 'ring-rose-500' : 'ring-sky-500'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white ring-2 ${
                              isFemale ? 'bg-rose-600 ring-rose-400' : 'bg-sky-600 ring-sky-400'
                            }`}
                          >
                            {lastName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </button>

                      <div className="-ml-2 rtl:ml-0 rtl:-mr-2 relative z-0 shrink-0">
                        <OpponentCrest
                          logoUrl={fixture.opponentLogoUrl}
                          opponentName={fixture.opponent}
                          sizeClass="w-7 h-7"
                        />
                      </div>

                      {fixture.isHome !== undefined && (
                        <span
                          title={fixture.isHome ? (isHe ? 'בית' : 'Home') : isHe ? 'חוץ' : 'Away'}
                          className={`ml-1.5 rtl:ml-0 rtl:mr-1.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            fixture.isHome
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {fixture.isHome ? <Home className="w-2.5 h-2.5" /> : <Plane className="w-2.5 h-2.5" />}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono tabular-nums shrink-0 ${
                        countdown.isLive
                          ? 'bg-rose-600 text-white'
                          : countdown.isSoon
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 text-slate-200 border border-white/10'
                      }`}
                    >
                      {countdown.isLive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                      {countdown.label}
                    </span>
                  </div>

                  {/* Bottom Row: Last Name + Opponent + Kickoff */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectPlayer(player, rosterType)}
                        title={`${player.name} (${player.clubName})`}
                        className="text-left rtl:text-right text-xs font-extrabold text-white hover:text-gold-300 truncate transition-colors"
                      >
                        {lastName}
                      </button>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {fixture.sourceUrl && (
                          <a
                            href={fixture.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={fixture.competition || fixture.sourceName || 'View match'}
                            className="p-0.5 rounded text-slate-400 hover:text-emerald-400 transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          title={isHe ? 'הסר שחקן' : `Remove ${player.name}`}
                          onClick={() => handleTogglePlayer(key)}
                          className="opacity-0 group-hover/node:opacity-100 p-0.5 rounded text-slate-500 hover:text-rose-400 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 min-w-0 mt-0.5">
                      <span title={fixture.opponent} className="truncate font-medium">
                        {fixture.isHome === false ? '@ ' : 'vs '}
                        {fixture.opponent}
                      </span>
                      <span className="font-mono tabular-nums text-[9.5px] text-slate-500 shrink-0">
                        {formatCompactDayTime(fixture.kickoffIso, language)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300 flex items-center justify-between gap-2">
            <span>
              {isLoading
                ? isHe
                  ? 'טוען משחקים ב-7 הימים הקרובים...'
                  : 'Checking fixtures for the next 7 days...'
                : isHe
                ? 'אין משחקים מתוזמנים ב-7 הימים הקרובים לשחקנים שנבחרו.'
                : 'No fixtures scheduled within the next 7 days for selected players.'}
            </span>
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
                  {isHe ? 'בחר שחקנים ושחקניות לציר המשחקים' : 'Choose Players for 7-Day Match Timeline'}
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
                  ? 'מציג משחקים מאתרי ספורט ב-7 הימים הקרובים בלבד'
                  : 'Displays live fixtures within the next 7 days only'}
              </span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-gold-600 hover:bg-gold-700 text-white transition-colors"
              >
                {isHe ? 'שמור והצג' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

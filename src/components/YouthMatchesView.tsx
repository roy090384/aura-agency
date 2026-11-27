import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarDays,
  RefreshCw,
  MapPin,
  Clock,
  ExternalLink,
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowUpRight,
  Trophy,
  Navigation,
  Copy,
  Check,
  Columns3,
  ListTree,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import {
  Player,
  Language,
  SupportedYouthMatchTier,
  YouthMatchTimelineItem,
  YouthMatchesApiResponse,
  YouthPlayerCoverage
} from '../types/player';
import { getClubVisualTheme } from '../utils/clubShields';

interface YouthMatchesViewProps {
  malePlayers: Player[];
  onSelectPlayer: (player: Player, rosterType: 'female' | 'male') => void;
  onNavigateMaleRoster?: () => void;
  language: Language;
}

const YOUTH_MATCHES_CACHE_KEY = 'aura_youth_matches_jl_v3';
const CACHE_TTL_MS = 15 * 60 * 1000;
const SUPPORTED_TIERS: SupportedYouthMatchTier[] = ['U14', 'U15', 'U16', 'U17'];
const OVERLAP_WINDOW_MS = 90 * 60 * 1000; // 90 minutes

type ViewMode = 'timeline' | 'board';
type ClashFilter = 'all' | 'overlaps' | 'doubleheaders';

function resolvePlayerTier(player: Player): SupportedYouthMatchTier | null {
  const yc = player.youthCategory;
  if (yc === 'U14' || yc === 'U15' || yc === 'U16' || yc === 'U17') {
    return yc;
  }
  if (yc === 'U19' || yc === 'Senior') {
    return null;
  }
  if (typeof player.age === 'number' && Number.isFinite(player.age)) {
    if (player.age >= 12 && player.age <= 14) return 'U14';
    if (player.age === 15) return 'U15';
    if (player.age === 16) return 'U16';
    if (player.age === 17) return 'U17';
  }
  return null;
}

function getLocalDateKey(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeHHMM(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function normalizeVenueKey(venue?: string): string {
  if (!venue) return '';
  return venue
    .toLowerCase()
    .replace(/["'״׳.\-_/]/g, ' ')
    .replace(/\b(סינטטי|מגרש|אצטדיון|חדש|ישן|מערבי|מזרחי|צפוני|דרומי|1|2|3|4)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getGoogleMapsUrl(venue: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;
}

function getRelativeCountdown(
  iso: string,
  hasTime: boolean,
  isHe: boolean
): { label: string; isLive: boolean; isUrgent: boolean } {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return { label: '', isLive: false, isUrgent: false };
  const diffMs = ts - Date.now();

  if (hasTime && diffMs <= 0 && diffMs >= -2 * 60 * 60 * 1000) {
    return { label: isHe ? 'משחק חי' : 'LIVE', isLive: true, isUrgent: true };
  }
  if (diffMs < 0) {
    return { label: isHe ? 'היום' : 'Today', isLive: false, isUrgent: true };
  }

  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 24) {
    const rounded = Math.max(1, Math.round(hours));
    return {
      label: isHe ? `בעוד ${rounded} ש׳` : `In ${rounded}h`,
      isLive: false,
      isUrgent: true
    };
  }

  const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return {
    label: days === 1 ? (isHe ? 'מחר' : 'Tomorrow') : isHe ? `בעוד ${days} ימים` : `In ${days}d`,
    isLive: false,
    isUrgent: days <= 2
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'PL';
}

function getTierAccentClasses(tier: SupportedYouthMatchTier): string {
  switch (tier) {
    case 'U14':
      return 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800/70';
    case 'U15':
      return 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800/70';
    case 'U16':
      return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/70';
    case 'U17':
      return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/70';
  }
}

const ClubShield: React.FC<{
  teamName: string;
  highlighted?: boolean;
  size?: 'sm' | 'md';
}> = ({ teamName, highlighted = false, size = 'md' }) => {
  const theme = useMemo(() => getClubVisualTheme(teamName), [teamName]);
  const dims = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const fontSize = size === 'sm' ? 'text-[8px]' : 'text-[10px]';

  return (
    <div
      title={teamName}
      className={`${dims} relative flex items-center justify-center shrink-0 select-none ${
        highlighted ? 'drop-shadow-xs' : ''
      }`}
    >
      <svg viewBox="0 0 36 40" className="w-full h-full" aria-hidden="true">
        <path
          d="M18 2 L33 7.5 V19 C33 28.5 26.2 35.4 18 38.5 C9.8 35.4 3 28.5 3 19 V7.5 L18 2 Z"
          fill={theme.primary}
          stroke={theme.secondary}
          strokeWidth={highlighted ? 2.6 : 1.8}
        />
        <path
          d="M18 3.5 L31.2 8.4 V19 C31.2 27.3 25.1 33.6 18 36.6 Z"
          fill={theme.secondary}
          fillOpacity="0.16"
        />
      </svg>
      <span
        style={{ color: theme.text }}
        className={`absolute inset-0 flex items-center justify-center font-extrabold tracking-tight leading-none pb-0.5 ${fontSize}`}
      >
        {theme.monogram}
      </span>
    </div>
  );
};

export const YouthMatchesView: React.FC<YouthMatchesViewProps> = ({
  malePlayers,
  onSelectPlayer,
  onNavigateMaleRoster,
  language
}) => {
  const isHe = language === 'he';
  const locale = isHe ? 'he-IL' : 'en-GB';

  const [data, setData] = useState<YouthMatchesApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [clashFilter, setClashFilter] = useState<ClashFilter>('all');
  const [selectedTier, setSelectedTier] = useState<'ALL' | SupportedYouthMatchTier>('ALL');
  const [selectedClub, setSelectedClub] = useState<string>('ALL');
  const [selectedDayKey, setSelectedDayKey] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCoverageDetails, setShowCoverageDetails] = useState<boolean>(false);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);

  // Filter male roster strictly to U14, U15, U16, U17 players
  const eligibleMaleYouthPlayers = useMemo(() => {
    return malePlayers
      .map((p) => {
        const tier = resolvePlayerTier(p);
        return tier ? { player: p, tier } : null;
      })
      .filter((x): x is { player: Player; tier: SupportedYouthMatchTier } => Boolean(x));
  }, [malePlayers]);

  const playerById = useMemo(() => {
    const map = new Map<string, Player>();
    for (const p of malePlayers) {
      map.set(p.id, p);
    }
    return map;
  }, [malePlayers]);

  const rosterFingerprint = useMemo(() => {
    return eligibleMaleYouthPlayers
      .map(({ player, tier }) => `${player.id}:${tier}:${player.clubName}:${player.league || ''}`)
      .sort()
      .join('|');
  }, [eligibleMaleYouthPlayers]);

  const loadMatches = useCallback(
    async (forceRefresh = false) => {
      if (eligibleMaleYouthPlayers.length === 0) {
        setData({
          matches: [],
          coverage: [],
          scannedLeaguesCount: 0,
          relevantClubsCount: 0,
          daysAhead: 7,
          fetchedAt: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      if (!forceRefresh) {
        try {
          const cachedRaw = localStorage.getItem(YOUTH_MATCHES_CACHE_KEY);
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw) as {
              fingerprint: string;
              cachedAt: number;
              payload: YouthMatchesApiResponse;
            };
            if (
              parsed &&
              parsed.fingerprint === rosterFingerprint &&
              Date.now() - parsed.cachedAt < CACHE_TTL_MS
            ) {
              setData(parsed.payload);
              setError(null);
              return;
            }
          }
        } catch {
          // ignore cache read errors
        }
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/youth-matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            daysAhead: 7,
            forceRefresh,
            players: eligibleMaleYouthPlayers.map(({ player, tier }) => ({
              id: player.id,
              name: player.name,
              photoUrl: player.photoUrl,
              clubName: player.clubName,
              league: player.league,
              position: player.position,
              age: player.age,
              youthCategory: tier
            }))
          })
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = (await res.json()) as YouthMatchesApiResponse;
        setData(payload);

        try {
          localStorage.setItem(
            YOUTH_MATCHES_CACHE_KEY,
            JSON.stringify({
              fingerprint: rosterFingerprint,
              cachedAt: Date.now(),
              payload
            })
          );
        } catch {
          // ignore cache write errors
        }
      } catch (err) {
        console.error('Failed to load JuniorLeague youth matches:', err);
        setError(
          isHe
            ? 'לא ניתן היה לטעון כרגע את לוח המשחקים מ-JuniorLeague. נסו לרענן בעוד רגע.'
            : 'Unable to fetch live fixtures from JuniorLeague right now. Please try refreshing.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [eligibleMaleYouthPlayers, rosterFingerprint, isHe]
  );

  useEffect(() => {
    loadMatches(false);
  }, [loadMatches]);

  // Distinct clubs from eligible male youth roster for the Club filter dropdown
  const relevantClubOptions = useMemo(() => {
    const clubs = new Set<string>();
    for (const { player } of eligibleMaleYouthPlayers) {
      if (player.clubName && player.clubName.trim() && !/free agent|ללא קבוצה/i.test(player.clubName)) {
        clubs.add(player.clubName.trim());
      }
    }
    return Array.from(clubs).sort((a, b) => a.localeCompare(b));
  }, [eligibleMaleYouthPlayers]);

  // Next 7 calendar days for the visual 7-day strip
  const upcomingSevenDays = useMemo(() => {
    const days: Array<{ key: string; weekdayShort: string; dayNum: string; monthShort: string; fullLabel: string }> = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const key = getLocalDateKey(d);
      const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
      const dayNum = String(d.getDate());
      const monthShort = new Intl.DateTimeFormat(locale, { month: 'short' }).format(d);
      const fullLabel =
        i === 0
          ? isHe
            ? 'היום'
            : 'Today'
          : i === 1
          ? isHe
            ? 'מחר'
            : 'Tomorrow'
          : new Intl.DateTimeFormat(locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            }).format(d);
      days.push({ key, weekdayShort, dayNum, monthShort, fullLabel });
    }
    return days;
  }, [locale, isHe]);

  const allMatches = data?.matches || [];

  // Apply Tier + Club + Search filters BEFORE Day strip & Clash analysis
  const matchesAfterAttributeFilters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMatches.filter((m) => {
      if (selectedTier !== 'ALL' && m.tier !== selectedTier) return false;
      if (
        selectedClub !== 'ALL' &&
        !m.players.some((p) => p.clubName.trim() === selectedClub)
      ) {
        return false;
      }
      if (q) {
        const haystack = [
          m.homeTeam,
          m.awayTeam,
          m.leagueName,
          m.venue || '',
          m.tier,
          m.ageGroupHe,
          ...m.players.map((p) => `${p.playerName} ${p.clubName}`)
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allMatches, selectedTier, selectedClub, searchQuery]);

  // Schedule Intelligence: Simultaneous Kickoff Overlaps (<=90m same day) & Same-Venue Doubleheaders
  const { overlapMatchIds, doubleheaderMatchIds, agencyMatchupIds, overlapCount, doubleheaderCount } = useMemo(() => {
    const overlapSet = new Set<string>();
    const doubleheaderSet = new Set<string>();
    const matchupSet = new Set<string>();

    const byDay = new Map<string, YouthMatchTimelineItem[]>();
    for (const m of matchesAfterAttributeFilters) {
      if (m.agencySides.length >= 2) {
        matchupSet.add(m.id);
      }
      const dk = getLocalDateKey(m.dateTime);
      const arr = byDay.get(dk) || [];
      arr.push(m);
      byDay.set(dk, arr);
    }

    for (const dayMatches of byDay.values()) {
      // Detect kickoff overlaps (confirmed times within 90 mins on same day)
      const timed = dayMatches
        .filter((m) => m.hasTime && !Number.isNaN(Date.parse(m.dateTime)))
        .map((m) => ({ m, ts: Date.parse(m.dateTime) }));

      for (let i = 0; i < timed.length; i++) {
        for (let j = i + 1; j < timed.length; j++) {
          if (Math.abs(timed[i].ts - timed[j].ts) <= OVERLAP_WINDOW_MS) {
            overlapSet.add(timed[i].m.id);
            overlapSet.add(timed[j].m.id);
          }
        }
      }

      // Detect same-venue doubleheaders
      const byVenue = new Map<string, string[]>();
      for (const m of dayMatches) {
        const vk = normalizeVenueKey(m.venue);
        if (!vk || vk.length < 3) continue;
        const arr = byVenue.get(vk) || [];
        arr.push(m.id);
        byVenue.set(vk, arr);
      }
      for (const ids of byVenue.values()) {
        if (ids.length >= 2) {
          ids.forEach((id) => doubleheaderSet.add(id));
        }
      }
    }

    return {
      overlapMatchIds: overlapSet,
      doubleheaderMatchIds: doubleheaderSet,
      agencyMatchupIds: matchupSet,
      overlapCount: overlapSet.size,
      doubleheaderCount: doubleheaderSet.size
    };
  }, [matchesAfterAttributeFilters]);

  const countsByDayKey = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of matchesAfterAttributeFilters) {
      if (clashFilter === 'overlaps' && !overlapMatchIds.has(m.id)) continue;
      if (clashFilter === 'doubleheaders' && !doubleheaderMatchIds.has(m.id)) continue;
      const k = getLocalDateKey(m.dateTime);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return counts;
  }, [matchesAfterAttributeFilters, clashFilter, overlapMatchIds, doubleheaderMatchIds]);

  const countsByTier = useMemo(() => {
    const map: Record<SupportedYouthMatchTier, number> = { U14: 0, U15: 0, U16: 0, U17: 0 };
    for (const m of allMatches) {
      map[m.tier] = (map[m.tier] || 0) + 1;
    }
    return map;
  }, [allMatches]);

  // Final filtered matches (with day + clash filter)
  const visibleMatches = useMemo(() => {
    return matchesAfterAttributeFilters.filter((m) => {
      if (selectedDayKey !== 'ALL' && getLocalDateKey(m.dateTime) !== selectedDayKey) return false;
      if (clashFilter === 'overlaps' && !overlapMatchIds.has(m.id)) return false;
      if (clashFilter === 'doubleheaders' && !doubleheaderMatchIds.has(m.id)) return false;
      return true;
    });
  }, [matchesAfterAttributeFilters, selectedDayKey, clashFilter, overlapMatchIds, doubleheaderMatchIds]);

  // Group visible matches chronologically by day
  const timelineGroups = useMemo(() => {
    const groupMap = new Map<
      string,
      { dateKey: string; label: string; shortLabel: string; isToday: boolean; items: YouthMatchTimelineItem[] }
    >();
    const todayKey = getLocalDateKey(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowKey = getLocalDateKey(tomorrowDate);

    for (const match of visibleMatches) {
      const dateKey = getLocalDateKey(match.dateTime);
      let group = groupMap.get(dateKey);
      if (!group) {
        const d = new Date(match.dateTime);
        const formattedFull = Number.isNaN(d.getTime())
          ? dateKey
          : new Intl.DateTimeFormat(locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            }).format(d);
        const formattedShort = Number.isNaN(d.getTime())
          ? dateKey
          : new Intl.DateTimeFormat(locale, {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            }).format(d);

        const label =
          dateKey === todayKey
            ? `${isHe ? 'היום' : 'Today'} · ${formattedFull}`
            : dateKey === tomorrowKey
            ? `${isHe ? 'מחר' : 'Tomorrow'} · ${formattedFull}`
            : formattedFull;

        group = {
          dateKey,
          label,
          shortLabel: formattedShort,
          isToday: dateKey === todayKey,
          items: []
        };
        groupMap.set(dateKey, group);
      }
      group.items.push(match);
    }

    return Array.from(groupMap.values());
  }, [visibleMatches, locale, isHe]);

  // Summary KPIs
  const uniquePlayersInMatches = useMemo(() => {
    const ids = new Set<string>();
    for (const m of matchesAfterAttributeFilters) {
      for (const p of m.players) ids.add(p.playerId);
    }
    return ids.size;
  }, [matchesAfterAttributeFilters]);

  const cupMatchesCount = useMemo(() => {
    return matchesAfterAttributeFilters.filter((m) => m.competitionType === 'cup').length;
  }, [matchesAfterAttributeFilters]);

  const nextFixture = matchesAfterAttributeFilters[0] || null;

  const coverageIssues = useMemo<YouthPlayerCoverage[]>(() => {
    return (data?.coverage || []).filter((c) => c.upcomingMatchCount === 0);
  }, [data]);

  // Copy WhatsApp-ready Weekend / 7-Day Brief
  const handleCopyWeekendBrief = async () => {
    if (visibleMatches.length === 0) return;

    const lines: string[] = [];
    lines.push(
      isHe
        ? `*BRIT SPORT GROUP — לו"ז משחקי נוער (${visibleMatches.length} משחקים)*`
        : `*BRIT SPORT GROUP — Youth Matches Brief (${visibleMatches.length} fixtures)*`
    );
    lines.push('');

    for (const group of timelineGroups) {
      lines.push(`📅 *${group.label}*`);
      for (const m of group.items) {
        const timeStr = m.hasTime ? formatTimeHHMM(m.dateTime) : isHe ? 'שעה טרם נקבעה' : 'TBD';
        const compTag = m.competitionType === 'cup' ? `🏆 ${m.leagueName}` : m.leagueName;
        const playerNames = m.players.map((p) => p.playerName).join(', ');
        lines.push(`• *${timeStr}* | [${m.tier}] *${m.homeTeam}* vs *${m.awayTeam}*`);
        lines.push(`  ${compTag}${m.venue ? ` · 📍 ${m.venue}` : ''}`);
        lines.push(`  👤 ${playerNames}`);
        if (m.venue) {
          lines.push(`  🗺️ ${getGoogleMapsUrl(m.venue)}`);
        }
      }
      lines.push('');
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n').trim());
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div dir={isHe ? 'rtl' : 'ltr'} className="space-y-6 animate-in fade-in duration-200">
      {/* Header Command Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                <CalendarDays className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {isHe ? 'משחקי נוער · 7 ימים קרובים' : 'Youth Matches · Next 7 Days'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHe
                    ? 'ליגות וגביע המדינה מ-JuniorLeague.co.il עבור שחקני סגל הבנים (U14–U17) בלבד'
                    : 'League & State Cup fixtures from JuniorLeague.co.il for your Male Roster clubs (U14–U17)'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {data?.fetchedAt && (
              <span className="text-[11px] font-mono-tabular text-slate-400 dark:text-slate-500 hidden xl:inline me-1">
                {isHe ? 'עודכן:' : 'Synced:'}{' '}
                {new Date(data.fetchedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </span>
            )}

            {/* Switchable Timeline / Schedule Board Toggle */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>{isHe ? 'ציר זמן' : 'Timeline'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>{isHe ? 'לוח ימים' : 'Schedule Board'}</span>
              </button>
            </div>

            {/* Copy / Share Weekend Brief */}
            <button
              type="button"
              onClick={handleCopyWeekendBrief}
              disabled={visibleMatches.length === 0}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {copiedBrief ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {isHe ? 'הועתק לוואטסאפ!' : 'Copied Brief!'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isHe ? 'העתק לו״ז' : 'Copy Weekend Brief'}</span>
                </>
              )}
            </button>

            {/* Refresh Sync */}
            <button
              type="button"
              onClick={() => loadMatches(true)}
              disabled={isLoading}
              className="h-9 px-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? (isHe ? 'מסנכרן...' : 'Syncing...') : isHe ? 'רענן' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 px-3.5 py-3">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isHe ? 'משחקים ב-7 ימים' : 'Fixtures (Next 7d)'}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                {matchesAfterAttributeFilters.length}
              </span>
              {cupMatchesCount > 0 && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {cupMatchesCount} {isHe ? 'גביע' : 'Cup'}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 px-3.5 py-3">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isHe ? 'שחקנים עם משחק' : 'Players Scheduled'}
            </div>
            <div className="text-xl font-extrabold font-mono-tabular text-emerald-700 dark:text-emerald-400 mt-0.5">
              {uniquePlayersInMatches}
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ms-1">
                / {eligibleMaleYouthPlayers.length}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 px-3.5 py-3">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isHe ? 'מועדונים במעקב' : 'Relevant Clubs'}
            </div>
            <div className="text-xl font-extrabold font-mono-tabular text-slate-900 dark:text-white mt-0.5">
              {relevantClubOptions.length}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 px-3.5 py-3 min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isHe ? 'המשחק הקרוב ביותר' : 'Next Kickoff'}
            </div>
            {nextFixture ? (
              <div className="mt-0.5 flex items-baseline gap-2 min-w-0">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {nextFixture.hasTime ? formatTimeHHMM(nextFixture.dateTime) : 'TBD'} ·{' '}
                  {getRelativeCountdown(nextFixture.dateTime, nextFixture.hasTime, isHe).label}
                </span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-1">—</div>
            )}
          </div>
        </div>

        {/* 7-Day Visual Calendar Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>{isHe ? 'ציר ימים (7 ימים קרובים)' : '7-Day Schedule Strip'}</span>
            {selectedDayKey !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedDayKey('ALL')}
                className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
              >
                {isHe ? 'הצג את כל 7 הימים' : 'Show all 7 days'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {upcomingSevenDays.map((day, idx) => {
              const count = countsByDayKey.get(day.key) || 0;
              const isSelected = selectedDayKey === day.key;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDayKey((prev) => (prev === day.key ? 'ALL' : day.key))}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : count > 0
                      ? 'bg-white dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-900 dark:text-white'
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 text-slate-400 dark:text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      isSelected ? 'text-emerald-100' : idx === 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                  >
                    {idx === 0 ? (isHe ? 'היום' : 'Today') : day.weekdayShort}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold font-mono-tabular leading-tight mt-0.5">
                    {day.dayNum}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold font-mono-tabular">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : count > 0
                          ? 'bg-emerald-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                    <span>{count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier Tabs + Club Filter + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-200/75 dark:border-slate-800">
          {/* Segmented Age Tier Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTier('ALL')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors border ${
                selectedTier === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isHe ? `הכל (${allMatches.length})` : `All (${allMatches.length})`}
            </button>
            {SUPPORTED_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(tier)}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors border font-mono-tabular ${
                  selectedTier === tier
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tier} ({countsByTier[tier] || 0})
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Club Filter */}
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              aria-label={isHe ? 'סנן לפי מועדון' : 'Filter by club'}
              className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">
                {isHe ? `כל המועדונים (${relevantClubOptions.length})` : `All Roster Clubs (${relevantClubOptions.length})`}
              </option>
              {relevantClubOptions.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search
                className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                  isHe ? 'right-3' : 'left-3'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHe ? 'חפש שחקן, קבוצה, מגרש...' : 'Search player, club, venue...'}
                className={`h-9 w-full sm:w-56 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isHe ? 'pr-8.5 pl-3' : 'pl-8.5 pr-3'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kickoff Clash & Same-Venue Intelligence Strip */}
      {(overlapCount > 0 || doubleheaderCount > 0 || agencyMatchupIds.size > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isHe ? 'ניתוח לו"ז ותנועה:' : 'Schedule Intelligence:'}</span>
            </span>

            {overlapCount > 0 && (
              <button
                type="button"
                onClick={() => setClashFilter((prev) => (prev === 'overlaps' ? 'all' : 'overlaps'))}
                className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1.5 transition-colors ${
                  clashFilter === 'overlaps'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-950'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>
                  {isHe ? `${overlapCount} משחקים בחפיפת שעות` : `${overlapCount} Kickoff Overlaps`}
                </span>
              </button>
            )}

            {doubleheaderCount > 0 && (
              <button
                type="button"
                onClick={() => setClashFilter((prev) => (prev === 'doubleheaders' ? 'all' : 'doubleheaders'))}
                className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1.5 transition-colors ${
                  clashFilter === 'doubleheaders'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-950'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>
                  {isHe ? `${doubleheaderCount} באותו מתחם מגרשים` : `${doubleheaderCount} Same-Venue Doubleheaders`}
                </span>
              </button>
            )}

            {agencyMatchupIds.size > 0 && (
              <span className="px-2.5 py-1 rounded-lg border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-bold inline-flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                <span>
                  {isHe
                    ? `${agencyMatchupIds.size} מפגשים בין שחקני הסוכנות`
                    : `${agencyMatchupIds.size} Agency Matchup`}
                </span>
              </span>
            )}
          </div>

          {clashFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setClashFilter('all')}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline"
            >
              {isHe ? 'נקה סינון' : 'Show all fixtures'}
            </button>
          )}
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-3 text-xs text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* No Eligible Male Youth Players State */}
      {eligibleMaleYouthPlayers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {isHe ? 'אין כרגע שחקני U14–U17 בסגל הבנים' : 'No U14–U17 Players in Male Roster Yet'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {isHe
              ? 'הוסיפו שחקנים בקטגוריות גיל U14, U15, U16 או U17 בסגל הבנים עם שם המועדון שלהם, וציר הזמן יסנכרן אוטומטית את משחקיהם ב-7 הימים הקרובים.'
              : 'Add male roster players in U14, U15, U16, or U17 categories with their club assigned, and their next 7 days of JuniorLeague matches will appear here automatically.'}
          </p>
          {onNavigateMaleRoster && (
            <button
              type="button"
              onClick={onNavigateMaleRoster}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              <span>{isHe ? 'עבור לסגל בנים ונוער' : 'Go to Male Roster'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : isLoading && !data ? (
        /* Initial Skeleton Timeline */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 p-6 space-y-5">
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex items-start gap-4 animate-pulse">
              <div className="w-16 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-48 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-20 w-full rounded-xl bg-slate-100/80 dark:bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
      ) : timelineGroups.length === 0 ? (
        /* No Matches Matching Active Filters */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 p-10 text-center space-y-2.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isHe ? 'לא נמצאו משחקים בטווח 7 הימים הקרובים' : 'No Scheduled Youth Matches Found in Next 7 Days'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {selectedDayKey !== 'ALL' || selectedTier !== 'ALL' || selectedClub !== 'ALL' || searchQuery || clashFilter !== 'all'
              ? isHe
                ? 'נסו לנקות חלק מהמסננים כדי לראות משחקים נוספים.'
                : 'Try clearing some active filters or selecting all 7 days.'
              : isHe
              ? 'ייתכן שמדובר בפגרת ליגה או ששם המועדון של השחקן טרם הותאם לשם המועדון ב-JuniorLeague.'
              : 'There may be a league break this week, or a player club name may need adjustment.'}
          </p>
        </div>
      ) : viewMode === 'board' ? (
        /* OPTION 3: Weekend / Day-by-Day Hour-Ordered Schedule Board */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {timelineGroups.map((group) => (
            <div
              key={group.dateKey}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 overflow-hidden shadow-2xs"
            >
              {/* Column Day Header */}
              <div
                className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
                  group.isToday
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50/90 dark:bg-slate-800/50 text-slate-900 dark:text-white border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {group.isToday && <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />}
                  <span className="text-xs font-extrabold truncate">{group.label}</span>
                </div>
                <span
                  className={`text-[11px] font-bold font-mono-tabular px-2 py-0.5 rounded-md shrink-0 ${
                    group.isToday
                      ? 'bg-white/20 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {group.items.length}
                </span>
              </div>

              {/* Chronological Hour Slots Inside Day Column */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {group.items.map((match) => {
                  const homeIsOurs = match.agencySides.includes('home');
                  const awayIsOurs = match.agencySides.includes('away');
                  const isCup = match.competitionType === 'cup';
                  const isOverlap = overlapMatchIds.has(match.id);
                  const isDoubleheader = doubleheaderMatchIds.has(match.id);
                  const isAgencyMatchup = agencyMatchupIds.has(match.id);

                  return (
                    <div key={match.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                            {match.hasTime ? formatTimeHHMM(match.dateTime) : 'TBD'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-extrabold font-mono-tabular ${getTierAccentClasses(
                              match.tier
                            )}`}
                          >
                            {match.tier}
                          </span>
                          {isCup && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                              <Trophy className="w-2.5 h-2.5" />
                              {isHe ? 'גביע' : 'Cup'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {isOverlap && (
                            <span
                              title={isHe ? 'חפיפת שעות עם משחק אחר' : 'Overlapping kickoff time'}
                              className="p-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                            >
                              <AlertTriangle className="w-3 h-3" />
                            </span>
                          )}
                          {isDoubleheader && (
                            <span
                              title={isHe ? 'דאבל באותו מתחם מגרשים' : 'Same-venue doubleheader'}
                              className="p-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                            >
                              <MapPin className="w-3 h-3" />
                            </span>
                          )}
                          {isAgencyMatchup && (
                            <span
                              title={isHe ? 'מפגש בין שחקני הסוכנות' : 'Agency player matchup'}
                              className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                            >
                              <Users className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Matchup with Club-Colored Shields */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <ClubShield teamName={match.homeTeam} highlighted={homeIsOurs} size="sm" />
                            <span
                              className={`text-xs truncate ${
                                homeIsOurs
                                  ? 'font-extrabold text-emerald-800 dark:text-emerald-300'
                                  : 'font-semibold text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {match.homeTeam}
                            </span>
                          </div>
                          {match.homeScore !== null && (
                            <span className="text-xs font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                              {match.homeScore}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <ClubShield teamName={match.awayTeam} highlighted={awayIsOurs} size="sm" />
                            <span
                              className={`text-xs truncate ${
                                awayIsOurs
                                  ? 'font-extrabold text-emerald-800 dark:text-emerald-300'
                                  : 'font-semibold text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {match.awayTeam}
                            </span>
                          </div>
                          {match.awayScore !== null && (
                            <span className="text-xs font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                              {match.awayScore}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Players & Google Maps Venue Link */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {match.players.map((p) => {
                            const fullPlayer = playerById.get(p.playerId);
                            return (
                              <button
                                key={p.playerId}
                                type="button"
                                onClick={() => fullPlayer && onSelectPlayer(fullPlayer, 'male')}
                                className="text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md transition-colors"
                              >
                                {p.playerName}
                              </button>
                            );
                          })}
                        </div>

                        {match.venue && (
                          <a
                            href={getGoogleMapsUrl(match.venue)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={isHe ? 'ניווט בגוגל מפות' : 'Navigate with Google Maps'}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[190px]"
                          >
                            <Navigation className="w-3 h-3 shrink-0" />
                            <span className="truncate">{match.venue}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Chronological Visual Timeline */
        <div className="space-y-7">
          {timelineGroups.map((group) => (
            <section key={group.dateKey} className="space-y-3">
              {/* Day Group Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-extrabold ${
                    group.isToday
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {group.isToday && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  <span>{group.label}</span>
                </div>
                <div className="flex-1 h-px bg-slate-200/80 dark:bg-slate-800" />
                <span className="text-[11px] font-bold font-mono-tabular text-slate-400 dark:text-slate-500">
                  {group.items.length} {isHe ? (group.items.length === 1 ? 'משחק' : 'משחקים') : group.items.length === 1 ? 'match' : 'matches'}
                </span>
              </div>

              {/* Vertical Timeline Rail & Nodes */}
              <div className={`relative ${isHe ? 'pr-6 sm:pr-8' : 'pl-6 sm:pl-8'} space-y-3.5`}>
                {/* Vertical Spine */}
                <div
                  aria-hidden="true"
                  className={`absolute top-3 bottom-3 w-px bg-slate-200 dark:bg-slate-800 ${
                    isHe ? 'right-2.5 sm:right-3' : 'left-2.5 sm:left-3'
                  }`}
                />

                {group.items.map((match) => {
                  const countdown = getRelativeCountdown(match.dateTime, match.hasTime, isHe);
                  const homeIsOurs = match.agencySides.includes('home');
                  const awayIsOurs = match.agencySides.includes('away');
                  const isCup = match.competitionType === 'cup';
                  const isOverlap = overlapMatchIds.has(match.id);
                  const isDoubleheader = doubleheaderMatchIds.has(match.id);
                  const isAgencyMatchup = agencyMatchupIds.has(match.id);

                  return (
                    <div key={match.id} className="relative">
                      {/* Timeline Node Marker */}
                      <div
                        aria-hidden="true"
                        className={`absolute top-5 w-3 h-3 rounded-full ring-4 ring-[#F7F8FA] dark:ring-slate-950 ${
                          isHe ? '-right-[19px] sm:-right-[25px]' : '-left-[19px] sm:-left-[25px]'
                        } ${
                          countdown.isLive
                            ? 'bg-rose-500 animate-pulse'
                            : isCup
                            ? 'bg-amber-500'
                            : countdown.isUrgent
                            ? 'bg-emerald-500'
                            : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                      />

                      {/* Match Card */}
                      <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors p-4 sm:p-5 shadow-2xs space-y-3.5">
                        {/* Top Row: Time + Tier + State Cup / League + Clash Flags + Countdown */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-sm font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {match.hasTime ? formatTimeHHMM(match.dateTime) : isHe ? 'שעה טרם נקבעה' : 'Time TBD'}
                            </span>

                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-extrabold font-mono-tabular ${getTierAccentClasses(
                                match.tier
                              )}`}
                            >
                              {match.tier} · {match.ageGroupHe}
                            </span>

                            {isCup ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-300/80 dark:border-amber-700/70 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold">
                                <Trophy className="w-3 h-3" />
                                <span>{match.leagueName}</span>
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {match.leagueName}
                              </span>
                            )}

                            {(match.roundBoxName || typeof match.round === 'number') && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono-tabular">
                                · {match.roundBoxName ? match.roundBoxName : isHe ? `מחזור ${match.round}` : `Round ${match.round}`}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {isOverlap && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="w-3 h-3" />
                                {isHe ? 'חפיפת שעות' : 'Kickoff overlap'}
                              </span>
                            )}
                            {isDoubleheader && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                <MapPin className="w-3 h-3" />
                                {isHe ? 'דאבל במגרש' : 'Same venue'}
                              </span>
                            )}
                            {isAgencyMatchup && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                <Users className="w-3 h-3" />
                                {isHe ? 'דרבי סוכנות' : 'Agency matchup'}
                              </span>
                            )}

                            <span
                              className={`text-[11px] font-extrabold font-mono-tabular px-2 py-0.5 rounded-md ${
                                countdown.isLive
                                  ? 'bg-rose-500 text-white'
                                  : countdown.isUrgent
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {countdown.label}
                            </span>

                            <a
                              href={match.leagueUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={isHe ? 'פתח ב-JuniorLeague' : 'Open in JuniorLeague'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Middle Matchup Row with Club-Colored Shields */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-2.5 md:gap-4 rounded-xl bg-slate-50/85 dark:bg-slate-800/45 border border-slate-200/70 dark:border-slate-800 px-3.5 py-3">
                          {/* Home Team */}
                          <div className="flex items-center justify-between md:justify-end gap-2.5 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              {homeIsOurs && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 shrink-0">
                                  {isHe ? 'בית' : 'HOME'}
                                </span>
                              )}
                              <span
                                className={`text-sm truncate ${
                                  homeIsOurs
                                    ? 'font-extrabold text-emerald-800 dark:text-emerald-300'
                                    : 'font-semibold text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                {match.homeTeam}
                              </span>
                            </div>
                            <ClubShield teamName={match.homeTeam} highlighted={homeIsOurs} size="md" />
                          </div>

                          {/* Score / VS */}
                          <div className="flex items-center justify-center">
                            {match.homeScore !== null && match.awayScore !== null ? (
                              <span className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold font-mono-tabular">
                                {match.homeScore} - {match.awayScore}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-400 dark:text-slate-500">
                                VS
                              </span>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-between md:justify-start gap-2.5 min-w-0">
                            <ClubShield teamName={match.awayTeam} highlighted={awayIsOurs} size="md" />
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-sm truncate ${
                                  awayIsOurs
                                    ? 'font-extrabold text-emerald-800 dark:text-emerald-300'
                                    : 'font-semibold text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                {match.awayTeam}
                              </span>
                              {awayIsOurs && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 shrink-0">
                                  {isHe ? 'חוץ' : 'AWAY'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Participating Agency Players + One-Click Google Maps Venue */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {match.players.map((participant) => {
                              const fullPlayer = playerById.get(participant.playerId);
                              return (
                                <button
                                  key={participant.playerId}
                                  type="button"
                                  onClick={() => fullPlayer && onSelectPlayer(fullPlayer, 'male')}
                                  className="group inline-flex items-center gap-2 ps-1.5 pe-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-start"
                                >
                                  {participant.photoUrl ? (
                                    <img
                                      src={participant.photoUrl}
                                      alt={participant.playerName}
                                      className="w-6 h-6 rounded-lg object-cover shrink-0 bg-slate-200 dark:bg-slate-700"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {getInitials(participant.playerName)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                                      {participant.playerName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                      {participant.side === 'home'
                                        ? isHe
                                          ? 'קבוצה מארחת'
                                          : 'Home'
                                        : isHe
                                        ? 'קבוצת חוץ'
                                        : 'Away'}
                                      {participant.position ? ` · ${participant.position.split('(')[0].trim()}` : ''}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {match.venue && (
                            <a
                              href={getGoogleMapsUrl(match.venue)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={isHe ? 'פתח ניווט בגוגל מפות' : 'Navigate with Google Maps'}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors shrink-0"
                            >
                              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="truncate max-w-[240px]">{match.venue}</span>
                              <Navigation className="w-3 h-3 text-blue-500 shrink-0" />
                            </a>
                          )}
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Collapsible Roster Coverage Panel for Players Without Upcoming 7d Matches */}
      {eligibleMaleYouthPlayers.length > 0 && coverageIssues.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCoverageDetails((prev) => !prev)}
            className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span>
              {isHe
                ? `שחקני נוער (U14–U17) ללא משחקים ב-7 הימים הקרובים (${coverageIssues.length})`
                : `U14–U17 players with no matches in the next 7 days (${coverageIssues.length})`}
            </span>
            {showCoverageDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showCoverageDetails && (
            <div className="border-t border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
              {coverageIssues.map((item) => {
                const fullPlayer = playerById.get(item.playerId);
                return (
                  <div
                    key={item.playerId}
                    className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold font-mono-tabular shrink-0 ${getTierAccentClasses(
                          item.tier
                        )}`}
                      >
                        {item.tier}
                      </span>
                      <button
                        type="button"
                        onClick={() => fullPlayer && onSelectPlayer(fullPlayer, 'male')}
                        className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate"
                      >
                        {item.playerName}
                      </button>
                      <span className="text-slate-400 truncate">· {item.clubName || '—'}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.reason === 'no_club'
                        ? isHe
                          ? 'לא הוגדר מועדון בפרופיל השחקן'
                          : 'No club assigned on player profile'
                        : item.reason === 'no_team_match'
                        ? isHe
                          ? 'הקבוצה לא נמצאה בליגות U14–U17 ב-JuniorLeague'
                          : 'Club not found in JuniorLeague U14–U17 divisions'
                        : isHe
                        ? `זוהה (${item.matchedTeamNames[0] || ''}) — אין משחק ב-7 ימים הקרובים`
                        : `Matched (${item.matchedTeamNames[0] || ''}) — no fixture in next 7 days`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

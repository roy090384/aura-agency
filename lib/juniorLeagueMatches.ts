import { YouthCategory } from '../src/types/player.ts';

const JL_API_BASE = 'https://junior-league-api-server-928016183646.us-central1.run.app';
const JL_SITE_BASE = 'https://www.juniorleague.co.il';

export type SupportedYouthTier = 'U14' | 'U15' | 'U16' | 'U17';

export interface YouthMatchRequestPlayer {
  id: string;
  name: string;
  photoUrl?: string;
  clubName: string;
  league?: string;
  position?: string;
  age?: number;
  youthCategory?: YouthCategory;
}

export interface JuniorLeagueApiMatch {
  id: string;
  homeTeamId?: string;
  awayTeamId?: string;
  excludeFromLeagueTable?: boolean;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  dateTime: string;
  hasTime?: boolean;
  venue?: string;
  round?: number;
  roundBoxName?: string;
}

interface JuniorLeagueSummaryItem {
  name: string;
  ageGroupName: string;
}

interface JuniorLeagueCupItem {
  id: string;
  name: string;
  ageGroupName?: string | null;
}

export interface YouthMatchParticipant {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  position?: string;
  clubName: string;
  youthCategory: SupportedYouthTier;
  side: 'home' | 'away';
}

export interface YouthMatchTimelineItem {
  id: string;
  tier: SupportedYouthTier;
  competitionType: 'league' | 'cup';
  ageGroupHe: string;
  leagueName: string;
  leagueUrl: string;
  round?: number;
  roundBoxName?: string;
  dateTime: string;
  hasTime: boolean;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  venue?: string;
  agencySides: ('home' | 'away')[];
  players: YouthMatchParticipant[];
}

export interface YouthPlayerCoverage {
  playerId: string;
  playerName: string;
  clubName: string;
  tier: SupportedYouthTier;
  matchedTeamNames: string[];
  upcomingMatchCount: number;
  reason?: 'no_club' | 'no_team_match' | 'no_fixtures_7d';
}

export interface YouthMatchesResponse {
  matches: YouthMatchTimelineItem[];
  coverage: YouthPlayerCoverage[];
  scannedLeaguesCount: number;
  relevantClubsCount: number;
  daysAhead: number;
  fetchedAt: string;
}

const TIER_TO_JL_AGE_GROUP: Record<SupportedYouthTier, string> = {
  U17: 'נערים א',
  U16: 'נערים ב',
  U15: 'נערים ג',
  U14: 'ילדים א',
};

const TIER_TO_JL_AGE_LABEL_HE: Record<SupportedYouthTier, string> = {
  U17: "נערים א'",
  U16: "נערים ב'",
  U15: "נערים ג'",
  U14: "ילדים א'",
};

// Bilingual club lookup mapping (English names -> Hebrew canonical tokens)
const ENGLISH_CLUB_TO_HEBREW_ALIASES: Array<[RegExp, string[]]> = [
  [/maccabi tel aviv|maccabi t\.?a\.?/i, ['מכבי תל אביב', 'מכבי תא']],
  [/maccabi haifa/i, ['מכבי חיפה']],
  [/hapoel tel aviv|hapoel t\.?a\.?/i, ['הפועל תל אביב', 'הפועל תא']],
  [/beitar jerusalem/i, ['ביתר ירושלים', 'ביתר ים']],
  [/maccabi petah tikva|maccabi p\.?t\.?/i, ['מכבי פתח תקווה', 'מכבי פת']],
  [/fc ashdod|m\.?s\.?\s*ashdod/i, ['מס אשדוד', 'מכבי ספורט אשדוד', 'אשדוד']],
  [/hapoel be.?er sheva|hapoel b\.?s\.?/i, ['הפועל באר שבע', 'הפועל בש']],
  [/maccabi be.?er sheva/i, ['מכבי באר שבע', 'מכבי בש']],
  [/maccabi netanya/i, ['מכבי נתניה']],
  [/hapoel haifa/i, ['הפועל חיפה']],
  [/hapoel.*jerusalem|hapoel katamon/i, ['הפועל ירושלים', 'הפועל י-ם', 'הפועל קטמון']],
  [/hapoel petah tikva|hapoel p\.?t\.?/i, ['הפועל פתח תקווה', 'הפועל פת']],
  [/bnei sakhnin/i, ['בני סכנין']],
  [/hapoel.*kiryat shmona|kiryat shmona/i, ['הפועל קריית שמונה', 'קריית שמונה', 'קרית שמונה', 'קש']],
  [/hapoel hadera/i, ['הפועל חדרה']],
  [/hapoel ra.?anana/i, ['הפועל רעננה']],
  [/bnei yehuda/i, ['בני יהודה']],
  [/hapoel.*kfar[\s-]?saba/i, ['הפועל כפר סבא', 'הפועל כפס']],
  [/hapoel.*rishon/i, ['הפועל ראשון לציון', 'הפועל ראשלצ']],
  [/hapoel ramat gan/i, ['הפועל רמת גן', 'הפועל רג']],
  [/ramat hasharon/i, ['הפועל רמת השרון', 'הפועל ניר רמת השרון', 'רמת השרון']],
  [/maccabi herzliya/i, ['מכבי הרצליה']],
  [/hapoel herzliya/i, ['הפועל הרצליה']],
  [/tubruk|tobruk/i, ['ביתר טוברוק', 'טוברוק']],
  [/hapoel acre|hapoel akko/i, ['הפועל עכו']],
  [/nof hagalil/i, ['נוף הגליל', 'הפועל נוף הגליל']],
  [/ironi modiin|modiin/i, ['עירוני מודיעין']],
  [/hapoel afula/i, ['הפועל עפולה']],
  [/nes tziona|ness ziona/i, ['סקציה נס ציונה', 'נס ציונה']],
  [/maccabi yavne/i, ['מכבי יבנה']],
  [/kiryat ata/i, ['קריית אתא', 'קרית אתא']],
  [/kabilio jaffa|maccabi jaffa/i, ['מכבי יפו']],
  [/umm al.?fahm/i, ['הפועל אום אל פחם', 'אום אל פחם']],
  [/kiryat yam/i, ['קריית ים', 'קרית ים']],
  [/shimshon tel aviv/i, ['שמשון תל אביב', 'שמשון תא']],
  [/kiryat gat/i, ['קריית גת', 'קרית גת']],
  [/kfar qasim|kfar kasem/i, ['כפר קאסם']],
  [/ironi tiberias|tiberias/i, ['עירוני טבריה', 'טבריה']],
  [/bnei reineh|reineh/i, ['בני ריינה']],
  [/hapoel kfar shalem/i, ['כפר שלם']],
  [/gadna/i, ['גדנע']],
  [/neve yosef/i, ['נווה יוסף']],
  [/hapoel maccabi.*rehovot|maccabi rehovot|rehovot/i, ['רחובות']],
  [/hapoel holon|holon/i, ['חולון']],
  [/hapoel bat yam|bat yam/i, ['בת ים']],
  [/hapoel hod hasharon|hod hasharon/i, ['הוד השרון']],
  [/maccabi.*ashkelon|hapoel ashkelon|ashkelon/i, ['אשקלון']],
  [/karmiel/i, ['כרמיאל']],
  [/nahariya/i, ['נהריה']],
];

const LEAGUES_CACHE_TTL_MS = 30 * 60 * 1000;
const MATCHES_CACHE_TTL_MS = 15 * 60 * 1000;

let cachedLeaguesIndex: { expiresAt: number; leaguesByAgeGroup: Record<string, JuniorLeagueSummaryItem[]> } | null = null;
let cachedCupsIndex: { expiresAt: number; cups: JuniorLeagueCupItem[] } | null = null;
const leagueMatchesCache = new Map<string, { expiresAt: number; leagueName: string; matches: JuniorLeagueApiMatch[] }>();
const cupMatchesCache = new Map<string, { expiresAt: number; cupName: string; matches: JuniorLeagueApiMatch[] }>();

export function resolveSupportedYouthTier(player: YouthMatchRequestPlayer): SupportedYouthTier | null {
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

function replaceHebrewToken(padded: string, tokenPattern: string, replacement: string): string {
  return padded.replace(new RegExp(` ${tokenPattern}(?= )`, 'g'), ` ${replacement}`);
}

export function normalizeHebrewClubString(input: string): string {
  if (!input) return '';
  let s = input
    .toLowerCase()
    .replace(/[\u0591-\u05C7]/g, '') // strip Hebrew niqqud
    .replace(/["'״׳`´’‘]/g, '')
    .replace(/[.\-_/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!s) return '';

  // Pad with spaces because JS \b does NOT match Hebrew word boundaries
  let padded = ` ${s} `;

  padded = replaceHebrewToken(padded, 'מ ס', 'מס');
  padded = replaceHebrewToken(padded, 'מ כ', 'מכ');
  padded = replaceHebrewToken(padded, 'א א פא?חם', 'אום אל פחם');
  padded = replaceHebrewToken(padded, 'הפ', 'הפועל');
  padded = replaceHebrewToken(padded, 'מ', 'מכבי');
  padded = replaceHebrewToken(padded, 'תא', 'תל אביב');
  padded = replaceHebrewToken(padded, 'פת', 'פתח תקווה');
  padded = replaceHebrewToken(padded, 'בש', 'באר שבע');
  padded = replaceHebrewToken(padded, 'ראשלצ', 'ראשון לציון');
  padded = replaceHebrewToken(padded, 'רמהש', 'רמת השרון');
  padded = replaceHebrewToken(padded, 'רג', 'רמת גן');
  padded = replaceHebrewToken(padded, 'כפס', 'כפר סבא');
  padded = replaceHebrewToken(padded, 'קש', 'קרית שמונה');
  padded = replaceHebrewToken(padded, 'י ם', 'ירושלים');
  padded = replaceHebrewToken(padded, 'ים', 'ירושלים');
  padded = replaceHebrewToken(padded, 'עיר', 'עירוני');

  s = padded
    .replace(/תקוה/g, 'תקווה')
    .replace(/קריית/g, 'קרית')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

function buildNormalizedClubAliases(clubName: string): string[] {
  const aliases = new Set<string>();
  const raw = (clubName || '').trim();
  if (!raw || /free agent|ללא קבוצה|other\s*\/\s*free agent/i.test(raw)) {
    return [];
  }

  // Extract parenthetical segments and outer text e.g. "Maccabi Haifa (מכבי חיפה)"
  const parts = raw
    .split(/[()]/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of [raw, ...parts]) {
    if (/[\u0590-\u05FF]/.test(part)) {
      const norm = normalizeHebrewClubString(part);
      if (norm.length >= 2) {
        aliases.add(norm);
        // Handle clubs whose formal name includes a sponsor/middle word (e.g. "הפועל ניר רמת השרון" vs "הפ' רמה\"ש")
        if (norm.includes(' ניר ')) {
          aliases.add(norm.replace(' ניר ', ' '));
        }
        // Handle "הפועל קטמון ירושלים" vs "הפ' ירושלים"
        if (norm.includes(' קטמון ')) {
          aliases.add(norm.replace(' קטמון ', ' '));
        }
      }
    }
    for (const [regex, heNames] of ENGLISH_CLUB_TO_HEBREW_ALIASES) {
      if (regex.test(part)) {
        for (const h of heNames) {
          const norm = normalizeHebrewClubString(h);
          if (norm) aliases.add(norm);
        }
      }
    }
  }

  return Array.from(aliases);
}

function scoreClubMatch(playerAliases: string[], teamName: string): number {
  if (playerAliases.length === 0 || !teamName) return 0;
  const normTeam = normalizeHebrewClubString(teamName);
  if (!normTeam) return 0;

  let bestScore = 0;
  for (const alias of playerAliases) {
    if (normTeam === alias) {
      return 100;
    }
    // Exact prefix or whole-token containment e.g. "מכבי חיפה שמואל" vs "מכבי חיפה"
    if (normTeam.startsWith(`${alias} `) || normTeam.endsWith(` ${alias}`)) {
      bestScore = Math.max(bestScore, 85);
      continue;
    }
    if (normTeam.includes(alias) && alias.length >= 5) {
      bestScore = Math.max(bestScore, 75);
      continue;
    }
    // Reverse containment if player club includes extra descriptor (e.g. "בני יהודה תל אביב" vs "בני יהודה")
    if (alias.startsWith(`${normTeam} `) && normTeam.length >= 5) {
      bestScore = Math.max(bestScore, 82);
    }
  }
  return bestScore;
}

function getLeaguePreferenceBoost(playerLeague: string | undefined, jlLeagueName: string): number {
  const pl = (playerLeague || '').toLowerCase();
  const jl = normalizeHebrewClubString(jlLeagueName);
  if (!jl) return 0;
  const paddedJl = ` ${jl} `;

  let score = 0;
  if (pl) {
    if ((/premier|על/.test(pl)) && paddedJl.includes(' על ')) score += 30;
    if ((/national|לאומית/.test(pl)) && jl.includes('לאומית')) score += 30;
    if ((/ארצית/.test(pl)) && jl.includes('ארצית')) score += 25;
    if ((/north|צפון/.test(pl)) && jl.includes('צפון')) score += 15;
    if ((/south|דרום/.test(pl)) && jl.includes('דרום')) score += 15;
    if ((/center|מרכז/.test(pl)) && jl.includes('מרכז')) score += 15;
    if ((/sharon|שרון/.test(pl)) && jl.includes('שרון')) score += 15;
    if ((/dan|דן/.test(pl)) && paddedJl.includes(' דן ')) score += 15;
    if ((/shfela|שפלה/.test(pl)) && jl.includes('שפלה')) score += 15;
  } else {
    // Mild natural tier preference when club appears in multiple divisions
    if (paddedJl.includes(' על ')) score += 6;
    else if (jl.includes('לאומית')) score += 4;
    else if (jl.includes('ארצית')) score += 2;
  }
  return score;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 9000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BritSportGroupCRM/1.0',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getLeaguesIndex(forceRefresh = false): Promise<Record<string, JuniorLeagueSummaryItem[]>> {
  if (!forceRefresh && cachedLeaguesIndex && cachedLeaguesIndex.expiresAt > Date.now()) {
    return cachedLeaguesIndex.leaguesByAgeGroup;
  }

  const data = await fetchJsonWithTimeout<{ leagues?: Record<string, JuniorLeagueSummaryItem[]> }>(
    `${JL_API_BASE}/api/public/leagues`,
    10000
  );

  if (data?.leagues && typeof data.leagues === 'object') {
    cachedLeaguesIndex = {
      expiresAt: Date.now() + LEAGUES_CACHE_TTL_MS,
      leaguesByAgeGroup: data.leagues,
    };
    return data.leagues;
  }

  return cachedLeaguesIndex?.leaguesByAgeGroup || {};
}

async function getLeagueMatches(
  leagueName: string,
  forceRefresh = false
): Promise<{ leagueName: string; matches: JuniorLeagueApiMatch[] }> {
  const key = leagueName.trim();
  if (!forceRefresh) {
    const hit = leagueMatchesCache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return { leagueName: hit.leagueName, matches: hit.matches };
    }
  }

  const encoded = encodeURIComponent(key);
  const data = await fetchJsonWithTimeout<{
    league?: { name?: string };
    matches?: JuniorLeagueApiMatch[];
  }>(`${JL_API_BASE}/api/public/leagues/${encoded}/matches`, 10000);

  const resolvedName = data?.league?.name || key;
  const matches = Array.isArray(data?.matches) ? data!.matches : [];

  if (data) {
    leagueMatchesCache.set(key, {
      expiresAt: Date.now() + MATCHES_CACHE_TTL_MS,
      leagueName: resolvedName,
      matches,
    });
  }

  return { leagueName: resolvedName, matches };
}

async function getCupsIndex(forceRefresh = false): Promise<JuniorLeagueCupItem[]> {
  if (!forceRefresh && cachedCupsIndex && cachedCupsIndex.expiresAt > Date.now()) {
    return cachedCupsIndex.cups;
  }

  const data = await fetchJsonWithTimeout<{ cups?: JuniorLeagueCupItem[] }>(
    `${JL_API_BASE}/api/public/cups`,
    10000
  );

  if (Array.isArray(data?.cups)) {
    cachedCupsIndex = {
      expiresAt: Date.now() + LEAGUES_CACHE_TTL_MS,
      cups: data!.cups,
    };
    return data!.cups;
  }

  return cachedCupsIndex?.cups || [];
}

async function getCupMatches(
  cupName: string,
  forceRefresh = false
): Promise<{ cupName: string; matches: JuniorLeagueApiMatch[] }> {
  const key = cupName.trim();
  if (!forceRefresh) {
    const hit = cupMatchesCache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return { cupName: hit.cupName, matches: hit.matches };
    }
  }

  const encoded = encodeURIComponent(key);
  const data = await fetchJsonWithTimeout<{
    cup?: { name?: string };
    matches?: JuniorLeagueApiMatch[];
  }>(`${JL_API_BASE}/api/public/cups/${encoded}/matches`, 10000);

  const resolvedName = data?.cup?.name || key;
  const matches = Array.isArray(data?.matches) ? data!.matches : [];

  if (data) {
    cupMatchesCache.set(key, {
      expiresAt: Date.now() + MATCHES_CACHE_TTL_MS,
      cupName: resolvedName,
      matches,
    });
  }

  return { cupName: resolvedName, matches };
}

function buildJuniorLeagueUrl(leagueName: string, competitionType: 'league' | 'cup' = 'league'): string {
  if (competitionType === 'cup') {
    return `${JL_SITE_BASE}/category/${encodeURIComponent('גביע-המדינה')}/`;
  }
  const slug = leagueName
    .replace(/['"״׳]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${JL_SITE_BASE}/${encodeURIComponent(`${slug}-26-27`)}/`;
}

export async function fetchYouthMatchesFromJuniorLeague(
  rawPlayers: YouthMatchRequestPlayer[],
  options?: { daysAhead?: number; forceRefresh?: boolean }
): Promise<YouthMatchesResponse> {
  const daysAhead = Math.min(14, Math.max(1, options?.daysAhead ?? 7));
  const forceRefresh = Boolean(options?.forceRefresh);
  const fetchedAt = new Date().toISOString();

  // Filter strictly to male youth roster tiers U14-U17
  const eligiblePlayers = rawPlayers
    .map((p) => {
      const tier = resolveSupportedYouthTier(p);
      return tier ? { player: p, tier } : null;
    })
    .filter((x): x is { player: YouthMatchRequestPlayer; tier: SupportedYouthTier } => Boolean(x));

  if (eligiblePlayers.length === 0) {
    return {
      matches: [],
      coverage: [],
      scannedLeaguesCount: 0,
      relevantClubsCount: 0,
      daysAhead,
      fetchedAt,
    };
  }

  const [leaguesByAgeGroup, allCups] = await Promise.all([
    getLeaguesIndex(forceRefresh),
    getCupsIndex(forceRefresh),
  ]);

  // Determine which JuniorLeague age groups (Leagues + State Cups) we need to fetch
  const neededTiers = Array.from(new Set(eligiblePlayers.map((x) => x.tier)));
  const competitionsToFetch: Array<{
    tier: SupportedYouthTier;
    competitionType: 'league' | 'cup';
    ageGroupHe: string;
    competitionName: string;
  }> = [];

  for (const tier of neededTiers) {
    const jlKey = TIER_TO_JL_AGE_GROUP[tier];
    const items = leaguesByAgeGroup[jlKey] || [];
    for (const item of items) {
      if (item?.name) {
        competitionsToFetch.push({
          tier,
          competitionType: 'league',
          ageGroupHe: TIER_TO_JL_AGE_LABEL_HE[tier],
          competitionName: item.name,
        });
      }
    }

    // Match Male State Cups for this U14-U17 tier
    const tierCups = allCups.filter(
      (c) =>
        c?.ageGroupName === jlKey &&
        !/ילדות|נערות|נשים/.test(c.name || '')
    );
    for (const cup of tierCups) {
      if (cup?.name) {
        competitionsToFetch.push({
          tier,
          competitionType: 'cup',
          ageGroupHe: TIER_TO_JL_AGE_LABEL_HE[tier],
          competitionName: cup.name,
        });
      }
    }
  }

  // Fetch leagues & cups with modest concurrency
  const competitionDataMap = new Map<
    string,
    {
      tier: SupportedYouthTier;
      competitionType: 'league' | 'cup';
      ageGroupHe: string;
      leagueName: string;
      matches: JuniorLeagueApiMatch[];
    }
  >();
  const CONCURRENCY = 6;
  for (let i = 0; i < competitionsToFetch.length; i += CONCURRENCY) {
    const batch = competitionsToFetch.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      batch.map(async (entry) => {
        if (entry.competitionType === 'cup') {
          const res = await getCupMatches(entry.competitionName, forceRefresh);
          return {
            tier: entry.tier,
            competitionType: 'cup' as const,
            ageGroupHe: entry.ageGroupHe,
            leagueName: res.cupName,
            matches: res.matches,
          };
        }
        const res = await getLeagueMatches(entry.competitionName, forceRefresh);
        return {
          tier: entry.tier,
          competitionType: 'league' as const,
          ageGroupHe: entry.ageGroupHe,
          leagueName: res.leagueName,
          matches: res.matches,
        };
      })
    );
    for (const row of settled) {
      competitionDataMap.set(`${row.tier}::${row.competitionType}::${row.leagueName}`, row);
    }
  }

  const nowMs = Date.now();
  const minCutoffMs = nowMs - 2 * 60 * 60 * 1000; // Include matches started up to 2h ago (live)
  const maxCutoffMs = nowMs + daysAhead * 24 * 60 * 60 * 1000;

  // Map matchId -> aggregated YouthMatchTimelineItem
  const matchTimelineMap = new Map<string, YouthMatchTimelineItem>();
  const coverage: YouthPlayerCoverage[] = [];
  const relevantClubKeys = new Set<string>();

  for (const { player, tier } of eligiblePlayers) {
    const aliases = buildNormalizedClubAliases(player.clubName);
    if (aliases.length === 0) {
      coverage.push({
        playerId: player.id,
        playerName: player.name,
        clubName: player.clubName,
        tier,
        matchedTeamNames: [],
        upcomingMatchCount: 0,
        reason: 'no_club',
      });
      continue;
    }

    relevantClubKeys.add(`${tier}::${aliases[0]}`);

    // Find all teams matching this player's club within their tier (Leagues + State Cups)
    interface CandidateMatch {
      competitionType: 'league' | 'cup';
      leagueName: string;
      ageGroupHe: string;
      match: JuniorLeagueApiMatch;
      side: 'home' | 'away';
      matchedTeamName: string;
      teamScore: number;
      leagueBoost: number;
    }

    const candidates: CandidateMatch[] = [];
    for (const entry of competitionDataMap.values()) {
      if (entry.tier !== tier) continue;
      const leagueBoost =
        entry.competitionType === 'league'
          ? getLeaguePreferenceBoost(player.league, entry.leagueName)
          : 0;

      for (const m of entry.matches) {
        const homeScoreMatch = scoreClubMatch(aliases, m.homeTeam);
        const awayScoreMatch = scoreClubMatch(aliases, m.awayTeam);

        if (homeScoreMatch > 0) {
          candidates.push({
            competitionType: entry.competitionType,
            leagueName: entry.leagueName,
            ageGroupHe: entry.ageGroupHe,
            match: m,
            side: 'home',
            matchedTeamName: m.homeTeam,
            teamScore: homeScoreMatch,
            leagueBoost,
          });
        }
        if (awayScoreMatch > 0) {
          candidates.push({
            competitionType: entry.competitionType,
            leagueName: entry.leagueName,
            ageGroupHe: entry.ageGroupHe,
            match: m,
            side: 'away',
            matchedTeamName: m.awayTeam,
            teamScore: awayScoreMatch,
            leagueBoost,
          });
        }
      }
    }

    if (candidates.length === 0) {
      coverage.push({
        playerId: player.id,
        playerName: player.name,
        clubName: player.clubName,
        tier,
        matchedTeamNames: [],
        upcomingMatchCount: 0,
        reason: 'no_team_match',
      });
      continue;
    }

    // Rank league pairs & cup pairs separately so State Cup games aren't suppressed by league boosts
    const leaguePairScores = new Map<string, { leagueName: string; matchedTeamName: string; totalScore: number }>();
    const cupPairScores = new Map<string, { leagueName: string; matchedTeamName: string; totalScore: number }>();

    for (const c of candidates) {
      const pairKey = `${c.competitionType}::${c.leagueName}::${c.matchedTeamName}`;
      const totalScore = c.teamScore + c.leagueBoost;
      const targetMap = c.competitionType === 'cup' ? cupPairScores : leaguePairScores;
      const existing = targetMap.get(pairKey);
      if (!existing || totalScore > existing.totalScore) {
        targetMap.set(pairKey, {
          leagueName: c.leagueName,
          matchedTeamName: c.matchedTeamName,
          totalScore,
        });
      }
    }

    const acceptedPairs = new Set<string>();
    const matchedLabelList: string[] = [];

    if (leaguePairScores.size > 0) {
      const topLeagueScore = Math.max(...Array.from(leaguePairScores.values()).map((v) => v.totalScore));
      for (const [k, val] of leaguePairScores.entries()) {
        if (val.totalScore >= topLeagueScore - 5) {
          acceptedPairs.add(k);
          matchedLabelList.push(`${val.matchedTeamName} (${val.leagueName})`);
        }
      }
    }

    if (cupPairScores.size > 0) {
      const topCupScore = Math.max(...Array.from(cupPairScores.values()).map((v) => v.totalScore));
      for (const [k, val] of cupPairScores.entries()) {
        if (val.totalScore >= topCupScore - 5 && val.totalScore >= 80) {
          acceptedPairs.add(k);
        }
      }
    }

    const matchedTeamNames = Array.from(new Set(matchedLabelList));
    let playerUpcomingCount = 0;

    for (const c of candidates) {
      const pairKey = `${c.competitionType}::${c.leagueName}::${c.matchedTeamName}`;
      if (!acceptedPairs.has(pairKey)) continue;

      const ts = Date.parse(c.match.dateTime);
      if (Number.isNaN(ts) || ts < minCutoffMs || ts > maxCutoffMs) continue;

      playerUpcomingCount++;

      const globalMatchKey = `${tier}::${c.competitionType}::${c.leagueName}::${c.match.id}`;
      let timelineItem = matchTimelineMap.get(globalMatchKey);
      if (!timelineItem) {
        timelineItem = {
          id: globalMatchKey,
          tier,
          competitionType: c.competitionType,
          ageGroupHe: c.ageGroupHe,
          leagueName: c.leagueName,
          leagueUrl: buildJuniorLeagueUrl(c.leagueName, c.competitionType),
          round: c.match.round,
          roundBoxName: c.match.roundBoxName,
          dateTime: c.match.dateTime,
          hasTime: c.match.hasTime !== false,
          homeTeam: c.match.homeTeam,
          awayTeam: c.match.awayTeam,
          homeScore: c.match.homeScore ?? null,
          awayScore: c.match.awayScore ?? null,
          venue: c.match.venue,
          agencySides: [c.side],
          players: [],
        };
        matchTimelineMap.set(globalMatchKey, timelineItem);
      } else if (!timelineItem.agencySides.includes(c.side)) {
        timelineItem.agencySides.push(c.side);
      }

      if (!timelineItem.players.some((p) => p.playerId === player.id)) {
        timelineItem.players.push({
          playerId: player.id,
          playerName: player.name,
          photoUrl: player.photoUrl,
          position: player.position,
          clubName: player.clubName,
          youthCategory: tier,
          side: c.side,
        });
      }
    }

    coverage.push({
      playerId: player.id,
      playerName: player.name,
      clubName: player.clubName,
      tier,
      matchedTeamNames,
      upcomingMatchCount: playerUpcomingCount,
      reason: playerUpcomingCount === 0 ? 'no_fixtures_7d' : undefined,
    });
  }

  const matches = Array.from(matchTimelineMap.values()).sort(
    (a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime)
  );

  return {
    matches,
    coverage,
    scannedLeaguesCount: competitionsToFetch.length,
    relevantClubsCount: relevantClubKeys.size,
    daysAhead,
    fetchedAt,
  };
}

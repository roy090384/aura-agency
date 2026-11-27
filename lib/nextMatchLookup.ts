import { GoogleGenAI } from '@google/genai';

export interface NextMatchRequestItem {
  key: string; // e.g. "female:p1" or "male:m2"
  playerId: string;
  rosterType: 'female' | 'male';
  playerName: string;
  clubName: string;
  league?: string;
  youthCategory?: string;
  nationality?: string;
}

export interface MatchSourceLink {
  title: string;
  url: string;
}

export interface UpcomingMatchFixture {
  id: string;
  homeTeam?: string;
  awayTeam?: string;
  opponent: string;
  opponentLogoUrl?: string;
  isHome?: boolean;
  kickoffIso: string;
  competition?: string;
  venue?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface NextMatchResult {
  key: string;
  playerId: string;
  rosterType: 'female' | 'male';
  status: 'found' | 'not_found' | 'error';
  homeTeam?: string;
  awayTeam?: string;
  opponent?: string;
  opponentLogoUrl?: string;
  isHome?: boolean;
  kickoffIso?: string;
  competition?: string;
  venue?: string;
  matchedTeamName?: string;
  teamScopeNote?: string;
  sourceName?: string;
  sourceUrl?: string;
  sources?: MatchSourceLink[];
  upcomingMatches7d?: UpcomingMatchFixture[];
  lookupLinks: { label: string; url: string }[];
  fetchedAt: string;
  errorMessage?: string;
}

const HEBREW_TO_ENGLISH_CLUBS: Array<[RegExp, string]> = [
  [/מכבי תל אביב|מכבי ת"א/i, 'Maccabi Tel Aviv'],
  [/מכבי חיפה/i, 'Maccabi Haifa'],
  [/הפועל תל אביב|הפועל ת"א/i, 'Hapoel Tel Aviv'],
  [/בית"ר ירושלים|ביתר ירושלים/i, 'Beitar Jerusalem'],
  [/הפועל קטמון ירושלים|הפועל ירושלים|הפ['"״׳]?\s*ירושלים|הפועל י-?ם/i, 'Hapoel Jerusalem'],
  [/מכבי פתח[\s-]?תקווה|מכבי פ"ת/i, 'Maccabi Petah Tikva'],
  [/הפועל פתח[\s-]?תקווה|הפועל פ"ת/i, 'Hapoel Petah Tikva'],
  [/מועדון ספורט אשדוד|מ\.?ס\.?\s*אשדוד/i, 'FC Ashdod'],
  [/הפועל באר[\s-]?שבע|הפועל ב"ש/i, 'Hapoel Beer Sheva'],
  [/מכבי באר[\s-]?שבע/i, 'Maccabi Beer Sheva'],
  [/מכבי נתניה/i, 'Maccabi Netanya'],
  [/הפועל חיפה/i, 'Hapoel Haifa'],
  [/בני סכנין/i, 'Bnei Sakhnin'],
  [/הפועל קרי?ית שמונה/i, 'Hapoel Ironi Kiryat Shmona'],
  [/הפועל חדרה/i, 'Hapoel Hadera'],
  [/מכבי כשרונות חדרה|כשרונות חדרה/i, 'Maccabi Kishronot Hadera'],
  [/הפועל רעננה/i, 'Hapoel Raanana'],
  [/בני יהודה/i, 'Bnei Yehuda Tel Aviv'],
  [/הפועל כפר סבא|הפ['"״׳]?\s*כפ["'״׳]?ס|הפועל כפ["'״׳]?ס/i, 'Hapoel Kfar Saba'],
  [/הפועל ראשון לציון|הפ['"״׳]?\s*ראשל["'״׳]?צ|הפועל ראשל["'״׳]?צ/i, 'Hapoel Rishon LeZion'],
  [/הפועל רמת גן/i, 'Hapoel Ramat Gan'],
  [/הפועל ניר רמת השרון|עירוני רמת השרון|רמת השרון/i, 'Hapoel Nir Ramat HaSharon'],
  [/מכבי הרצליה/i, 'Maccabi Herzliya'],
  [/הפועל הרצליה/i, 'Hapoel Herzliya'],
  [/סקציה נס ציונה/i, 'Sektzia Nes Tziona'],
  [/שמשון.*תל אביב/i, 'Shimshon Tel Aviv'],
  [/מכבי קרי?ית גת|קרי?ית גת/i, 'Maccabi Kiryat Gat'],
  [/אס"א תל אביב|אסא תל אביב/i, 'ASA Tel Aviv'],
  [/הפועל עכו/i, 'Hapoel Acre'],
  [/הפועל נוף הגליל/i, 'Hapoel Nof HaGalil'],
  [/עירוני מודיעין/i, 'Ironi Modiin'],
  [/הפועל עפולה/i, 'Hapoel Afula'],
  [/מכבי יפו/i, 'Maccabi Kabilio Jaffa'],
  [/מכבי יבנה/i, 'Maccabi Yavne'],
  [/קרי?ית ים/i, 'MS Kiryat Yam'],
  [/בית"ר טוברוק/i, 'Beitar Nes Tubruk'],
  [/הפועל אום אל[\s-]?פחם/i, 'Hapoel Umm al-Fahm'],
  [/עירוני טבריה/i, 'Ironi Tiberias'],
  [/מכבי בני ריינה|בני ריינה/i, 'Maccabi Bnei Reineh'],
];

const CACHE_TTL_MS = 10 * 60 * 1000;
const GEMINI_COOLDOWN_MS = 10 * 60 * 1000;
const matchCache = new Map<string, { expiresAt: number; result: Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType'> }>();
const inFlightLookups = new Map<string, Promise<Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType'>>>();

let geminiCooldownUntil = 0;
let geminiQueue: Promise<void> = Promise.resolve();

export function isGeminiQuotaLimited(): boolean {
  return Date.now() < geminiCooldownUntil;
}

function isQuotaOrRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as Record<string, any>;
  if (anyErr.status === 429 || anyErr.code === 429) return true;
  const msg = String(anyErr.message || err);
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

function sanitizeText(val: unknown, maxLen = 120): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen);
}

export function normalizeClubNameForSearch(clubName: string): string {
  const clean = sanitizeText(clubName, 120);
  if (!clean) return '';
  for (const [pattern, english] of HEBREW_TO_ENGLISH_CLUBS) {
    if (pattern.test(clean)) {
      return english;
    }
  }
  return clean;
}

function buildLookupLinks(clubName: string, englishClub: string, league?: string): { label: string; url: string }[] {
  const q = encodeURIComponent(englishClub || clubName);
  const fullQ = encodeURIComponent(`${clubName} ${league || ''} next match fixture`.trim());
  const hasHebrew = /[\u0590-\u05FF]/.test(`${clubName} ${league || ''}`);
  const links = [
    { label: 'FotMob', url: `https://www.fotmob.com/search?q=${q}` },
    { label: 'Flashscore', url: `https://www.flashscore.com/?s=${q}` },
    { label: 'Google Sports', url: `https://www.google.com/search?q=${fullQ}` },
  ];
  if (hasHebrew || /israel|ligat|leumit/i.test(league || '')) {
    links.unshift({
      label: 'IFA (football.org.il)',
      url: `https://www.football.org.il/clubs/?search=${encodeURIComponent(clubName)}`,
    });
  }
  return links;
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 7000): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; BritSportGroupTracker/1.0)',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isWomenTeamName(name: string): boolean {
  return /\(w\)|\bwomen\b|\bw\b|\bfem|\bfrauen|\bdamen|\bfemenin|\bnashim|\bנשים/i.test(name);
}

function isYouthTeamName(name: string): boolean {
  return /\bu1[4-9]\b|\bu2[0-3]\b|\byouth\b|\bנוער\b|\bנערים\b/i.test(name);
}

function normalizeTokensForComparison(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['"`.-]/g, ' ')
    .replace(/\bpetach\b/g, 'petah')
    .replace(/\bqiryat\b/g, 'kiryat')
    .replace(/\bironi\b|\bfc\b|\bsc\b|\bms\b|\bm\.?s\.?\b/g, ' ')
    .replace(/\(w\)|\bwomen\b|\bfem|\bnashim/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

function scoreTeamMatch(candidateName: string, targetEnglish: string, rosterType: 'female' | 'male', youthCategory?: string): number {
  const cand = candidateName.toLowerCase();
  const target = targetEnglish.toLowerCase();
  let score = 0;

  const targetTokens = normalizeTokensForComparison(targetEnglish);
  const candTokens = new Set(normalizeTokensForComparison(candidateName));
  let matchedTokens = 0;
  for (const tok of targetTokens) {
    if (candTokens.has(tok) || cand.includes(tok)) matchedTokens++;
  }
  if (matchedTokens === 0) return -100;
  // Require strong overlap for multi-word club names (avoid matching wrong city club)
  if (targetTokens.length >= 2 && matchedTokens < 2 && !cand.includes(targetTokens.join(' '))) {
    // Allow if the unique distinctive token matches (like "ashdod", "netanya", "hadera", "sakhnin", "raanana")
    const genericTokens = new Set(['maccabi', 'hapoel', 'beitar', 'bnei', 'tel', 'aviv', 'jerusalem', 'haifa', 'club', 'united', 'city', 'sport', 'asa']);
    const distinctiveMatches = targetTokens.filter(t => !genericTokens.has(t) && (candTokens.has(t) || cand.includes(t)));
    if (distinctiveMatches.length === 0) return -100;
  }

  score += matchedTokens * 20;
  if (cand === target || cand === `${target} (w)` || cand === `${target} u19`) score += 40;

  const isW = isWomenTeamName(candidateName);
  const isY = isYouthTeamName(candidateName);

  if (rosterType === 'female') {
    score += isW ? 60 : -40;
  } else {
    if (isW) score -= 80;
    if (youthCategory && youthCategory !== 'Senior') {
      if (cand.includes(youthCategory.toLowerCase())) score += 70;
      else if (isY) score += 10;
      else score -= 10;
    } else if (isY) {
      score -= 25;
    }
  }
  return score;
}

async function lookupVia365Scores(
  englishClub: string,
  rosterType: 'female' | 'male',
  youthCategory?: string
): Promise<Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType' | 'lookupLinks' | 'fetchedAt'> | null> {
  if (!englishClub) return null;

  const searchTerms: string[] = [];
  if (rosterType === 'female') {
    searchTerms.push(`${englishClub} (W)`, `${englishClub} Women`, englishClub);
  } else if (youthCategory && youthCategory !== 'Senior') {
    searchTerms.push(`${englishClub} ${youthCategory}`, englishClub);
  } else {
    searchTerms.push(englishClub);
  }

  const seenIds = new Set<number>();
  const candidates: Array<{ id: number; name: string; nameForURL?: string; score: number }> = [];

  for (const term of searchTerms) {
    const url = `https://webws.365scores.com/web/search/?query=${encodeURIComponent(term)}&langId=1`;
    const data = await fetchJsonWithTimeout(url);
    const competitors = Array.isArray(data?.competitors) ? data.competitors : [];
    for (const c of competitors) {
      if (Number(c?.sportId) !== 1 || typeof c?.id !== 'number' || typeof c?.name !== 'string') continue;
      if (seenIds.has(c.id)) continue;
      seenIds.add(c.id);
      const sc = scoreTeamMatch(c.name, englishClub, rosterType, youthCategory);
      if (sc > 0) {
        candidates.push({ id: c.id, name: c.name, nameForURL: c.nameForURL, score: sc });
      }
    }
    if (candidates.some(c => c.score >= 80)) break;
  }

  // Also scan Israeli U19 Youth League (525) or Israeli Women's Premier League (7620) fixtures directly for aliases
  const directLeagueIds: number[] = [];
  if (rosterType === 'male' && youthCategory === 'U19') directLeagueIds.push(525);
  if (rosterType === 'female') directLeagueIds.push(7620);

  for (const compId of directLeagueIds) {
    if (candidates.some(c => c.score >= 80)) break;
    const compFixtures = await fetchJsonWithTimeout(`https://webws.365scores.com/web/games/fixtures/?competitions=${compId}&langId=1`);
    const games = Array.isArray(compFixtures?.games) ? compFixtures.games : [];
    for (const g of games) {
      for (const comp of [g?.homeCompetitor, g?.awayCompetitor]) {
        if (!comp || typeof comp.id !== 'number' || typeof comp.name !== 'string') continue;
        if (seenIds.has(comp.id)) continue;
        seenIds.add(comp.id);
        const sc = scoreTeamMatch(comp.name, englishClub, rosterType, youthCategory);
        if (sc > 0) {
          candidates.push({ id: comp.id, name: comp.name, nameForURL: comp.nameForURL, score: sc });
        }
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  for (const team of candidates.slice(0, 4)) {
    if (rosterType === 'female' && !isWomenTeamName(team.name)) continue;
    // For U19 players, require an actual U19/Youth team on 365Scores (otherwise let fallback decide)
    if (rosterType === 'male' && youthCategory === 'U19' && !isYouthTeamName(team.name)) continue;

    const fixturesData = await fetchJsonWithTimeout(
      `https://webws.365scores.com/web/games/fixtures/?competitors=${team.id}&langId=1`
    );
    const games = Array.isArray(fixturesData?.games) ? fixturesData.games : [];
    const nowCutoff = Date.now() - 2 * 60 * 60 * 1000;

    const upcomingGames = games
      .filter((g: any) => {
        if (!g?.startTime || Number(g?.statusGroup) === 4) return false; // statusGroup 4 = Ended
        const ts = Date.parse(g.startTime);
        return !Number.isNaN(ts) && ts >= nowCutoff;
      })
      .sort((a: any, b: any) => Date.parse(a.startTime) - Date.parse(b.startTime));

    const nextGame = upcomingGames[0];
    if (!nextGame) continue;

    const homeTeam = sanitizeText(nextGame?.homeCompetitor?.name, 100);
    const awayTeam = sanitizeText(nextGame?.awayCompetitor?.name, 100);
    const isHome = Number(nextGame?.homeCompetitor?.id) === team.id;
    const opponent = isHome ? awayTeam : homeTeam;
    const competition = sanitizeText(nextGame?.competitionDisplayName, 100);
    const venue = sanitizeText(nextGame?.venue?.name, 100) || undefined;

    const teamSlug = team.nameForURL || team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const sourceUrl = `https://www.365scores.com/football/team/${teamSlug}-${team.id}`;
    const sevenDaysLimit = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const to365Fixture = (g: any): UpcomingMatchFixture => {
      const hTeam = sanitizeText(g?.homeCompetitor?.name, 100);
      const aTeam = sanitizeText(g?.awayCompetitor?.name, 100);
      const gIsHome = Number(g?.homeCompetitor?.id) === team.id;
      const oppComp = gIsHome ? g?.awayCompetitor : g?.homeCompetitor;
      const oppName = gIsHome ? aTeam : hTeam;
      const oppId = Number(oppComp?.id);
      const oppImgVer = Number(oppComp?.imageVersion) || 1;
      const opponentLogoUrl =
        Number.isFinite(oppId) && oppId > 0
          ? `https://imagecache.365scores.com/image/upload/f_png,w_96,h_96,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v${oppImgVer}/Competitors/${oppId}`
          : undefined;
      return {
        id: `365-${g?.id || g?.startTime}`,
        homeTeam: hTeam,
        awayTeam: aTeam,
        opponent: oppName,
        opponentLogoUrl,
        isHome: gIsHome,
        kickoffIso: new Date(g.startTime).toISOString(),
        competition: sanitizeText(g?.competitionDisplayName, 100),
        venue: sanitizeText(g?.venue?.name, 100) || undefined,
        sourceName: '365Scores',
        sourceUrl,
      };
    };

    const primaryFixture = to365Fixture(nextGame);
    const upcomingMatches7d = upcomingGames
      .filter((g: any) => Date.parse(g.startTime) <= sevenDaysLimit)
      .slice(0, 6)
      .map(to365Fixture);

    return {
      status: 'found',
      homeTeam: primaryFixture.homeTeam,
      awayTeam: primaryFixture.awayTeam,
      opponent: primaryFixture.opponent,
      opponentLogoUrl: primaryFixture.opponentLogoUrl,
      isHome: primaryFixture.isHome,
      kickoffIso: primaryFixture.kickoffIso,
      competition: primaryFixture.competition,
      venue: primaryFixture.venue,
      matchedTeamName: team.name,
      sourceName: '365Scores',
      sourceUrl,
      sources: [{ title: `365Scores · ${team.name}`, url: sourceUrl }],
      upcomingMatches7d,
    };
  }

  return null;
}

async function lookupViaFotMob(
  englishClub: string,
  rosterType: 'female' | 'male',
  youthCategory?: string
): Promise<Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType' | 'lookupLinks' | 'fetchedAt'> | null> {
  if (!englishClub) return null;

  const searchTerms: string[] = [];
  if (rosterType === 'female') {
    searchTerms.push(`${englishClub} (W)`, `${englishClub} Women`, englishClub);
  } else if (youthCategory && youthCategory !== 'Senior') {
    searchTerms.push(`${englishClub} ${youthCategory}`, englishClub);
  } else {
    searchTerms.push(englishClub);
  }

  const seenTeamIds = new Set<number>();
  const candidateTeams: Array<{ id: number; name: string; score: number }> = [];

  for (const term of searchTerms) {
    const url = `https://www.fotmob.com/api/data/search/suggest?term=${encodeURIComponent(term)}`;
    const data = await fetchJsonWithTimeout(url);
    if (!Array.isArray(data)) continue;
    for (const group of data) {
      const suggestions = Array.isArray(group?.suggestions) ? group.suggestions : [];
      for (const s of suggestions) {
        if (s?.type === 'team' && typeof s.name === 'string') {
          const tid = Number(s.id);
          if (!Number.isFinite(tid) || tid <= 0 || seenTeamIds.has(tid)) continue;
          seenTeamIds.add(tid);
          const sc = scoreTeamMatch(s.name, englishClub, rosterType, youthCategory);
          if (sc > 0) {
            candidateTeams.push({ id: tid, name: s.name, score: sc });
          }
        } else if (s?.type === 'match') {
          const pairs: Array<[unknown, unknown]> = [
            [s.homeTeamId, s.homeTeamName],
            [s.awayTeamId, s.awayTeamName],
          ];
          for (const [rawId, rawName] of pairs) {
            if (typeof rawName !== 'string') continue;
            const tid = Number(rawId);
            if (!Number.isFinite(tid) || tid <= 0 || seenTeamIds.has(tid)) continue;
            const sc = scoreTeamMatch(rawName, englishClub, rosterType, youthCategory);
            if (sc > 0) {
              seenTeamIds.add(tid);
              candidateTeams.push({ id: tid, name: rawName, score: sc });
            }
          }
        }
      }
    }
    if (candidateTeams.some(t => t.score >= 80)) break;
  }

  candidateTeams.sort((a, b) => b.score - a.score);

  for (const team of candidateTeams.slice(0, 4)) {
    // Avoid picking a men's team for a female player unless clearly flagged as female team
    if (rosterType === 'female' && !isWomenTeamName(team.name)) continue;

    const teamData = await fetchJsonWithTimeout(`https://www.fotmob.com/api/data/teams?id=${team.id}&ccode3=ISR`);
    if (!teamData) continue;

    const nowCutoff = Date.now() - 2 * 60 * 60 * 1000;
    const sevenDaysLimit = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const allFixtures: any[] = Array.isArray(teamData?.fixtures?.allFixtures?.fixtures)
      ? teamData.fixtures.allFixtures.fixtures
      : [];

    const upcomingList = allFixtures
      .filter((f: any) => {
        if (!f?.status?.utcTime || f?.status?.finished || f?.status?.cancelled) return false;
        const ts = Date.parse(f.status.utcTime);
        return !Number.isNaN(ts) && ts >= nowCutoff;
      })
      .sort((a: any, b: any) => Date.parse(a.status.utcTime) - Date.parse(b.status.utcTime));

    const nextMatch = teamData?.overview?.nextMatch && !teamData.overview.nextMatch?.status?.finished
      ? teamData.overview.nextMatch
      : upcomingList[0];

    if (!nextMatch || !nextMatch?.status?.utcTime) continue;

    const toFotMobFixture = (m: any): UpcomingMatchFixture => {
      const hTeam = sanitizeText(m?.home?.name, 100);
      const aTeam = sanitizeText(m?.away?.name, 100);
      const mIsHome = Number(m?.home?.id) === team.id;
      const oppName = sanitizeText(m?.opponent?.name || (mIsHome ? aTeam : hTeam), 100);
      const oppId = Number(m?.opponent?.id || (mIsHome ? m?.away?.id : m?.home?.id));
      const opponentLogoUrl =
        Number.isFinite(oppId) && oppId > 0
          ? `https://images.fotmob.com/image_resources/logo/teamlogo/${oppId}.png`
          : undefined;
      const mUrl = typeof m?.pageUrl === 'string' && m.pageUrl.startsWith('/')
        ? `https://www.fotmob.com${m.pageUrl}`
        : `https://www.fotmob.com/teams/${team.id}/overview`;
      return {
        id: `fm-${m?.id || m?.status?.utcTime}`,
        homeTeam: hTeam,
        awayTeam: aTeam,
        opponent: oppName,
        opponentLogoUrl,
        isHome: mIsHome,
        kickoffIso: String(m.status.utcTime),
        competition: sanitizeText(m?.tournament?.name, 100),
        sourceName: 'FotMob',
        sourceUrl: mUrl,
      };
    };

    const primaryFixture = toFotMobFixture(nextMatch);
    const sourceCandidates = upcomingList.length > 0 ? upcomingList : [nextMatch];
    const upcomingMatches7d = sourceCandidates
      .filter((m: any) => {
        const ts = Date.parse(m?.status?.utcTime);
        return !Number.isNaN(ts) && ts >= nowCutoff && ts <= sevenDaysLimit;
      })
      .slice(0, 6)
      .map(toFotMobFixture);

    const isExactYouth = !youthCategory || youthCategory === 'Senior' || isYouthTeamName(team.name);
    const teamScopeNote =
      rosterType === 'male' && youthCategory && youthCategory !== 'Senior' && !isExactYouth
        ? `Showing senior club fixture (${team.name}); ${youthCategory} league may have separate schedule.`
        : undefined;

    return {
      status: 'found',
      homeTeam: primaryFixture.homeTeam,
      awayTeam: primaryFixture.awayTeam,
      opponent: primaryFixture.opponent,
      opponentLogoUrl: primaryFixture.opponentLogoUrl,
      isHome: primaryFixture.isHome,
      kickoffIso: primaryFixture.kickoffIso,
      competition: primaryFixture.competition,
      matchedTeamName: team.name,
      teamScopeNote,
      sourceName: 'FotMob',
      sourceUrl: primaryFixture.sourceUrl,
      sources: [{ title: `FotMob · ${team.name}`, url: primaryFixture.sourceUrl || `https://www.fotmob.com/teams/${team.id}/overview` }],
      upcomingMatches7d,
    };
  }

  return null;
}

async function lookupViaTheSportsDB(
  englishClub: string,
  rosterType: 'female' | 'male',
  youthCategory?: string
): Promise<Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType' | 'lookupLinks' | 'fetchedAt'> | null> {
  if (!englishClub) return null;
  const searchUrl = `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(englishClub)}`;
  const searchData = await fetchJsonWithTimeout(searchUrl);
  const teams = Array.isArray(searchData?.teams) ? searchData.teams : [];

  const soccerTeams = teams.filter((t: any) => String(t?.strSport || '').toLowerCase() === 'soccer');
  const picked = soccerTeams.find((t: any) => {
    const name = String(t?.strTeam || '');
    return rosterType === 'female' ? isWomenTeamName(name) : !isWomenTeamName(name);
  });

  if (!picked?.idTeam) return null;
  // Avoid matching men's team for female player
  if (rosterType === 'female' && !isWomenTeamName(String(picked.strTeam || ''))) return null;

  const eventsData = await fetchJsonWithTimeout(
    `https://www.thesportsdb.com/api/v1/json/123/eventsnext.php?id=${encodeURIComponent(String(picked.idTeam))}`
  );
  const events = Array.isArray(eventsData?.events) ? eventsData.events : [];
  const nowCutoff = Date.now() - 2 * 60 * 60 * 1000;
  const sevenDaysLimit = Date.now() + 7 * 24 * 60 * 60 * 1000;

  const upcomingList = events
    .filter((ev: any) => {
      const iso = ev?.strTimestamp || (ev?.dateEvent ? `${ev.dateEvent}T${ev.strTime || '00:00:00'}Z` : '');
      const ts = Date.parse(iso);
      return !Number.isNaN(ts) && ts >= nowCutoff;
    })
    .sort((a: any, b: any) => {
      const ta = Date.parse(a?.strTimestamp || `${a?.dateEvent}T${a?.strTime || '00:00:00'}Z`);
      const tb = Date.parse(b?.strTimestamp || `${b?.dateEvent}T${b?.strTime || '00:00:00'}Z`);
      return ta - tb;
    });

  const upcoming = upcomingList[0];
  if (!upcoming) return null;

  const toTsdbFixture = (ev: any): UpcomingMatchFixture => {
    const hTeam = sanitizeText(ev.strHomeTeam, 100);
    const aTeam = sanitizeText(ev.strAwayTeam, 100);
    const evIsHome = String(ev.idHomeTeam) === String(picked.idTeam);
    const opp = evIsHome ? aTeam : hTeam;
    const rawBadge = evIsHome ? ev.strAwayTeamBadge : ev.strHomeTeamBadge;
    const opponentLogoUrl = typeof rawBadge === 'string' && rawBadge.startsWith('https://') ? rawBadge : undefined;
    const iso = ev.strTimestamp
      ? new Date(ev.strTimestamp.endsWith('Z') ? ev.strTimestamp : `${ev.strTimestamp}Z`).toISOString()
      : `${ev.dateEvent}T${ev.strTime || '00:00:00'}Z`;
    return {
      id: `tsdb-${ev.idEvent}`,
      homeTeam: hTeam,
      awayTeam: aTeam,
      opponent: opp,
      opponentLogoUrl,
      isHome: evIsHome,
      kickoffIso: iso,
      competition: sanitizeText(ev.strLeague, 100),
      venue: sanitizeText(ev.strVenue, 100) || undefined,
      sourceName: 'TheSportsDB',
      sourceUrl: `https://www.thesportsdb.com/event/${ev.idEvent}`,
    };
  };

  const primary = toTsdbFixture(upcoming);
  const upcomingMatches7d = upcomingList
    .filter((ev: any) => {
      const iso = ev?.strTimestamp || (ev?.dateEvent ? `${ev.dateEvent}T${ev.strTime || '00:00:00'}Z` : '');
      return Date.parse(iso) <= sevenDaysLimit;
    })
    .slice(0, 6)
    .map(toTsdbFixture);

  const teamScopeNote =
    rosterType === 'male' && youthCategory && youthCategory !== 'Senior'
      ? `Showing senior club fixture (${picked.strTeam}); ${youthCategory} league may have separate schedule.`
      : undefined;

  return {
    status: 'found',
    homeTeam: primary.homeTeam,
    awayTeam: primary.awayTeam,
    opponent: primary.opponent,
    opponentLogoUrl: primary.opponentLogoUrl,
    isHome: primary.isHome,
    kickoffIso: primary.kickoffIso,
    competition: primary.competition,
    venue: primary.venue,
    matchedTeamName: sanitizeText(picked.strTeam, 100),
    teamScopeNote,
    sourceName: 'TheSportsDB',
    sourceUrl: primary.sourceUrl,
    sources: [{ title: `TheSportsDB · ${picked.strTeam}`, url: primary.sourceUrl || 'https://www.thesportsdb.com' }],
    upcomingMatches7d,
  };
}

async function lookupViaGeminiSearchGrounding(
  item: NextMatchRequestItem,
  englishClub: string
): Promise<Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType' | 'lookupLinks' | 'fetchedAt'> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  if (Date.now() < geminiCooldownUntil) return null;

  // Skip AI web search for grassroots U14/U15/U16 youth tiers where online sites lack official feeds
  if (item.youthCategory && ['U14', 'U15', 'U16'].includes(item.youthCategory)) {
    return null;
  }

  // Serialize Gemini grounding calls so a multi-player batch never bursts past RPM limits
  const runSerialized = async (): Promise<Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType' | 'lookupLinks' | 'fetchedAt'> | null> => {
    if (Date.now() < geminiCooldownUntil) return null;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const todayIso = new Date().toISOString().slice(0, 10);
      const genderLabel = item.rosterType === 'female' ? "Women's football" : "Men's / Youth football";
      const ageLabel = item.youthCategory && item.youthCategory !== 'Senior' ? `(${item.youthCategory} youth squad)` : '(Senior first team)';

      const prompt = [
        `Find the NEXT confirmed upcoming official football match AFTER ${todayIso} for club "${item.clubName}"${englishClub && englishClub !== item.clubName ? ` (English: "${englishClub}")` : ''}.`,
        `Division: ${genderLabel} ${ageLabel}.`,
        item.league ? `League context: ${item.league}.` : '',
        `Search official sports websites (such as football.org.il / ההתאחדות לכדורגל, FotMob, Flashscore, SofaScore, ONE, Sport5, UEFA, Soccerway).`,
        `CRITICAL RULES:`,
        `- Only return a match if you find a real confirmed upcoming fixture published on a sports website.`,
        `- Do NOT invent, guess, or estimate dates or opponents. If no confirmed upcoming fixture is published online, respond strictly with JSON: {"found": false}.`,
        `- Respond ONLY with valid JSON matching this schema:`,
        `{"found": true, "homeTeam": "...", "awayTeam": "...", "opponent": "...", "isHome": true, "kickoffIso": "YYYY-MM-DDTHH:mm:ssZ", "competition": "...", "venue": "...", "matchedTeamName": "..."}`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = (response.text || '').trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed?.found || !parsed?.opponent || !parsed?.kickoffIso) return null;

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: MatchSourceLink[] = [];
      for (const c of chunks) {
        const uri = c?.web?.uri;
        const title = c?.web?.title;
        if (typeof uri === 'string' && uri.startsWith('https://')) {
          sources.push({
            title: sanitizeText(title || new URL(uri).hostname, 80),
            url: uri,
          });
        }
      }

      const parsedTs = Date.parse(String(parsed.kickoffIso));
      if (Number.isNaN(parsedTs)) return null;

      const kickoffIso = new Date(parsedTs).toISOString();
      const homeTeam = sanitizeText(parsed.homeTeam, 100) || undefined;
      const awayTeam = sanitizeText(parsed.awayTeam, 100) || undefined;
      const opponent = sanitizeText(parsed.opponent, 100);
      const isHome = typeof parsed.isHome === 'boolean' ? parsed.isHome : undefined;
      const competition = sanitizeText(parsed.competition, 100) || sanitizeText(item.league, 100) || undefined;
      const venue = sanitizeText(parsed.venue, 100) || undefined;
      const sourceName = sources[0]?.title || 'Live Web Sports Search';
      const sourceUrl = sources[0]?.url;

      const nowMs = Date.now();
      const within7d = parsedTs >= nowMs - 2 * 60 * 60 * 1000 && parsedTs <= nowMs + 7 * 24 * 60 * 60 * 1000;
      const upcomingMatches7d: UpcomingMatchFixture[] = within7d
        ? [
            {
              id: `gem-${parsedTs}-${opponent}`,
              homeTeam,
              awayTeam,
              opponent,
              isHome,
              kickoffIso,
              competition,
              venue,
              sourceName,
              sourceUrl,
            },
          ]
        : [];

      return {
        status: 'found',
        homeTeam,
        awayTeam,
        opponent,
        isHome,
        kickoffIso,
        competition,
        venue,
        matchedTeamName: sanitizeText(parsed.matchedTeamName, 100) || item.clubName,
        sourceName,
        sourceUrl,
        sources: sources.slice(0, 3),
        upcomingMatches7d,
      };
    } catch (err) {
      if (isQuotaOrRateLimitError(err)) {
        geminiCooldownUntil = Date.now() + GEMINI_COOLDOWN_MS;
        console.info('Gemini search grounding rate/quota limit reached; pausing AI fallback for 10 minutes.');
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.info(`Gemini search grounding fallback skipped (${msg.slice(0, 120)}).`);
      }
      return null;
    }
  };

  let result: Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType' | 'lookupLinks' | 'fetchedAt'> | null = null;
  const task = geminiQueue.then(async () => {
    result = await runSerialized();
  });
  geminiQueue = task.catch(() => undefined);
  await task;
  return result;
}

export async function lookupNextMatch(item: NextMatchRequestItem, forceRefresh = false): Promise<NextMatchResult> {
  const clubName = sanitizeText(item.clubName, 120);
  const league = sanitizeText(item.league, 120);
  const youthCategory = sanitizeText(item.youthCategory, 16) || 'Senior';
  const englishClub = normalizeClubNameForSearch(clubName);
  const lookupLinks = buildLookupLinks(clubName, englishClub, league);
  const fetchedAt = new Date().toISOString();

  if (!clubName || /free agent|ללא קבוצה/i.test(clubName)) {
    return {
      key: item.key,
      playerId: item.playerId,
      rosterType: item.rosterType,
      status: 'not_found',
      lookupLinks,
      fetchedAt,
    };
  }

  const cacheKey = `${item.rosterType}::${englishClub.toLowerCase()}::${youthCategory.toLowerCase()}::${league.toLowerCase()}`;
  if (!forceRefresh) {
    const cached = matchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        ...cached.result,
        key: item.key,
        playerId: item.playerId,
        rosterType: item.rosterType,
      };
    }
  }

  const pending = inFlightLookups.get(cacheKey);
  if (!forceRefresh && pending) {
    const resolved = await pending;
    return {
      ...resolved,
      key: item.key,
      playerId: item.playerId,
      rosterType: item.rosterType,
    };
  }

  const lookupPromise = (async (): Promise<Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType'>> => {
    let found: Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType' | 'lookupLinks' | 'fetchedAt'> | null = null;

    // For U19 and Women's leagues (including Israeli Youth Premier League & Women's Premier League),
    // prioritize 365Scores first, then FotMob -> TheSportsDB -> Gemini Search Grounding.
    if (item.rosterType === 'female' || youthCategory === 'U19') {
      found = await lookupVia365Scores(englishClub, item.rosterType, youthCategory);
      if (!found) {
        found = await lookupViaFotMob(englishClub, item.rosterType, youthCategory);
      }
    } else {
      found = await lookupViaFotMob(englishClub, item.rosterType, youthCategory);
      if (!found) {
        found = await lookupVia365Scores(englishClub, item.rosterType, youthCategory);
      }
    }

    if (!found) {
      found = await lookupViaTheSportsDB(englishClub, item.rosterType, youthCategory);
    }

    if (!found) {
      found = await lookupViaGeminiSearchGrounding(item, englishClub);
    }

    const baseResult: Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType'> = found
      ? {
          ...found,
          lookupLinks,
          fetchedAt,
        }
      : {
          status: 'not_found',
          lookupLinks,
          fetchedAt,
        };

    matchCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      result: baseResult,
    });

    return baseResult;
  })();

  inFlightLookups.set(cacheKey, lookupPromise);
  try {
    const baseResult = await lookupPromise;
    return {
      ...baseResult,
      key: item.key,
      playerId: item.playerId,
      rosterType: item.rosterType,
    };
  } finally {
    inFlightLookups.delete(cacheKey);
  }
}

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

export interface NextMatchResult {
  key: string;
  playerId: string;
  rosterType: 'female' | 'male';
  status: 'found' | 'not_found' | 'error';
  homeTeam?: string;
  awayTeam?: string;
  opponent?: string;
  isHome?: boolean;
  kickoffIso?: string;
  competition?: string;
  venue?: string;
  matchedTeamName?: string;
  teamScopeNote?: string;
  sourceName?: string;
  sourceUrl?: string;
  sources?: MatchSourceLink[];
  lookupLinks: { label: string; url: string }[];
  fetchedAt: string;
  errorMessage?: string;
}

const HEBREW_TO_ENGLISH_CLUBS: Array<[RegExp, string]> = [
  [/מכבי תל אביב|מכבי ת"א/i, 'Maccabi Tel Aviv'],
  [/מכבי חיפה/i, 'Maccabi Haifa'],
  [/הפועל תל אביב|הפועל ת"א/i, 'Hapoel Tel Aviv'],
  [/בית"ר ירושלים|ביתר ירושלים/i, 'Beitar Jerusalem'],
  [/הפועל קטמון ירושלים|הפועל ירושלים/i, 'Hapoel Jerusalem'],
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
  [/הפועל כפר סבא/i, 'Hapoel Kfar Saba'],
  [/הפועל ראשון לציון/i, 'Hapoel Rishon LeZion'],
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
const matchCache = new Map<string, { expiresAt: number; result: Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType'> }>();

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

function scoreTeamMatch(candidateName: string, targetEnglish: string, rosterType: 'female' | 'male', youthCategory?: string): number {
  const cand = candidateName.toLowerCase();
  const target = targetEnglish.toLowerCase();
  let score = 0;

  // Token overlap
  const targetTokens = target.split(/\s+/).filter(t => t.length >= 2);
  let matchedTokens = 0;
  for (const tok of targetTokens) {
    if (cand.includes(tok)) matchedTokens++;
  }
  if (matchedTokens === 0) return -100;
  score += matchedTokens * 20;
  if (cand === target || cand === `${target} (w)`) score += 40;

  const isW = isWomenTeamName(candidateName);
  const isY = isYouthTeamName(candidateName);

  if (rosterType === 'female') {
    score += isW ? 60 : -20;
  } else {
    if (isW) score -= 80;
    if (youthCategory && youthCategory !== 'Senior') {
      if (cand.includes(youthCategory.toLowerCase())) score += 50;
      else if (isY) score += 10;
    } else if (isY) {
      score -= 15;
    }
  }
  return score;
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

    let nextMatch = teamData?.overview?.nextMatch;
    if (!nextMatch && Array.isArray(teamData?.fixtures?.allFixtures?.fixtures)) {
      const nowCutoff = Date.now() - 2 * 60 * 60 * 1000;
      nextMatch = teamData.fixtures.allFixtures.fixtures.find((f: any) => {
        if (!f?.status?.utcTime || f?.status?.finished || f?.status?.cancelled) return false;
        const ts = Date.parse(f.status.utcTime);
        return !Number.isNaN(ts) && ts >= nowCutoff;
      });
    }

    if (!nextMatch || !nextMatch?.status?.utcTime) continue;

    const homeTeam = sanitizeText(nextMatch?.home?.name, 100);
    const awayTeam = sanitizeText(nextMatch?.away?.name, 100);
    const isHome = Number(nextMatch?.home?.id) === team.id;
    const opponent = sanitizeText(nextMatch?.opponent?.name || (isHome ? awayTeam : homeTeam), 100);
    const competition = sanitizeText(nextMatch?.tournament?.name, 100);
    const pageUrl = typeof nextMatch?.pageUrl === 'string' && nextMatch.pageUrl.startsWith('/')
      ? `https://www.fotmob.com${nextMatch.pageUrl}`
      : `https://www.fotmob.com/teams/${team.id}/overview`;

    const isExactYouth = !youthCategory || youthCategory === 'Senior' || isYouthTeamName(team.name);
    const teamScopeNote =
      rosterType === 'male' && youthCategory && youthCategory !== 'Senior' && !isExactYouth
        ? `Showing senior club fixture (${team.name}); ${youthCategory} league may have separate schedule.`
        : undefined;

    return {
      status: 'found',
      homeTeam,
      awayTeam,
      opponent,
      isHome,
      kickoffIso: String(nextMatch.status.utcTime),
      competition,
      matchedTeamName: team.name,
      teamScopeNote,
      sourceName: 'FotMob',
      sourceUrl: pageUrl,
      sources: [{ title: `FotMob · ${team.name}`, url: pageUrl }],
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

  const upcoming = events.find((ev: any) => {
    const iso = ev?.strTimestamp || (ev?.dateEvent ? `${ev.dateEvent}T${ev.strTime || '00:00:00'}Z` : '');
    const ts = Date.parse(iso);
    return !Number.isNaN(ts) && ts >= nowCutoff;
  });

  if (!upcoming) return null;

  const homeTeam = sanitizeText(upcoming.strHomeTeam, 100);
  const awayTeam = sanitizeText(upcoming.strAwayTeam, 100);
  const isHome = String(upcoming.idHomeTeam) === String(picked.idTeam);
  const opponent = isHome ? awayTeam : homeTeam;
  const kickoffIso = upcoming.strTimestamp
    ? new Date(upcoming.strTimestamp.endsWith('Z') ? upcoming.strTimestamp : `${upcoming.strTimestamp}Z`).toISOString()
    : `${upcoming.dateEvent}T${upcoming.strTime || '00:00:00'}Z`;
  const sourceUrl = `https://www.thesportsdb.com/event/${upcoming.idEvent}`;

  const teamScopeNote =
    rosterType === 'male' && youthCategory && youthCategory !== 'Senior'
      ? `Showing senior club fixture (${picked.strTeam}); ${youthCategory} league may have separate schedule.`
      : undefined;

  return {
    status: 'found',
    homeTeam,
    awayTeam,
    opponent,
    isHome,
    kickoffIso,
    competition: sanitizeText(upcoming.strLeague, 100),
    venue: sanitizeText(upcoming.strVenue, 100) || undefined,
    matchedTeamName: sanitizeText(picked.strTeam, 100),
    teamScopeNote,
    sourceName: 'TheSportsDB',
    sourceUrl,
    sources: [{ title: `TheSportsDB · ${picked.strTeam}`, url: sourceUrl }],
  };
}

async function lookupViaGeminiSearchGrounding(
  item: NextMatchRequestItem,
  englishClub: string
): Promise<Omit<NextMatchResult, 'key' | 'playerId' | 'rosterType' | 'lookupLinks' | 'fetchedAt'> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;

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

    return {
      status: 'found',
      homeTeam: sanitizeText(parsed.homeTeam, 100) || undefined,
      awayTeam: sanitizeText(parsed.awayTeam, 100) || undefined,
      opponent: sanitizeText(parsed.opponent, 100),
      isHome: typeof parsed.isHome === 'boolean' ? parsed.isHome : undefined,
      kickoffIso: new Date(parsedTs).toISOString(),
      competition: sanitizeText(parsed.competition, 100) || sanitizeText(item.league, 100) || undefined,
      venue: sanitizeText(parsed.venue, 100) || undefined,
      matchedTeamName: sanitizeText(parsed.matchedTeamName, 100) || item.clubName,
      sourceName: sources[0]?.title || 'Live Web Sports Search',
      sourceUrl: sources[0]?.url,
      sources: sources.slice(0, 3),
    };
  } catch (err) {
    console.warn('Gemini search grounding lookup error:', err);
    return null;
  }
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

  // Tier 1: FotMob sports website live fixtures
  let found = await lookupViaFotMob(englishClub, item.rosterType, youthCategory);

  // Tier 2: TheSportsDB sports website live fixtures
  if (!found) {
    found = await lookupViaTheSportsDB(englishClub, item.rosterType, youthCategory);
  }

  // Tier 3: Gemini Google Search Grounding (searches football.org.il, ONE, Sport5, Flashscore, FotMob, SofaScore)
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

  return {
    ...baseResult,
    key: item.key,
    playerId: item.playerId,
    rosterType: item.rosterType,
  };
}

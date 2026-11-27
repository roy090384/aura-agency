import { fetchYouthMatchesFromJuniorLeague } from '../lib/juniorLeagueMatches.ts';
import type { YouthMatchRequestPlayer } from '../lib/juniorLeagueMatches.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const rawPlayers = Array.isArray(body.players) ? body.players : [];
    const forceRefresh = Boolean(body.forceRefresh);
    const daysAhead = typeof body.daysAhead === 'number' ? body.daysAhead : 7;

    const players: YouthMatchRequestPlayer[] = rawPlayers.slice(0, 120).map((p: any) => ({
      id: String(p?.id || '').slice(0, 128),
      name: String(p?.name || '').slice(0, 128),
      photoUrl: typeof p?.photoUrl === 'string' ? p.photoUrl.slice(0, 512) : undefined,
      clubName: String(p?.clubName || '').slice(0, 128),
      league: typeof p?.league === 'string' ? p.league.slice(0, 128) : undefined,
      position: typeof p?.position === 'string' ? p.position.slice(0, 64) : undefined,
      age: typeof p?.age === 'number' ? p.age : undefined,
      youthCategory: typeof p?.youthCategory === 'string' ? (p.youthCategory.slice(0, 16) as any) : undefined,
    })).filter((p: YouthMatchRequestPlayer) => Boolean(p.id && p.name));

    const result = await fetchYouthMatchesFromJuniorLeague(players, {
      daysAhead,
      forceRefresh,
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Error in Vercel /api/youth-matches:', err);
    res.status(500).json({ error: 'Failed to load youth matches from JuniorLeague.' });
  }
}

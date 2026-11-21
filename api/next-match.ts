import { lookupNextMatch } from '../lib/nextMatchLookup.ts';
import type { NextMatchRequestItem } from '../lib/nextMatchLookup.ts';

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

    if (rawPlayers.length === 0) {
      res.status(200).json({ results: [], geminiSearchEnabled: Boolean(process.env.GEMINI_API_KEY) });
      return;
    }

    const items: NextMatchRequestItem[] = rawPlayers.slice(0, 24).map((p: any) => ({
      key: String(p?.key || '').slice(0, 140),
      playerId: String(p?.playerId || '').slice(0, 128),
      rosterType: p?.rosterType === 'male' ? 'male' : 'female',
      playerName: String(p?.playerName || '').slice(0, 128),
      clubName: String(p?.clubName || '').slice(0, 128),
      league: typeof p?.league === 'string' ? p.league.slice(0, 128) : undefined,
      youthCategory: typeof p?.youthCategory === 'string' ? p.youthCategory.slice(0, 16) : undefined,
      nationality: typeof p?.nationality === 'string' ? p.nationality.slice(0, 64) : undefined,
    })).filter((item: NextMatchRequestItem) => Boolean(item.key && item.playerId));

    const results = await Promise.all(
      items.map((item) => lookupNextMatch(item, forceRefresh))
    );

    res.status(200).json({
      results,
      geminiSearchEnabled: Boolean(process.env.GEMINI_API_KEY),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in Vercel /api/next-match:', err);
    res.status(500).json({ error: 'Failed to fetch next match schedules from sports websites.' });
  }
}

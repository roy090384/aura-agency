import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookupNextMatch, isGeminiQuotaLimited } from './lib/nextMatchLookup.ts';
import type { NextMatchRequestItem } from './lib/nextMatchLookup.ts';
import { fetchYouthMatchesFromJuniorLeague } from './lib/juniorLeagueMatches.ts';
import type { YouthMatchRequestPlayer } from './lib/juniorLeagueMatches.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiSearchEnabled: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.post('/api/next-match', async (req, res) => {
    try {
      const body = req.body || {};
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
        geminiQuotaLimited: isGeminiQuotaLimited(),
        fetchedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in POST /api/next-match:', err);
      res.status(500).json({ error: 'Failed to fetch next match schedules from sports websites.' });
    }
  });

  app.post('/api/youth-matches', async (req, res) => {
    try {
      const body = req.body || {};
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
    } catch (err: any) {
      console.error('Error in POST /api/youth-matches:', err);
      res.status(500).json({ error: 'Failed to load youth matches from JuniorLeague.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

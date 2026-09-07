# Lebrun Arena

Every ping pong **full match from 2025–26** featuring **Félix Lebrun** or **Alexis Lebrun**,
pulled live from the [WTT Global](https://www.youtube.com/@wttglobal) YouTube channel and
ready to watch in the browser.

![stack](https://img.shields.io/badge/Next.js-16-black) ![stack](https://img.shields.io/badge/React-19-blue) [![stack](https://img.shields.io/badge/PWA-✓-gold)](https://lebrun-arena.vercel.app)

## How it works

- `lib/youtube.ts` — a **no-key crawler** that pages through the WTT Global uploads feed
  (channel `UC9ckyA_A3MfXUa0ttxMoIZw`) using YouTube's public innertube web API, then
  filters titles for Lebrun matches published in the 2025–26 window, dedupes same-match
  uploads, and classifies each video as `full` / `match`.
- `app/api/matches/route.ts` — serverless endpoint. 45-minute in-memory cache, CDN
  revalidation every 6 hours, and a committed snapshot (`data/matches.json`) as a fallback
  if the live scan fails. Runs up to 300s (Vercel Hobby Fluid Compute).
- `components/Arena.tsx` — the extravagantly gold, glassmorphic UI: animated aura,
  floating ping-pong balls, gradient shimmer headline, filter chips, search, stat cards,
  and an in-app YouTube player modal.
- `scripts/snapshot.mjs` — regenerates the fallback snapshot: `node scripts/snapshot.mjs`.
- **PWA** — installable via `app/manifest.ts` (gold `LK` icons in `public/icons/`), a
  Serwist service worker built at build time (`serwist.config.js` → `public/sw.js`) that
  offlines the app shell and match data, an offline fallback page at `/~offline`, plus
  an install prompt and online/offline pill (`components/PwaStatus.tsx`).

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build + generates public/sw.js (serwist build)
npm start          # serve the production build
```

The first call to `/api/matches` performs a full channel scan (≈2 min cold); subsequent
calls come from cache. `/api/matches?` honours `revalidate`.

## Optional: switch to the official YouTube API

See [docs/youtube-api-key.md](docs/youtube-api-key.md) for a step-by-step guide to create a
YouTube Data API v3 key and upgrade the crawler.

## Deploy

```bash
vercel --prod
```

Data source: World Table Tennis · Not affiliated with WTT, ITTF, or the Lebrun family.
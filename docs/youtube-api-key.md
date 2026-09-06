# Upgrading to the official YouTube Data API

Lebrun Arena currently discovers matches with a **no-key scraper**: it pages through the
WTT Global channel feed using YouTube's public innertube web API. It works great today, but
scraping can break if YouTube changes its internal endpoints, and it is slow on a cold cache
(roughly 2 minutes per scan).

The official **YouTube Data API v3** is faster, more reliable, and stays within YouTube's
usage rules. This guide shows how to switch.

## 1. Create a Google Cloud project + API key

1. Go to <https://console.cloud.google.com> and sign in.
2. Create a project (e.g. `lebrun-arena`).
3. Enable the API:
   - **APIs & Services → Library** → search for **"YouTube Data API v3"** → **Enable**.
4. Create an API key:
   - **APIs & Services → Credentials → Create credentials → API key**.
   - Recommended: **Restrict key** → "YouTube Data API v3", and restrict to your Vercel
     domain if you want extra safety.
5. Copy the key (starts with `AIza...`).

The free tier quota is **10,000 units / day**. Each search call costs 100 units, so a daily
refresh of this app uses well under 1,000 units.

## 2. Add the key to your environment

Locally (`.env.local`):

```
YOUTUBE_API_KEY=AIza...
```

On Vercel: **Project → Settings → Environment Variables** → add `YOUTUBE_API_KEY`.

## 3. Wire up the official API in code

Create `app/api/matches/route.ts` (or a new `lib/ytapi.ts`) that calls:

```
GET https://www.googleapis.com/youtube/v3/search
    ?part=snippet
    &channelId=UC9ckyA_A3MfXUa0ttxMoIZw
    &q=Lebrun
    &order=date
    &type=video
    &publishedAfter=2025-01-01T00:00:00Z
    &maxResults=50
    &key=YOUTUBE_API_KEY
```

Notes:

- `channelId` for WTT Global is `UC9ckyA_A3MfXUa0ttxMoIZw`.
- Page with the `nextPageToken` field until you collect all Lebrun videos for the season.
- Map each result to the same `Match` shape used by the UI
  (`id`, `title`, `thumb`, `publishedAt`, `duration`, `views`).
- You can drop the whole `lib/youtube.ts` scraper and the `scripts/snapshot.mjs` once the
  API path is stable — or keep the snapshot as a graceful fallback.

## 4. Keeping it cheap

The response is cached with `export const revalidate` in `app/api/matches/route.ts`.
With a 6-hour `revalidate`, the app only hits the YouTube API a handful of times per day.
/* eslint-disable @typescript-eslint/no-explicit-any */
// No-key YouTube scraper for the WTT Global uploads feed.
// Uses YouTube's public innertube "WEB" browse API (same one the site uses),
// paginated with the visitorData continuation token returned by the first call.
// Replace this module with the official YouTube Data API later (see docs/youtube-api-key.md).

const CHANNEL_ID = "UC9ckyA_A3MfXUa0ttxMoIZw";
const CHANNEL_HANDLE = "@wttglobal";
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/browse";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const VIDEOS_PARAMS = "EgZ2aWRlb3PyBgQKAjoA";

export const SEASON_START = "2025-01-01T00:00:00Z";
const MAX_PAGES = 330;
const PAGE_DELAY_MS = 160;

export type MatchKind = "full" | "match" | "highlight";

export interface Match {
  id: string;
  title: string;
  thumb: string;
  duration: string;
  durationSeconds: number | null;
  views: string;
  relativeTime: string;
  publishedAt: string;
  kind: MatchKind;
  event: string;
  round: string;
  playersText: string;
  player: string;
  opponent: string;
  year?: string;
}

interface RawVideo {
  id: string;
  title: string;
  thumb: string;
  duration: string;
  rel: string;
  views: string;
}

async function innertube(page: number, body: unknown, visitor?: string) {
  const payload = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240814.00.00",
        hl: "en",
        gl: "US",
        ...(visitor ? { visitorData: visitor, userAgent: USER_AGENT } : {}),
      },
    },
    ...(body as object),
  };
  const res = await fetch(`${INNERTUBE_URL}?key=${INNERTUBE_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      "Accept-Language": "en",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`innertube page ${page} http ${res.status}`);
  return res.json();
}

function scrollTo(norm: any[]) {
  let token: string | undefined;
  for (const it of norm) {
    const cont = it.continuationItemRenderer?.continuationEndpoint?.continuationCommand;
    if (cont?.token) token = cont.token;
  }
  return token;
}

function thumbOf(vm: any): string {
  const sources = vm.contentImage?.thumbnailViewModel?.image?.sources || [];
  const best = sources[sources.length - 1]?.url || "";
  return best.split("?")[0];
}

function textOf(runs: any): string {
  if (runs?.content) return runs.content;
  if (Array.isArray(runs?.runs)) return runs.runs.map((r: any) => r.text ?? "").join("");
  return "";
}

function parseVideo(vm: any): RawVideo | null {
  if (!vm || !vm.contentId) return null;
  const meta = vm.metadata?.lockupMetadataViewModel;
  let duration = "";
  let rel = "";
  let views = "";
  const overlays = vm.contentImage?.thumbnailViewModel?.overlays || [];
  for (const o of overlays) {
    for (const b of o.thumbnailBottomOverlayViewModel?.badges || []) {
      if (b.thumbnailBadgeViewModel?.text) duration = b.thumbnailBadgeViewModel.text;
    }
  }
  const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
  for (const r of rows) {
    for (const p of r.metadataParts || []) {
      const txt = p.text?.content || "";
      if (/ago|today|yesterday/.test(txt)) rel = txt;
      else if (/views/.test(txt)) views = txt;
    }
  }
  return {
    id: vm.contentId || "",
    title: textOf(meta?.title),
    thumb: thumbOf(vm),
    duration,
    rel,
    views,
  };
}

export function parseDuration(duration: string): number | null {
  const parts = duration.split(":").map(Number);
  if (!parts.every((n) => Number.isFinite(n))) return null;
  let secs = 0;
  for (const p of parts) secs = secs * 60 + p;
  return secs;
}

function approxFromRel(rel: string, now: Date): Date {
  const t = rel.trim().toLowerCase();
  const nowMs = now.getTime();
  if (t === "today") return new Date(nowMs);
  if (t === "yesterday") return new Date(nowMs - 86400000);
  const m = t.match(/^(\d+)\s*(hour|day|week|month|year)s?\s*ago$/);
  if (!m) return now;
  const n = Number(m[1]);
  const unit = m[2];
  const mult: Record<string, number> = {
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2629800000,
    year: 31557600000,
  };
  return new Date(nowMs - n * mult[unit]);
}

const NON_MATCH = /interview|post[- ]match|press conference|behind[- ]the[- ]scenes|meet the|mic.?d ?up|presser|cermony|top (10|points)|best of|reaction|documentary|vlog|training|feast|digest|recap|analys|breakdown|bts|highlights of the year|young talent|day out|brothers|sightseeing|universal studios|music video|challenge|danc/i;

const HIGHLIGHT_HINT = /highlight|top points|top 10|best of|extended highlights|in 60 seconds|compilation/i;

function durationToLabel(secs: number | null): string {
  if (secs == null || secs < 0) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function classify(title: string, durSecs: number | null): MatchKind | null {
  if (NON_MATCH.test(title)) return null;
  if (/full match|official video|extended cut/i.test(title) || (durSecs ?? 0) >= 1200) return "full";
  if (HIGHLIGHT_HINT.test(title)) return "highlight";
  if (/ vs | match |final|stern/i.test(title) || (durSecs ?? 0) >= 600) return "match";
  return "highlight";
}

export function normalizeKey(s: string): string {
  return s
    .toUpperCase()
    .replace(/&/g, " and ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/[^A-Z0-9\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTitle(title: string, durSecs: number | null) {
  const yearMatch = title.match(/20\d{2}/);
  const eventMatch = title.match(/#([A-Za-z0-9]+)\s*(20\d{2})?/);
  let event = eventMatch ? `${eventMatch[1]}${eventMatch[2] ? " " + eventMatch[2] : ""}` : "";
  if (!event) {
    const seg = title.split("|").map((p) => p.trim()).find((p) => !/ vs /i.test(p) && /20\d{2}/.test(p));
    if (seg) event = seg.replace(/WTT\s*/i, "WTT ").trim();
  }
  const roundSearch = title.replace(/FULL MATCH/i, "").match(/(R\d+|QF|SF|Semi[- ]?Final|Final|Quarter[- ]?Final|Group)/gi);
  const round = roundSearch ? roundSearch[roundSearch.length - 1] : "";
  const parts = title.split("|").map((p) => p.trim());
  const vsPart = parts.find((p) => / vs /i.test(p));
  const playersText = vsPart || parts[0] || "";
  const cleanPlayers = playersText.replace(/.*?(felix|alexis|lebron|lebrun)\s+/i, "");
  const sides = playersText.split(/\s+vs\s+/i);
  const player = (sides[0] || "").trim();
  const opponent = (sides[1] || "").trim();
  const fallbackPlayer = (cleanPlayers.match(/\b(Felix|Alexis|Lebrun)\b/i)?.[0] || "").trim();
  return {
    year: yearMatch?.[0],
    event,
    round,
    playersText: playersText.replace(/\|/g, "").trim(),
    player: player || fallbackPlayer,
    opponent,
    kind: classify(title, durSecs),
  };
}

function makeMatch(v: RawVideo, now: Date): Match | null {
  const durSecs = parseDuration(v.duration);
  const parsed = parseTitle(v.title, durSecs);
  if (!parsed.kind) return null;
  const publishedAt = approxFromRel(v.rel, now).toISOString();
  return {
    id: v.id,
    title: v.title.trim(),
    thumb: v.thumb,
    duration: durationToLabel(durSecs),
    durationSeconds: durSecs,
    views: v.views,
    relativeTime: v.rel,
    publishedAt,
    kind: parsed.kind,
    event: parsed.event,
    round: parsed.round ? parsed.round.toUpperCase() : "",
    playersText: parsed.playersText,
    player: parsed.player,
    opponent: parsed.opponent,
    year: parsed.year,
  };
}

async function fetchPage(pageNum: number, visitor?: string, token?: string) {
  const body = token ? { continuation: token } : { browseId: CHANNEL_ID, params: VIDEOS_PARAMS };
  const json = await innertube(pageNum, body, visitor);
  if (token) {
    const items = json.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems || [];
    return { videos: items.map((it: any) => parseVideo(it.richItemRenderer?.content?.lockupViewModel)).filter((v: RawVideo | null): v is RawVideo => !!v), token: scrollTo(items), visitor };
  }
  const grid = json.contents?.twoColumnBrowseResultsRenderer?.tabs?.[1]?.tabRenderer?.content?.richGridRenderer?.contents || [];
  const videos = grid
    .map((it: any) => parseVideo(it.richItemRenderer?.content?.lockupViewModel))
    .filter((v: RawVideo | null): v is RawVideo => !!v);
  return { videos, token: scrollTo(grid), visitor: json.responseContext?.visitorData as string };
}

async function fetchPageWithRetry(pageNum: number, visitor?: string, token?: string): Promise<ReturnType<typeof fetchPage>> {
  const attempts = [0, 800, 2400];
  for (let i = 0; i < attempts.length; i++) {
    try {
      return await fetchPage(pageNum, visitor, token);
    } catch (e) {
      if (i === attempts.length - 1) throw e;
      await new Promise((r) => setTimeout(r, attempts[i]));
    }
  }
  throw new Error("unreachable");
}

function dedupe(matches: Match[]): Match[] {
  const seen = new Map<string, Match>();
  const order: string[] = [];
  for (const m of matches) {
    if (!m.event) {
      seen.set(`vid:${m.id}`, m);
      order.push(`vid:${m.id}`);
      continue;
    }
    const left = normalizeKey(m.player || "");
    const right = normalizeKey(m.opponent || "");
    const key = `${normalizeKey(m.event)}::${[left, right].sort().join(" vs ")}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, m);
      order.push(key);
    } else {
      const prio = { full: 0, match: 1, highlight: 2 };
      if ((prio[m.kind] ?? 3) < (prio[existing.kind] ?? 3)) seen.set(key, m);
    }
  }
  return order
    .map((k) => seen.get(k))
    .filter((m): m is Match => !!m)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export interface LebrunCrawl {
  matches: Match[];
  complete: boolean;
}

export async function fetchLebrunMatches(opts?: { seasonStart?: string; maxPages?: number }): Promise<LebrunCrawl> {
  const seasonStart = opts?.seasonStart ?? SEASON_START;
  const maxPages = opts?.maxPages ?? MAX_PAGES;
  const start = Date.now();
  const now = new Date();
  const raw: RawVideo[] = [];
  let visitor: string | undefined;
  let page = 0;
  let token: string | undefined;
  let complete = false;
  while (page < maxPages) {
    page++;
    let res: Awaited<ReturnType<typeof fetchPageWithRetry>>;
    try {
      res = await fetchPageWithRetry(page, visitor, token);
    } catch (e) {
      if (page === 1) {
        console.warn(`[crawl] first request failed on page 1: ${e instanceof Error ? e.message : e}`);
        throw e instanceof Error ? e : new Error("crawl failed");
      }
      console.warn(`[crawl] continuation interrupted at page ${page}; crawl incomplete`);
      break;
    }
    for (const v of res.videos) if (/lebrun/i.test(v.title)) raw.push(v);
    visitor = res.visitor || visitor;
    token = res.token;
    if (!token) {
      complete = true;
      break;
    }
    const tail = raw[raw.length - 1];
    if (tail && /^(2|3|4|5)\s+years ago/.test(tail.rel) && page > 8) {
      complete = true;
      break;
    }
    if (Date.now() - start > 260000) break;
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
  }

  const matches: Match[] = [];
  for (const v of raw) {
    const m = makeMatch(v, now);
    if (!m || !m.id) continue;
    const fromTitle = m.year ? `${m.year}-01-01T00:00:00Z` : null;
    let keep: boolean;
    if (fromTitle) {
      keep = fromTitle >= seasonStart;
    } else {
      const isYearRel = /^\d+\s+years? ago$/.test(v.rel);
      keep = isYearRel ? true : m.publishedAt >= seasonStart;
    }
    if (keep) matches.push(m);
  }

  const unique = dedupe(matches);
  return { matches: unique.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)), complete };
}

export const WTT_GLOBAL = { channelId: CHANNEL_ID, handle: CHANNEL_HANDLE };
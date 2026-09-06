import { NextResponse } from "next/server";
import { fetchLebrunMatches, type Match } from "@/lib/youtube";
import snapshot from "@/data/matches.json";

export const maxDuration = 300;
export const revalidate = 21600;

const CACHE_TTL_MS = 1000 * 60 * 45;
let cache: {
  data: Match[] | null;
  at: number;
  source: string;
  ok: boolean;
} = {
  data: null,
  at: 0,
  source: "snapshot",
  ok: true,
};

function mergeWithSnapshot(live: Match[]): Match[] {
  const byId = new Map<string, Match>();
  for (const m of snapshot as unknown as Match[]) byId.set(m.id, m);
  for (const m of live) {
    const existing = byId.get(m.id);
    if (!existing || (existing.kind !== "full" && m.kind === "full")) byId.set(m.id, m);
  }
  return [...byId.values()].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

function pickSource(live: Match[], complete: boolean): { data: Match[]; source: string } {
  const snap = snapshot as unknown as Match[];
  if (complete || live.length >= snap.length) return { data: live, source: "live" };
  return { data: mergeWithSnapshot(live), source: "snapshot" };
}

async function scrape(): Promise<{ data: Match[]; source: string }> {
  const { matches, complete } = await fetchLebrunMatches();
  const picked = pickSource(matches, complete);
  return { data: picked.data, source: picked.source };
}

export async function GET() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(
      { matches: cache.data, updatedAt: new Date(cache.at).toISOString(), source: cache.source, cached: true },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  }

  try {
    const { data, source } = await scrape();
    cache = { data, at: Date.now(), source, ok: data.length > 0 };
    return NextResponse.json(
      {
        matches: data.length ? data : (snapshot as unknown as Match[]),
        updatedAt: new Date().toISOString(),
        source: data.length ? source : "snapshot",
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        matches: snapshot as unknown as Match[],
        updatedAt: new Date().toISOString(),
        source: "snapshot",
        error: e instanceof Error ? e.message : "scrape failed",
      },
      { headers: { "Cache-Control": "public, s-maxage=900" } },
    );
  }
}
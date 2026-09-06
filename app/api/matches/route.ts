import { NextResponse } from "next/server";
import { fetchLebrunMatches, type Match } from "@/lib/youtube";
import snapshot from "@/data/matches.json";

export const maxDuration = 300;
export const revalidate = 21600;

const CACHE_TTL_MS = 1000 * 60 * 45;
let cache: { data: Match[] | null; at: number; source: string; ok: boolean } = {
  data: null,
  at: 0,
  source: "snapshot",
  ok: true,
};

async function scrape(): Promise<{ data: Match[]; source: string }> {
  const matches = await fetchLebrunMatches();
  return { data: matches, source: matches.length ? "live" : "snapshot" };
}

export async function GET() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(
      { matches: cache.data, updatedAt: new Date(cache.at).toISOString(), source: cache.source, cached: true },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
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
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
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
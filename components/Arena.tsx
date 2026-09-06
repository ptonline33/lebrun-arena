"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Match } from "@/lib/youtube";

type Chip =
  | "all"
  | "full"
  | "highlights"
  | "singles"
  | "doubles"
  | "mixed"
  | "interviews";

const CHIPS: { id: Chip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "full", label: "Full Match" },
  { id: "singles", label: "Singles" },
  { id: "doubles", label: "Doubles" },
  { id: "mixed", label: "Mixed" },
  { id: "highlights", label: "Highlights" },
];

function cap(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function kindLabel(kind: Match["kind"]): string {
  return kind === "full" ? "FULL MATCH" : kind === "highlight" ? "HIGHLIGHT" : "MATCH";
}

function Balls() {
  const balls = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 37 + 13) % 96,
        size: 10 + ((i * 13) % 26),
        dur: 16 + ((i * 17) % 20),
        delay: -((i * 11) % 22),
      })),
    [],
  );
  return (
    <div className="ping-balls">
      {balls.map((b, i) => (
        <span
          key={i}
          className="ball"
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function Marquee() {
  const items = [
    "Félix Lebrun",
    "Alexis Lebrun",
    "Full Matches",
    "2025–26 Season",
    "WTT Global",
    "Singles",
    "Doubles",
    "Mixed",
    "World Table Tennis",
  ];
  return (
    <div className="marquee relative z-10 overflow-hidden border-y border-gold/20 bg-black/40 py-4 backdrop-blur">
      <div className="marquee-track font-display text-sm tracking-[0.3em] text-gold-soft/90">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap">
            {item} <span className="text-gold/50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatChip({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="glass rounded-2xl px-5 py-4 text-center">
      <div className="font-display text-2xl font-bold text-gold-soft sm:text-3xl">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-white/50">{label}</div>
    </div>
  );
}

export default function Arena() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [chip, setChip] = useState<Chip>("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Match | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/matches", { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Server responded ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setMatches(d.matches ?? []);
        setUpdatedAt(d.updatedAt ?? null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const onFullscreen = () => {
      const fullscreen =
        document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: OrientationLockType) => Promise<void>;
      };
      try {
        if (fullscreen) {
          orientation.lock?.("landscape")?.catch?.(() => {});
        } else {
          orientation.unlock?.();
        }
      } catch {
        /* Orientation lock unavailable (e.g. iOS Safari) */
      }
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("webkitfullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("webkitfullscreenchange", onFullscreen);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = matches;
    if (chip !== "all") {
      if (chip === "full") list = list.filter((m) => m.kind === "full");
      else if (chip === "highlights") list = list.filter((m) => m.kind === "highlight");
      else if (chip === "singles")
        list = list.filter((m) => !m.player.includes("/") && !m.opponent.includes("/"));
      else if (chip === "doubles")
        list = list.filter((m) => /\b(MD|WD|Doubles)\b/i.test(m.title) || m.opponent.includes("/"));
      else if (chip === "mixed") list = list.filter((m) => /\b(XD|Mixed)\b/i.test(m.title));
    }
    if (q) {
      list = list.filter((m) =>
        [m.title, m.player, m.opponent, m.event, m.round].join(" ").toLowerCase().includes(q),
      );
    }
    return list;
  }, [matches, chip, query]);

  const stats = useMemo(() => {
    const singles = matches.filter((m) => !m.player.includes("/") && !m.opponent.includes("/"));
    const full = matches.filter((m) => m.kind === "full");
    const events = new Set(matches.map((m) => m.event).filter(Boolean)).size;
    return { total: matches.length, singles: singles.length, full: full.length, events };
  }, [matches]);

  const scrollToGrid = () => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="relative">
      <div className="aura" aria-hidden />

      {/* ------------ HERO ------------ */}
      <header className="relative px-6 pb-10 pt-16 text-center sm:pt-24">
        <div
          className="mx-auto mb-8 flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36"
          aria-hidden
        >
          <div className="relative">
            <div className="spin-slow absolute -inset-6 rounded-full border border-dashed border-gold/40" />
            <div className="absolute -inset-12 rounded-full border border-gold/15" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dim shadow-[0_0_40px_rgba(212,175,55,0.45)] sm:h-20 sm:w-20">
              <span className="font-display text-2xl font-black text-night sm:text-3xl">LK</span>
            </div>
          </div>
        </div>

        <p className="fade-up font-display text-xs font-medium tracking-[0.5em] text-gold sm:text-sm">
          WORLD TABLE TENNIS &nbsp;•&nbsp; WTT GLOBAL
        </p>
        <h1
          className="fade-up gold-text mx-auto mt-4 max-w-5xl font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl"
          style={{ animationDelay: "80ms" }}
        >
          LEBRUN ARENA
        </h1>
        <p
          className="fade-up mx-auto mt-5 max-w-2xl text-base text-white/70 sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Every ping pong <span className="text-gold-soft">full match from 2025–26</span> featuring{" "}
          <span className="text-gold-soft">Félix Lebrun</span> or{" "}
          <span className="text-gold-soft">Alexis Lebrun</span> — pulled live from the WTT Global
          YouTube channel and ready to watch right here.
        </p>

        <div
          className="fade-up mt-9 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "240ms" }}
        >
          <button
            onClick={scrollToGrid}
            className="rounded-full bg-gradient-to-br from-gold to-gold-dim px-8 py-3 font-display text-sm font-bold tracking-[0.2em] text-night transition hover:scale-105 hover:shadow-[0_0_35px_rgba(212,175,55,0.5)]"
          >
            ENTER THE ARENA
          </button>
          <a
            href="https://www.youtube.com/@wttglobal"
            target="_blank"
            rel="noreferrer"
            className="gold-outline rounded-full px-8 py-3 font-display text-sm font-semibold tracking-[0.2em]"
          >
            SOURCE · WTT GLOBAL
          </a>
        </div>

        <p className="fade-up mt-6 text-xs uppercase tracking-[0.3em] text-white/40" style={{ animationDelay: "320ms" }}>
          {loading ? "Powering up the arena…" : `${stats.total} matches staged · updated ${updatedAt ? new Date(updatedAt).toUTCString().slice(0, 22) : "now"}`}
        </p>
      </header>

      <Marquee />

      {/* ------------ STATS ------------ */}
      <section className="relative z-10 mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 py-12 sm:grid-cols-4">
        <StatChip value={stats.total} label="Matches" />
        <StatChip value={stats.full} label="Full Matches" />
        <StatChip value={stats.singles} label="Singles" />
        <StatChip value={stats.events} label="Events" />
      </section>

      {/* ------------ CONTROLS ------------ */}
      <section ref={gridRef} className="relative z-10 mx-auto max-w-7xl scroll-mt-24 px-6 pb-16">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((c) => {
              const selected = chip === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setChip(c.id)}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    selected
                      ? "bg-gradient-to-br from-gold to-gold-dim text-night shadow-[0_0_22px_rgba(212,175,55,0.4)]"
                      : "glass text-white/70 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-80">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player, event, round…"
              className="w-full rounded-full border border-gold/25 bg-white/5 py-3 pl-11 pr-4 text-sm text-cream outline-none backdrop-blur transition placeholder:text-white/35 focus:border-gold/60 focus:shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            />
          </div>
        </div>

        {/* ------------ GRID ------------ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="spin-slow h-14 w-14 rounded-full border-2 border-gold/20 border-t-gold" />
            <p className="mt-6 font-display text-sm tracking-[0.3em] text-gold-soft">
              Fetching matches from WTT Global…
            </p>
            <p className="mt-2 text-xs text-white/40">
              Deep-scanning the channel feed — this can take a couple of minutes on a cold cache.
            </p>
          </div>
        ) : error && matches.length === 0 ? (
          <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center">
            <p className="font-display text-lg text-gold-soft">The arena sighs.</p>
            <p className="mt-3 text-sm text-white/60">Live scan failed — {error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center">
            <p className="font-display text-lg text-gold-soft">No matches under this banner.</p>
            <p className="mt-3 text-sm text-white/60">Try another filter or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m, i) => (
              <article
                key={m.id}
                className="glass fade-up group cursor-pointer rounded-3xl"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                onClick={() => setActive(m)}
              >
                <div className="glass-thumb relative aspect-video rounded-t-3xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.thumb}
                    alt={m.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-soft backdrop-blur">
                    {kindLabel(m.kind)}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
                    {m.duration}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-night shadow-[0_0_30px_rgba(212,175,55,0.8)] transition group-hover:scale-110">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-cream transition group-hover:text-gold-soft">
                    {m.playersText || m.title}
                  </h3>
                  {m.event && (
                    <p className="mt-2 line-clamp-1 text-xs font-medium tracking-wide text-gold/80">
                      {cap(m.event)}
                      {m.round && <span className="text-white/45"> · {m.round}</span>}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
                    <span>{m.views}</span>
                    <span>{m.relativeTime.replace(/ago.*$/, "ago")}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ------------ FOOTER ------------ */}
      <footer className="relative z-10 border-t border-gold/15 bg-black/50 py-12 text-center backdrop-blur">
        <p className="font-display text-sm tracking-[0.35em] text-gold">LEBRUN ARENA</p>
        <p className="mx-auto mt-4 max-w-xl px-6 text-xs leading-relaxed text-white/45">
          Matches are discovered by a deep scan of the{" "}
          <a className="text-gold/80 underline-offset-4 hover:underline" href="https://www.youtube.com/@wttglobal" target="_blank" rel="noreferrer">
            WTT Global
          </a>{" "}
          YouTube channel feed and filtered to Félix &amp; Alexis Lebrun. Video playback is embedded
          from YouTube. Built with Next.js &amp; Tailwind, deployed on Vercel.
        </p>
        <p className="mt-4 text-[11px] text-white/30">2025–26 season · Not affiliated with WTT, ITTF, or the Lebrun family.</p>
      </footer>

      <Balls />

      {/* ------------ MODAL ------------ */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex w-full max-w-4xl max-h-[92dvh] flex-col overflow-hidden rounded-3xl border border-gold/20 bg-[#0c0f16] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] animate-[fadeUp_0.35s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full max-h-[56dvh] bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&rel=0&color=white`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="overflow-y-auto p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
                    {kindLabel(active.kind)}
                    {active.event ? ` · ${cap(active.event)}` : ""}
                    {active.round ? ` · ${active.round}` : ""}
                  </p>
                  <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-cream sm:text-2xl">
                    {active.playersText || active.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActive(null)}
                  aria-label="Close"
                  className="gold-outline flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/55">
                <span>{active.duration}</span>
                <span>{active.views}</span>
                <span>{active.relativeTime}</span>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${active.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-gold to-gold-dim px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-night transition hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 17.013 17.013 12 7 6.987z" />
                </svg>
                Watch on YouTube
              </a>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-[11px] uppercase tracking-widest text-gold-soft backdrop-blur">
          <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-ember" />
          Syncing arena
        </div>
      )}
    </main>
  );
}
"use client";

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="aura" aria-hidden />
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dim shadow-[0_0_40px_rgba(212,175,55,0.45)]">
        <span className="font-display text-3xl font-black text-night">LK</span>
      </div>
      <p className="mt-8 font-display text-xs font-medium tracking-[0.5em] text-gold">
        THE ARENA IS OFFLINE
      </p>
      <h1 className="gold-text mt-4 font-display text-4xl font-black sm:text-6xl">
        AWAY FROM THE TABLE
      </h1>
      <p className="mt-5 max-w-md text-sm text-white/70 sm:text-base">
        You&apos;ve lost your connection. Reconnect to catch up on the latest Félix &amp;
        Alexis Lebrun matches — your saved ones still play from cache.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-9 rounded-full bg-gradient-to-br from-gold to-gold-dim px-8 py-3 font-display text-sm font-bold tracking-[0.2em] text-night transition hover:scale-105 hover:shadow-[0_0_35px_rgba(212,175,55,0.5)]"
      >
        RETRY CONNECTION
      </button>
    </main>
  );
}
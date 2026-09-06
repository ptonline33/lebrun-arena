"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaStatus() {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    const onInstall = (e: Event) => setDeferred(e as BeforeInstallPromptEvent);
    const onInstalled = () => setInstalled(true);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-40 flex flex-col gap-2">
      {offline && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/85 px-4 py-2 text-[11px] uppercase tracking-widest text-ember backdrop-blur">
          <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-ember" />
          Offline — cached matches ready
        </div>
      )}
      {deferred && !installed && (
        <button
          onClick={install}
          className="pointer-events-auto rounded-full bg-gradient-to-br from-gold to-gold-dim px-5 py-2 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-night shadow-[0_0_22px_rgba(212,175,55,0.4)] transition hover:scale-105"
        >
          Install Arena
        </button>
      )}
    </div>
  );
}
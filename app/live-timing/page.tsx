"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BottomNav } from "@/components/public/bottom-nav";

const LIVE_TIMING_URL = "https://live.apex-timing.com/kartodromo-lucas-guerrero/";

export default function LiveTimingPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeTimeout, setIframeTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIframeTimeout(true);
    }, 7000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const showFallback = useMemo(
    () => iframeError || (iframeTimeout && !iframeLoaded),
    [iframeError, iframeLoaded, iframeTimeout],
  );

  return (
    <>
      <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
        <header className="absolute inset-x-0 top-0 z-10 flex h-12 items-center justify-between border-b border-rks-line/70 bg-black/65 px-3 backdrop-blur-sm">
          <h1 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-100">Live Timing</h1>
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-lg border border-rks-line/70 bg-black/25 px-3 text-xs font-semibold text-zinc-200"
          >
            Volver
          </Link>
        </header>

        <iframe
          src={LIVE_TIMING_URL}
          title="Live Timing"
          className="h-[100dvh] w-full border-0"
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          allow="fullscreen"
        />

        {showFallback ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 px-6 text-center">
            <div className="max-w-sm space-y-3">
              <p className="text-base font-semibold text-zinc-100">No se puede mostrar el live timing aquí</p>
              <a
                href={LIVE_TIMING_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rks-blue/70 bg-rks-blue/15 px-4 text-sm font-semibold text-rks-blue"
              >
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        ) : null}
      </main>

      <BottomNav />
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import type { PublicHomeSnapshot } from "@/lib/public-home";

import { AnnouncementCard } from "./announcement-card";
import { BottomNav } from "./bottom-nav";
import { HeroSection } from "./hero-section";
import { QuickActionCard } from "./quick-action-card";

type PublicHomeScreenProps = {
  initialSnapshot: PublicHomeSnapshot;
};

export function PublicHomeScreen({ initialSnapshot }: PublicHomeScreenProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [now, setNow] = useState(() => parseSnapshotTimestamp(initialSnapshot.generatedAt));

  const refresh = useCallback(async () => {
    const response = await fetch("/api/public/home", {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as PublicHomeSnapshot;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) {
        return;
      }

      await refresh();
    };

    run();
    const interval = setInterval(run, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const countdownText = formatCountdown(snapshot.siguienteFase.hora, now);
  const isRunning = Boolean(snapshot.horarios[snapshot.faseActual]);
  const heroTitle = isRunning ? "EN CURSO" : "SIGUIENTE";
  const heroValue = isRunning
    ? snapshot.faseActualLabel
    : `${snapshot.siguienteFase.label} ${snapshot.siguienteFase.hora}`;
  const featuredAnnouncement = snapshot.anuncioDestacado;

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue opacity-55 animate-neon-lines" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-neon-lines-blue-soft opacity-40 animate-neon-lines [animation-duration:20s]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />

        <main className="relative z-10 mx-auto w-full max-w-5xl space-y-5 px-4 pb-28 pt-6 sm:pt-8 lg:space-y-6">
          <div className="pointer-events-none absolute left-1/2 top-8 h-56 w-[88%] -translate-x-1/2 rounded-full bg-rks-blue/12 blur-3xl" />

        <HeroSection
          eventTitle="RKS KARTING EVENT"
          statusTitle={heroTitle}
          statusValue={heroValue}
          statusSubline={`Fase actual: ${snapshot.estadoActual} · Siguiente: ${snapshot.estadoResumen}`}
        />

          <section
          id="timing"
          className="rounded-3xl border border-rks-line/70 bg-gradient-to-b from-rks-surface/80 to-black/45 p-5 text-center shadow-2xl shadow-black/35"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rks-blue/90">Countdown</p>
          <p className="mt-2 text-base text-zinc-300">{snapshot.siguienteFase.label} en</p>
          <p className="mt-1 text-5xl font-black tracking-[0.06em] text-rks-blue md:text-6xl">
            {countdownText}
          </p>
          </section>

          <section className="rounded-3xl border border-rks-line/70 bg-gradient-to-b from-rks-surface/70 to-black/45 p-4 shadow-2xl shadow-black/35">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rks-blue/90">Quick actions</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <QuickActionCard icon="🟢" label="Directo" href="#timing" />
            <QuickActionCard icon="🏆" label="Resultados" href="#resultados" />
            <QuickActionCard icon="⏱️" label="Qualy" href="#inicio" />
          </div>
          </section>

          <section
          id="info"
          className="rounded-3xl border border-rks-line/70 bg-gradient-to-br from-rks-surface/80 via-black/60 to-rks-blue-deep/20 p-5 shadow-2xl shadow-black/35"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rks-blue/90">
            Featured announcement
          </p>

          {featuredAnnouncement ? (
            <div className="mt-3 space-y-3">
              <AnnouncementCard
                message={featuredAnnouncement.mensaje}
                createdAt={featuredAnnouncement.createdAt}
              />
              <button
                type="button"
                onClick={() => setShowAllAnnouncements((prev) => !prev)}
                className="h-10 rounded-xl border border-rks-blue/60 bg-rks-blue/15 px-4 text-sm font-semibold text-rks-blue transition duration-300 hover:bg-rks-blue/25"
              >
                {showAllAnnouncements ? "Ocultar" : "Ver todos"}
              </button>
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-rks-line/70 bg-black/25 p-4 text-sm text-zinc-400">
              Sin anuncios por ahora.
            </p>
          )}

          {showAllAnnouncements && snapshot.anuncios.length > 1 ? (
            <div className="mt-3 grid gap-2">
              {snapshot.anuncios.slice(1).map((anuncio) => (
                <AnnouncementCard
                  key={anuncio.id}
                  message={anuncio.mensaje}
                  createdAt={anuncio.createdAt}
                />
              ))}
            </div>
          ) : null}
          </section>

          <section
          id="resultados"
          className="rounded-3xl border border-rks-line/70 bg-gradient-to-b from-rks-surface/75 to-black/50 p-5 shadow-2xl shadow-black/35"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rks-blue/90">Última sesión</p>
          <h2 className="mt-1 text-lg font-bold text-white">Top 3</h2>

          <div className="mt-3 space-y-2">
            {snapshot.ultimoResultado.top3.length === 0 ? (
              <p className="rounded-2xl border border-rks-line/70 bg-black/25 p-4 text-sm text-zinc-400">
                Aún no hay resultados guardados.
              </p>
            ) : (
              snapshot.ultimoResultado.top3.map((row) => (
                <div
                  key={`${row.posicion}-${row.piloto}`}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    row.posicion === 1
                      ? "border-rks-blue/70 bg-rks-blue/15 shadow-[0_0_20px_rgba(31,94,255,0.25)]"
                      : "border-rks-line/70 bg-black/25"
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-100">P{row.posicion}</p>
                  <p className="text-sm text-zinc-100">{row.piloto}</p>
                </div>
              ))
            )}
          </div>
          </section>
        </main>
      </div>

      <BottomNav />
    </>
  );
}

function formatCountdown(timeValue: string, nowMs: number) {
  const match = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());
  if (!match) {
    return "--:--:--";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) {
    return "--:--:--";
  }

  const now = new Date(nowMs);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diff = target.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function parseSnapshotTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

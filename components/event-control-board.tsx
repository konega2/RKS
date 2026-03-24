"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteAnuncioAction,
  publishAnuncioAction,
  saveHorariosAction,
  setEventoFaseAction,
  type EventoActionState,
} from "@/app/admin/evento/actions";
import { type EventoSnapshot } from "@/app/admin/evento/data";
import { EVENT_PHASE_LABEL, EVENT_PHASES, type EventPhase } from "@/lib/evento";

type EventControlBoardProps = {
  initialSnapshot: EventoSnapshot;
};

const initialActionState: EventoActionState = {
  status: "idle",
};

function openTimePicker(input: HTMLInputElement) {
  if (typeof window !== "undefined") {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (!isTouchDevice) {
      return;
    }
  }

  if (typeof input.showPicker === "function") {
    input.showPicker();
    return;
  }

  input.focus();
}

function eventPhaseButtonLabel(phase: EventPhase) {
  if (phase === "registro") {
    return "Pasar a Registro";
  }

  if (phase === "entrenamiento") {
    return "Pasar a Entrenamiento";
  }

  if (phase === "qualy") {
    return "Pasar a Qualy";
  }

  return "Pasar a Carrera";
}

export function EventControlBoard({ initialSnapshot }: EventControlBoardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [scheduleDraft, setScheduleDraft] = useState<Record<EventPhase, string>>(
    initialSnapshot.horarios,
  );

  const [phaseState, phaseAction, phasePending] = useActionState(
    setEventoFaseAction,
    initialActionState,
  );
  const [scheduleState, scheduleAction, schedulePending] = useActionState(
    saveHorariosAction,
    initialActionState,
  );
  const [publishState, publishAction, publishPending] = useActionState(
    publishAnuncioAction,
    initialActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAnuncioAction,
    initialActionState,
  );

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch("/admin/evento/data", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as EventoSnapshot;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) {
        return;
      }

      await refreshSnapshot();
    };

    run();
    const interval = setInterval(run, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshSnapshot]);

  const phaseMessage = useMemo(() => {
    if (phaseState.status === "error") {
      return { text: phaseState.message ?? "Error al cambiar fase.", tone: "text-red-300" };
    }

    if (phaseState.status === "success") {
      return {
        text: phaseState.message ?? "Fase actualizada.",
        tone: "text-emerald-300",
      };
    }

    return null;
  }, [phaseState.message, phaseState.status]);

  const scheduleMessage = useMemo(() => {
    if (scheduleState.status === "error") {
      return { text: scheduleState.message ?? "Error al guardar horarios.", tone: "text-red-300" };
    }

    if (scheduleState.status === "success") {
      return {
        text: scheduleState.message ?? "Horarios guardados.",
        tone: "text-emerald-300",
      };
    }

    return null;
  }, [scheduleState.message, scheduleState.status]);

  const anuncioMessage = useMemo(() => {
    const errorState = [publishState, deleteState].find((state) => state.status === "error");
    if (errorState?.message) {
      return { text: errorState.message, tone: "text-red-300" };
    }

    const successState = [publishState, deleteState].find((state) => state.status === "success");
    if (successState?.message) {
      return { text: successState.message, tone: "text-emerald-300" };
    }

    return null;
  }, [deleteState, publishState]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 md:space-y-8">
      <div className="rounded-2xl border border-rks-line/80 bg-gradient-to-r from-rks-surface/95 via-zinc-950 to-zinc-950 p-4 shadow-lg shadow-black/20 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rks-amber/85">
              Event control
            </p>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-[0.08em] text-zinc-100 md:text-3xl">
              Fases, horarios y anuncios
            </h2>
          </div>

          <span className="rounded-full border border-rks-line bg-black/25 px-3 py-1 text-xs font-semibold text-zinc-300">
            Actualización: 2.5s
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-amber/90">1) Fase actual</p>
        <h3 className="mt-1 text-lg font-bold text-white">Control manual de fase del evento</h3>

        <div className="mt-3 rounded-xl border border-rks-line/70 bg-black/25 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Fase en curso</p>
          <p className="mt-1 text-2xl font-black uppercase text-rks-blue md:text-3xl">
            {EVENT_PHASE_LABEL[snapshot.faseActual]}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {EVENT_PHASES.map((phase) => {
            const isActive = snapshot.faseActual === phase;

            return (
              <form key={phase} action={phaseAction}>
                <input type="hidden" name="fase" value={phase} />
                <button
                  type="submit"
                  disabled={phasePending}
                  className={`h-12 w-full rounded-xl border px-4 text-sm font-bold transition md:text-base ${
                    isActive
                      ? "border-rks-amber/70 bg-rks-amber text-zinc-950"
                      : "border-rks-line bg-black/30 text-zinc-100 hover:border-rks-blue/70"
                  }`}
                >
                  {eventPhaseButtonLabel(phase)}
                </button>
              </form>
            );
          })}
        </div>

        {phaseMessage ? <p className={`mt-3 text-sm ${phaseMessage.tone}`}>{phaseMessage.text}</p> : null}
      </div>

      <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rks-blue/90">2) Horarios</p>
        <h3 className="mt-1 text-lg font-bold text-white">Planificación del evento</h3>

        <form action={scheduleAction} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {EVENT_PHASES.map((phase) => (
              <label key={phase} className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  {EVENT_PHASE_LABEL[phase]}
                </span>
                <input
                  name={`${phase}Hora`}
                  type="time"
                  value={scheduleDraft[phase]}
                  onClick={(event) => openTimePicker(event.currentTarget)}
                  onChange={(event) =>
                    setScheduleDraft((prev) => ({
                      ...prev,
                      [phase]: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-rks-line bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rks-line/70 bg-black/20 p-3">
            <p className={`text-sm ${scheduleMessage?.tone ?? "text-zinc-400"}`}>
              {scheduleMessage?.text ?? "Configura y guarda la hora de cada fase."}
            </p>

            <button
              type="submit"
              disabled={schedulePending}
              className="h-11 rounded-xl bg-rks-blue px-5 text-sm font-semibold text-white shadow-lg shadow-rks-blue/25 transition hover:brightness-110 disabled:opacity-70"
            >
              {schedulePending ? "Guardando..." : "Guardar horarios"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-rks-line/70 bg-rks-surface/80 p-4 shadow-xl shadow-black/25 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">3) Anuncios</p>
        <h3 className="mt-1 text-lg font-bold text-white">Comunicación en vivo</h3>

        <form
          key={publishState.status === "success" ? publishState.message ?? "published" : "draft"}
          action={publishAction}
          className="mt-4 space-y-3"
        >
          <textarea
            name="mensaje"
            placeholder="Escribe un anuncio para el sitio público..."
            rows={4}
            className="w-full rounded-xl border border-rks-line bg-black/30 px-3 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-rks-blue focus:ring-2 focus:ring-rks-blue/35"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={publishPending}
              className="h-11 rounded-xl bg-rks-amber px-5 text-sm font-bold text-zinc-950 transition hover:brightness-110 disabled:opacity-70"
            >
              {publishPending ? "Publicando..." : "Publicar anuncio"}
            </button>
          </div>
        </form>

        <p className={`mt-2 text-sm ${anuncioMessage?.tone ?? "text-zinc-400"}`}>
          {anuncioMessage?.text ?? "Publica avisos para que se vean en el sitio público."}
        </p>

        <div className="mt-4 space-y-2">
          {snapshot.anuncios.length === 0 ? (
            <p className="rounded-xl border border-rks-line/70 bg-black/20 p-3 text-sm text-zinc-400">
              Todavía no hay anuncios publicados.
            </p>
          ) : (
            snapshot.anuncios.map((anuncio) => (
              <article
                key={anuncio.id}
                className="rounded-xl border border-rks-line/70 bg-black/20 p-3"
              >
                <p className="text-sm text-zinc-100">{anuncio.mensaje}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400">
                    {formatDateTime(anuncio.createdAt)}
                  </p>
                  <form action={deleteAction}>
                    <input type="hidden" name="anuncioId" value={anuncio.id} />
                    <button
                      type="submit"
                      disabled={deletePending}
                      className="h-8 rounded-lg border border-red-500/50 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function formatDateTime(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

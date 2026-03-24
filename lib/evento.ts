export const EVENT_PHASES = [
  "registro",
  "entrenamiento",
  "qualy",
  "carrera",
] as const;

export type EventPhase = (typeof EVENT_PHASES)[number];

export const EVENT_PHASE_LABEL: Record<EventPhase, string> = {
  registro: "Registro",
  entrenamiento: "Entrenamiento",
  qualy: "Qualy",
  carrera: "Carrera",
};

export function isEventPhase(value: string): value is EventPhase {
  return EVENT_PHASES.includes(value as EventPhase);
}

export function normalizeScheduleHour(raw: string) {
  return raw.trim();
}

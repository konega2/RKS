export const ENTRENO_QUALY_SESSION = "entreno_qualy";
export const ENTRENO_CARRERA_SESSION = "entreno_carrera";

export type EntrenoSession =
  | typeof ENTRENO_QUALY_SESSION
  | typeof ENTRENO_CARRERA_SESSION;

export type SanctionType = "segundos" | "posiciones";

export type PilotBase = {
  id: number;
  nombre: string;
  apellidos: string;
  kart: number | null;
  foto: string | null;
};

export type LapInput = {
  id: number;
  pilotoId: number;
  sesion: string;
  numero: number;
  tiempo: number;
  createdAt: Date;
};

export type SanctionInput = {
  id: number;
  pilotoId: number;
  sesion: string;
  tipo: string;
  valor: number;
  motivo: string;
  vuelta: number | null;
};

export type QualyRow = {
  pos: number;
  pilotoId: number;
  piloto: string;
  lapId: number | null;
  tiempoOriginal: number | null;
  tiempoFinal: number | null;
  sancionSegundos: number;
  sanciones: SanctionInput[];
};

export type RaceRow = {
  pos: number;
  pilotoId: number;
  piloto: string;
  kart: number | null;
  laps: number;
  mejorVuelta: number | null;
  ultimaVuelta: number | null;
  gap: string;
  tiempoTotal: number | null;
  sancionSegundos: number;
  sancionPosiciones: number;
  sanciones: SanctionInput[];
};

export type PilotLapSummary = {
  pilotoId: number;
  piloto: string;
  laps: Array<{
    id: number;
    numero: number;
    tiempo: number;
    esMejor: boolean;
  }>;
};

export type EntrenamientoSnapshot = {
  generatedAt: string;
  replayLap: number | null;
  maxRaceLap: number;
  fastestRaceLap: {
    pilotoId: number;
    tiempo: number;
  } | null;
  pilots: PilotBase[];
  qualyRows: QualyRow[];
  raceRows: RaceRow[];
  raceLapSummary: PilotLapSummary[];
};

export function formatLapTime(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "—";
  }

  return seconds.toFixed(3);
}

function sumSanctionsSeconds(sanctions: SanctionInput[]) {
  return sanctions
    .filter((item) => item.tipo === "segundos")
    .reduce((acc, item) => acc + item.valor, 0);
}

function sumSanctionsPositions(sanctions: SanctionInput[]) {
  return sanctions
    .filter((item) => item.tipo === "posiciones")
    .reduce((acc, item) => acc + item.valor, 0);
}

export function computeQualyRows(input: {
  pilots: PilotBase[];
  laps: LapInput[];
  sanctions: SanctionInput[];
}) {
  const lapsByPilot = new Map<number, LapInput>();

  for (const lap of input.laps) {
    if (lap.sesion !== ENTRENO_QUALY_SESSION) {
      continue;
    }

    const current = lapsByPilot.get(lap.pilotoId);
    if (!current || lap.createdAt > current.createdAt) {
      lapsByPilot.set(lap.pilotoId, lap);
    }
  }

  const sanctionsByPilot = new Map<number, SanctionInput[]>();
  for (const sanction of input.sanctions) {
    if (sanction.sesion !== ENTRENO_QUALY_SESSION) {
      continue;
    }

    if (!sanctionsByPilot.has(sanction.pilotoId)) {
      sanctionsByPilot.set(sanction.pilotoId, []);
    }

    sanctionsByPilot.get(sanction.pilotoId)?.push(sanction);
  }

  const rows = input.pilots.map((pilot) => {
    const lap = lapsByPilot.get(pilot.id);
    const sanctions = sanctionsByPilot.get(pilot.id) ?? [];
    const sancionSegundos = sumSanctionsSeconds(sanctions);
    const tiempoOriginal = lap?.tiempo ?? null;
    const tiempoFinal =
      tiempoOriginal != null ? tiempoOriginal + sancionSegundos : null;

    return {
      pos: 0,
      pilotoId: pilot.id,
      piloto: `${pilot.nombre} ${pilot.apellidos}`,
      lapId: lap?.id ?? null,
      tiempoOriginal,
      tiempoFinal,
      sancionSegundos,
      sanciones: sanctions,
    } satisfies QualyRow;
  });

  rows.sort((left, right) => {
    if (left.tiempoFinal == null && right.tiempoFinal == null) {
      return left.piloto.localeCompare(right.piloto);
    }

    if (left.tiempoFinal == null) {
      return 1;
    }

    if (right.tiempoFinal == null) {
      return -1;
    }

    return left.tiempoFinal - right.tiempoFinal;
  });

  return rows.map((row, index) => ({ ...row, pos: index + 1 }));
}

function applyPositionSanctions(baseRows: RaceRow[]) {
  const result = [...baseRows];

  for (let index = 0; index < result.length; index += 1) {
    const current = result[index];
    const shift = Math.round(current.sancionPosiciones);

    if (shift === 0) {
      continue;
    }

    const currentIndex = result.findIndex((row) => row.pilotoId === current.pilotoId);
    if (currentIndex === -1) {
      continue;
    }

    const [moved] = result.splice(currentIndex, 1);
    const targetIndex = Math.max(
      0,
      Math.min(result.length, currentIndex + shift),
    );
    result.splice(targetIndex, 0, moved);
  }

  return result;
}

export function computeRaceRows(input: {
  pilots: PilotBase[];
  laps: LapInput[];
  sanctions: SanctionInput[];
  replayLap: number | null;
}) {
  const lapsByPilot = new Map<number, LapInput[]>();

  for (const pilot of input.pilots) {
    lapsByPilot.set(pilot.id, []);
  }

  for (const lap of input.laps) {
    if (lap.sesion !== ENTRENO_CARRERA_SESSION) {
      continue;
    }

    if (input.replayLap != null && lap.numero > input.replayLap) {
      continue;
    }

    const list = lapsByPilot.get(lap.pilotoId);
    if (list) {
      list.push(lap);
    }
  }

  for (const list of lapsByPilot.values()) {
    list.sort((a, b) => a.numero - b.numero || a.createdAt.getTime() - b.createdAt.getTime());
  }

  const sanctionsByPilot = new Map<number, SanctionInput[]>();
  for (const sanction of input.sanctions) {
    if (sanction.sesion !== ENTRENO_CARRERA_SESSION) {
      continue;
    }

    if (!sanctionsByPilot.has(sanction.pilotoId)) {
      sanctionsByPilot.set(sanction.pilotoId, []);
    }

    sanctionsByPilot.get(sanction.pilotoId)?.push(sanction);
  }

  const lapSummary: PilotLapSummary[] = [];
  let fastestRaceLap: { pilotoId: number; tiempo: number } | null = null;

  const baseRows = input.pilots.map((pilot) => {
    const laps = lapsByPilot.get(pilot.id) ?? [];
    const sanctions = sanctionsByPilot.get(pilot.id) ?? [];

    const lapsCount = laps.length;
    const totalBase = laps.reduce((acc, lap) => acc + lap.tiempo, 0);
    const bestLap = lapsCount > 0 ? Math.min(...laps.map((lap) => lap.tiempo)) : null;
    const lastLap = lapsCount > 0 ? laps[laps.length - 1]?.tiempo ?? null : null;

    if (bestLap != null) {
      if (!fastestRaceLap || bestLap < fastestRaceLap.tiempo) {
        fastestRaceLap = { pilotoId: pilot.id, tiempo: bestLap };
      }
    }

    const sancionSegundos = sumSanctionsSeconds(sanctions);
    const sancionPosiciones = sumSanctionsPositions(sanctions);
    const total = lapsCount > 0 ? totalBase + sancionSegundos : null;

    lapSummary.push({
      pilotoId: pilot.id,
      piloto: `${pilot.nombre} ${pilot.apellidos}`,
      laps: laps.map((lap) => ({
        id: lap.id,
        numero: lap.numero,
        tiempo: lap.tiempo,
        esMejor: bestLap != null && lap.tiempo === bestLap,
      })),
    });

    return {
      pos: 0,
      pilotoId: pilot.id,
      piloto: `${pilot.nombre} ${pilot.apellidos}`,
      kart: pilot.kart,
      laps: lapsCount,
      mejorVuelta: bestLap,
      ultimaVuelta: lastLap,
      gap: "—",
      tiempoTotal: total,
      sancionSegundos,
      sancionPosiciones,
      sanciones: sanctions,
    } satisfies RaceRow;
  });

  baseRows.sort((left, right) => {
    if (left.laps !== right.laps) {
      return right.laps - left.laps;
    }

    if (left.tiempoTotal == null && right.tiempoTotal == null) {
      return left.piloto.localeCompare(right.piloto);
    }

    if (left.tiempoTotal == null) {
      return 1;
    }

    if (right.tiempoTotal == null) {
      return -1;
    }

    return left.tiempoTotal - right.tiempoTotal;
  });

  const reorderedRows = applyPositionSanctions(baseRows);
  const withPosition = reorderedRows.map((row, index) => ({ ...row, pos: index + 1 }));

  const leader = withPosition[0] ?? null;
  const leaderTime = leader?.tiempoTotal ?? null;
  const leaderLaps = leader?.laps ?? 0;

  const rowsWithGap = withPosition.map((row) => {
    if (row.pos === 1 || leader == null || leaderTime == null || row.tiempoTotal == null) {
      return { ...row, gap: "—" };
    }

    if (row.laps < leaderLaps) {
      return { ...row, gap: `+${leaderLaps - row.laps}L` };
    }

    return { ...row, gap: `+${(row.tiempoTotal - leaderTime).toFixed(3)}s` };
  });

  return {
    rows: rowsWithGap,
    fastestRaceLap,
    lapSummary,
  };
}

export function formatSanctionLabel(type: SanctionType, value: number) {
  if (type === "segundos") {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value}s`;
  }

  const rounded = Math.round(value);
  if (rounded >= 0) {
    return `-${rounded} pos`;
  }

  return `+${Math.abs(rounded)} pos`;
}

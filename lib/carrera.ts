import { computeQualySnapshot, type QualyPilotBase } from "@/lib/qualy";

export const CARRERA_FINAL_SESSION = "carrera_final";

export type CarreraSanctionType = "segundos" | "posiciones";

export type CarreraPilotBase = QualyPilotBase;

export type CarreraLapInput = {
  id: number;
  pilotoId: number;
  sesion: string;
  numero: number;
  tiempo: number;
  createdAt: Date;
};

export type CarreraSanctionInput = {
  id: number;
  pilotoId: number;
  sesion: string;
  tipo: string;
  valor: number;
  motivo: string;
  vuelta: number | null;
};

export type CarreraRow = {
  pos: number;
  pilotoId: number;
  piloto: string;
  kart: number | null;
  laps: number;
  ultimaVuelta: number | null;
  mejorVuelta: number | null;
  gap: string;
  tiempoTotal: number | null;
  sancionSegundos: number;
  sancionPosiciones: number;
  sanciones: CarreraSanctionInput[];
};

export type CarreraPilotLaps = {
  pilotoId: number;
  piloto: string;
  totalTime: number | null;
  laps: Array<{
    id: number;
    numero: number;
    tiempo: number;
    esMejor: boolean;
  }>;
};

export type CarreraSnapshot = {
  generatedAt: string;
  replayLap: number | null;
  maxLap: number;
  targetLaps: number;
  pilots: CarreraPilotBase[];
  startingGrid: Array<{
    pos: number;
    pilotoId: number;
    piloto: string;
    kart: number | null;
    tiempoQualy: number | null;
  }>;
  raceRows: CarreraRow[];
  raceLaps: CarreraPilotLaps[];
  fastestLap: { pilotoId: number; tiempo: number } | null;
  savedResults: Array<{
    pilotoId: number;
    piloto: string;
    posicion: number;
    puntos: number;
  }>;
};

export function formatLapTime(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "—";
  }

  return seconds.toFixed(3);
}

function sumSecondsSanctions(sanctions: CarreraSanctionInput[]) {
  return sanctions
    .filter((item) => item.tipo === "segundos")
    .reduce((acc, item) => acc + item.valor, 0);
}

function sumPositionSanctions(sanctions: CarreraSanctionInput[]) {
  return sanctions
    .filter((item) => item.tipo === "posiciones")
    .reduce((acc, item) => acc + item.valor, 0);
}

function applyPositionPenalties(baseRows: CarreraRow[]) {
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
    const targetIndex = Math.max(0, Math.min(result.length, currentIndex + shift));
    result.splice(targetIndex, 0, moved);
  }

  return result;
}

export function computePoints(totalPilots: number, position: number) {
  const raw = (totalPilots - position) * 2;
  return raw > 0 ? raw : 0;
}

export function buildStartingGrid(input: {
  pilots: CarreraPilotBase[];
  laps: CarreraLapInput[];
  sanctions: CarreraSanctionInput[];
}) {
  const qualy = computeQualySnapshot({
    pilots: input.pilots,
    laps: input.laps,
    sanctions: input.sanctions,
  });

  const rows = qualy.rows
    .filter((row) => row.mejorVueltaFinal != null)
    .map((row) => ({
      pos: row.pos,
      pilotoId: row.pilotoId,
      piloto: row.piloto,
      kart: row.kart,
      tiempoQualy: row.mejorVueltaFinal,
    }));

  return rows;
}

export function computeCarreraSnapshot(input: {
  pilots: CarreraPilotBase[];
  laps: CarreraLapInput[];
  sanctions: CarreraSanctionInput[];
  replayLap: number | null;
}) {
  const lapsByPilot = new Map<number, CarreraLapInput[]>();
  const sanctionsByPilot = new Map<number, CarreraSanctionInput[]>();

  for (const pilot of input.pilots) {
    lapsByPilot.set(pilot.id, []);
    sanctionsByPilot.set(pilot.id, []);
  }

  for (const lap of input.laps) {
    if (lap.sesion !== CARRERA_FINAL_SESSION) {
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

  for (const sanction of input.sanctions) {
    if (sanction.sesion !== CARRERA_FINAL_SESSION) {
      continue;
    }

    const list = sanctionsByPilot.get(sanction.pilotoId);
    if (list) {
      list.push(sanction);
    }
  }

  const raceLaps: CarreraPilotLaps[] = [];
  let fastestLap: { pilotoId: number; tiempo: number } | null = null;

  const baseRows = input.pilots.map((pilot) => {
    const pilotLapsRaw = lapsByPilot.get(pilot.id) ?? [];
    const sanctions = sanctionsByPilot.get(pilot.id) ?? [];
    const laps = pilotLapsRaw.length;
    const best = laps > 0 ? Math.min(...pilotLapsRaw.map((lap) => lap.tiempo)) : null;
    const last = laps > 0 ? pilotLapsRaw[pilotLapsRaw.length - 1]?.tiempo ?? null : null;
    const baseTotal = pilotLapsRaw.reduce((acc, lap) => acc + lap.tiempo, 0);

    if (best != null && (!fastestLap || best < fastestLap.tiempo)) {
      fastestLap = {
        pilotoId: pilot.id,
        tiempo: best,
      };
    }

    const sancionSegundos = sumSecondsSanctions(sanctions);
    const sancionPosiciones = sumPositionSanctions(sanctions);
    const total = laps > 0 ? baseTotal + sancionSegundos : null;

    raceLaps.push({
      pilotoId: pilot.id,
      piloto: `${pilot.nombre} ${pilot.apellidos}`,
      totalTime: total,
      laps: pilotLapsRaw.map((lap) => ({
        id: lap.id,
        numero: lap.numero,
        tiempo: lap.tiempo,
        esMejor: best != null && lap.tiempo === best,
      })),
    });

    return {
      pos: 0,
      pilotoId: pilot.id,
      piloto: `${pilot.nombre} ${pilot.apellidos}`,
      kart: pilot.kart,
      laps,
      ultimaVuelta: last,
      mejorVuelta: best,
      gap: "—",
      tiempoTotal: total,
      sancionSegundos,
      sancionPosiciones,
      sanciones: sanctions,
    } satisfies CarreraRow;
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

  const reordered = applyPositionPenalties(baseRows);
  const positioned = reordered.map((row, index) => ({ ...row, pos: index + 1 }));

  const leader = positioned[0] ?? null;
  const leaderTime = leader?.tiempoTotal ?? null;
  const leaderLaps = leader?.laps ?? 0;

  const withGap = positioned.map((row) => {
    if (row.pos === 1 || leader == null || leaderTime == null || row.tiempoTotal == null) {
      return { ...row, gap: "—" };
    }

    if (row.laps < leaderLaps) {
      return { ...row, gap: `+${leaderLaps - row.laps}L` };
    }

    return {
      ...row,
      gap: `+${(row.tiempoTotal - leaderTime).toFixed(3)}s`,
    };
  });

  const maxLap = input.laps
    .filter((lap) => lap.sesion === CARRERA_FINAL_SESSION)
    .reduce((max, lap) => Math.max(max, lap.numero), 0);

  return {
    rows: withGap,
    raceLaps,
    maxLap,
    fastestLap,
  };
}

export function formatSanctionLabel(type: CarreraSanctionType, value: number) {
  if (type === "segundos") {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value}s`;
  }

  const rounded = Math.round(value);
  return `-${rounded} pos`;
}

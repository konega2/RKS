export const QUALY_OFICIAL_SESSION = "qualy_oficial";

export type QualySanctionType = "segundos" | "eliminar_mejor_vuelta";

export type QualyPilotBase = {
  id: number;
  nombre: string;
  apellidos: string;
  kart: number | null;
  foto: string | null;
};

export type QualyLapInput = {
  id: number;
  pilotoId: number;
  sesion: string;
  numero: number;
  tiempo: number;
  createdAt: Date;
};

export type QualySanctionInput = {
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
  kart: number | null;
  ultimaVuelta: number | null;
  mejorVueltaOriginal: number | null;
  mejorVueltaFinal: number | null;
  gap: string;
  sancionSegundos: number;
  eliminaciones: number;
  sanciones: QualySanctionInput[];
};

export type QualyLapDetail = {
  id: number;
  numero: number;
  tiempo: number;
  isDeleted: boolean;
  isBestOriginal: boolean;
  isBestFinal: boolean;
};

export type QualyPilotLaps = {
  pilotoId: number;
  piloto: string;
  laps: QualyLapDetail[];
};

export type QualySnapshot = {
  generatedAt: string;
  pilots: QualyPilotBase[];
  rows: QualyRow[];
  fastestLap: { pilotoId: number; tiempo: number } | null;
  pilotLaps: QualyPilotLaps[];
};

export function formatLapTime(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "—";
  }

  return seconds.toFixed(3);
}

export function formatSanctionLabel(type: QualySanctionType, value: number) {
  if (type === "segundos") {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value}s`;
  }

  return "❌ Mejor vuelta";
}

export function computeQualySnapshot(input: {
  pilots: QualyPilotBase[];
  laps: QualyLapInput[];
  sanctions: QualySanctionInput[];
}): Omit<QualySnapshot, "generatedAt"> {
  const lapsByPilot = new Map<number, QualyLapInput[]>();
  const sanctionsByPilot = new Map<number, QualySanctionInput[]>();

  for (const pilot of input.pilots) {
    lapsByPilot.set(pilot.id, []);
    sanctionsByPilot.set(pilot.id, []);
  }

  for (const lap of input.laps) {
    if (lap.sesion !== QUALY_OFICIAL_SESSION) {
      continue;
    }

    const list = lapsByPilot.get(lap.pilotoId);
    if (list) {
      list.push(lap);
    }
  }

  for (const sanction of input.sanctions) {
    if (sanction.sesion !== QUALY_OFICIAL_SESSION) {
      continue;
    }

    const list = sanctionsByPilot.get(sanction.pilotoId);
    if (list) {
      list.push(sanction);
    }
  }

  const pilotLaps: QualyPilotLaps[] = [];

  const rows = input.pilots.map((pilot) => {
    const pilotLapsRaw = (lapsByPilot.get(pilot.id) ?? []).sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );

    const orderedByBest = [...pilotLapsRaw].sort((left, right) => {
      if (left.tiempo !== right.tiempo) {
        return left.tiempo - right.tiempo;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    });

    const sanctions = sanctionsByPilot.get(pilot.id) ?? [];
    const eliminaciones = sanctions.filter(
      (item) => item.tipo === "eliminar_mejor_vuelta",
    ).length;
    const sancionSegundos = sanctions
      .filter((item) => item.tipo === "segundos")
      .reduce((acc, item) => acc + item.valor, 0);

    const deletedLapIds = new Set(
      orderedByBest.slice(0, eliminaciones).map((lap) => lap.id),
    );

    const remainingLaps = orderedByBest.filter((lap) => !deletedLapIds.has(lap.id));

    const bestOriginal = orderedByBest[0]?.tiempo ?? null;
    const bestFinalBase = remainingLaps[0]?.tiempo ?? null;
    const bestFinal =
      bestFinalBase != null ? bestFinalBase + sancionSegundos : null;

    const bestOriginalId = orderedByBest[0]?.id ?? null;
    const bestFinalId = remainingLaps[0]?.id ?? null;

    pilotLaps.push({
      pilotoId: pilot.id,
      piloto: `${pilot.nombre} ${pilot.apellidos}`,
      laps: pilotLapsRaw.map((lap) => ({
        id: lap.id,
        numero: lap.numero,
        tiempo: lap.tiempo,
        isDeleted: deletedLapIds.has(lap.id),
        isBestOriginal: bestOriginalId === lap.id,
        isBestFinal: bestFinalId === lap.id,
      })),
    });

    return {
      pos: 0,
      pilotoId: pilot.id,
      piloto: `${pilot.nombre} ${pilot.apellidos}`,
      kart: pilot.kart,
      ultimaVuelta: pilotLapsRaw[pilotLapsRaw.length - 1]?.tiempo ?? null,
      mejorVueltaOriginal: bestOriginal,
      mejorVueltaFinal: bestFinal,
      gap: "—",
      sancionSegundos,
      eliminaciones,
      sanciones: sanctions,
    } satisfies QualyRow;
  });

  rows.sort((left, right) => {
    if (left.mejorVueltaFinal == null && right.mejorVueltaFinal == null) {
      return left.piloto.localeCompare(right.piloto);
    }

    if (left.mejorVueltaFinal == null) {
      return 1;
    }

    if (right.mejorVueltaFinal == null) {
      return -1;
    }

    return left.mejorVueltaFinal - right.mejorVueltaFinal;
  });

  const rowsWithPos = rows.map((row, index) => ({ ...row, pos: index + 1 }));

  const leader = rowsWithPos[0]?.mejorVueltaFinal ?? null;
  const rowsWithGap = rowsWithPos.map((row) => {
    if (row.pos === 1 || row.mejorVueltaFinal == null || leader == null) {
      return { ...row, gap: "—" };
    }

    return {
      ...row,
      gap: `+${(row.mejorVueltaFinal - leader).toFixed(3)}s`,
    };
  });

  const fastestLap =
    rowsWithGap[0]?.mejorVueltaFinal != null
      ? {
          pilotoId: rowsWithGap[0].pilotoId,
          tiempo: rowsWithGap[0].mejorVueltaFinal,
        }
      : null;

  return {
    pilots: input.pilots,
    rows: rowsWithGap,
    fastestLap,
    pilotLaps,
  };
}

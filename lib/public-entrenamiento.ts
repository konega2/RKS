import "server-only";

import {
  computeQualyRows,
  computeRaceRows,
  ENTRENO_CARRERA_SESSION,
  ENTRENO_QUALY_SESSION,
  type PilotBase,
  type PilotLapSummary,
  type QualyRow,
  type RaceRow,
} from "@/lib/entrenamiento";
import { prisma } from "@/lib/prisma";

export type PublicEntrenamientoSnapshot = {
  generatedAt: string;
  qualyRows: QualyRow[];
  qualyLapSummary: Array<{
    pilotoId: number;
    piloto: string;
    laps: Array<{
      numero: number;
      tiempo: number;
      esMejor: boolean;
    }>;
  }>;
  raceRows: RaceRow[];
  raceLapSummary: PilotLapSummary[];
  fastestRaceLap: { pilotoId: number; tiempo: number } | null;
};

export async function getPublicEntrenamientoSnapshot(): Promise<PublicEntrenamientoSnapshot> {
  const [pilots, laps, sanctions] = await Promise.all([
    prisma.piloto.findMany({
      orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
      include: {
        preCarrera: {
          select: {
            kart: true,
          },
        },
      },
    }),
    prisma.vuelta.findMany({
      where: {
        sesion: {
          in: [ENTRENO_QUALY_SESSION, ENTRENO_CARRERA_SESSION],
        },
      },
      orderBy: [{ createdAt: "asc" }, { numero: "asc" }],
    }),
    prisma.sancion.findMany({
      where: {
        sesion: {
          in: [ENTRENO_QUALY_SESSION, ENTRENO_CARRERA_SESSION],
        },
      },
      orderBy: [{ id: "asc" }],
    }),
  ]);

  const pilotBase: PilotBase[] = pilots.map((pilot: {
    id: number;
    nombre: string;
    apellidos: string;
    foto: string | null;
    preCarrera: { kart: number | null } | null;
  }) => ({
    id: pilot.id,
    nombre: pilot.nombre,
    apellidos: pilot.apellidos,
    kart: pilot.preCarrera?.kart ?? null,
    foto: pilot.foto,
  }));

  const qualyRows = computeQualyRows({
    pilots: pilotBase,
    laps,
    sanctions,
  });

  const qualyLapsByPilot = new Map<number, Array<{ numero: number; tiempo: number }>>();
  for (const pilot of pilotBase) {
    qualyLapsByPilot.set(pilot.id, []);
  }

  for (const lap of laps) {
    if (lap.sesion !== ENTRENO_QUALY_SESSION) {
      continue;
    }

    const list = qualyLapsByPilot.get(lap.pilotoId);
    if (list) {
      list.push({ numero: lap.numero, tiempo: lap.tiempo });
    }
  }

  const qualyLapSummary = pilotBase.map((pilot) => {
    const pilotLaps = (qualyLapsByPilot.get(pilot.id) ?? []).sort(
      (left, right) => left.numero - right.numero,
    );
    const best = pilotLaps.length > 0 ? Math.min(...pilotLaps.map((lap) => lap.tiempo)) : null;

    return {
      pilotoId: pilot.id,
      piloto: `${pilot.nombre} ${pilot.apellidos}`,
      laps: pilotLaps.map((lap) => ({
        numero: lap.numero,
        tiempo: lap.tiempo,
        esMejor: best != null && lap.tiempo === best,
      })),
    };
  });

  const raceComputation = computeRaceRows({
    pilots: pilotBase,
    laps,
    sanctions,
    replayLap: null,
  });

  return {
    generatedAt: new Date().toISOString(),
    qualyRows,
    qualyLapSummary,
    raceRows: raceComputation.rows,
    raceLapSummary: raceComputation.lapSummary,
    fastestRaceLap: raceComputation.fastestRaceLap,
  };
}

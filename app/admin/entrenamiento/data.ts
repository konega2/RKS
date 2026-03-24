import "server-only";

import {
  computeQualyRows,
  computeRaceRows,
  ENTRENO_CARRERA_SESSION,
  ENTRENO_QUALY_SESSION,
  type EntrenamientoSnapshot,
} from "@/lib/entrenamiento";
import { prisma } from "@/lib/prisma";

export async function getEntrenamientoSnapshot(replayLap: number | null) {
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

  const pilotBase = pilots.map((pilot: {
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

  const raceComputation = computeRaceRows({
    pilots: pilotBase,
    laps,
    sanctions,
    replayLap,
  });

  const maxRaceLap = laps
    .filter((lap: { sesion: string }) => lap.sesion === ENTRENO_CARRERA_SESSION)
    .reduce(
      (max: number, lap: { numero: number }) => Math.max(max, lap.numero),
      0,
    );

  return {
    generatedAt: new Date().toISOString(),
    replayLap,
    maxRaceLap,
    fastestRaceLap: raceComputation.fastestRaceLap,
    pilots: pilotBase,
    qualyRows,
    raceRows: raceComputation.rows,
    raceLapSummary: raceComputation.lapSummary,
  } satisfies EntrenamientoSnapshot;
}

import "server-only";

import {
  buildStartingGrid,
  CARRERA_FINAL_SESSION,
  computeCarreraSnapshot,
  type CarreraPilotBase,
  type CarreraSnapshot,
} from "@/lib/carrera";
import { prisma } from "@/lib/prisma";

function createEmptyCarreraSnapshot(replayLap: number | null): CarreraSnapshot {
  const pilots: CarreraPilotBase[] = [];

  return {
    generatedAt: new Date().toISOString(),
    replayLap,
    maxLap: 0,
    targetLaps: 20,
    pilots,
    startingGrid: [],
    raceRows: [],
    raceLaps: [],
    fastestLap: null,
    savedResults: [],
  };
}

export async function getCarreraSnapshot(replayLap: number | null = null) {
  try {
    const [pilots, laps, sanctions, savedResults] = await Promise.all([
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
          in: ["qualy_oficial", CARRERA_FINAL_SESSION],
        },
      },
      orderBy: [{ createdAt: "asc" }, { numero: "asc" }],
    }),
    prisma.sancion.findMany({
      where: {
        sesion: {
          in: ["qualy_oficial", CARRERA_FINAL_SESSION],
        },
      },
      orderBy: [{ id: "asc" }],
    }),
    prisma.resultadoCarrera.findMany({
      orderBy: [{ posicion: "asc" }],
      include: {
        piloto: {
          select: {
            nombre: true,
            apellidos: true,
          },
        },
      },
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
    foto: pilot.foto,
    kart: pilot.preCarrera?.kart ?? null,
  }));

  const startingGrid = buildStartingGrid({
    pilots: pilotBase,
    laps,
    sanctions,
  });

  const raceComputation = computeCarreraSnapshot({
    pilots: pilotBase,
    laps,
    sanctions,
    replayLap,
  });

    return {
      generatedAt: new Date().toISOString(),
      replayLap,
      maxLap: raceComputation.maxLap,
      targetLaps: 20,
      pilots: pilotBase,
      startingGrid,
      raceRows: raceComputation.rows,
      raceLaps: raceComputation.raceLaps,
      fastestLap: raceComputation.fastestLap,
      savedResults: savedResults.map((result: (typeof savedResults)[number]) => ({
        pilotoId: result.pilotoId,
        piloto: `${result.piloto.nombre} ${result.piloto.apellidos}`,
        posicion: result.posicion,
        puntos: result.puntos,
      })),
    } satisfies CarreraSnapshot;
  } catch (error) {
    console.error("getCarreraSnapshot failed", error);
    return createEmptyCarreraSnapshot(replayLap);
  }
}

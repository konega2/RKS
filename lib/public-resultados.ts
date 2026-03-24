import "server-only";

import { getCarreraSnapshot } from "@/app/admin/carrera/data";
import { formatLapTime } from "@/lib/carrera";

export type PublicResultadosSnapshot = {
  generatedAt: string;
  podium: Array<{
    posicion: number;
    pilotoId: number;
    piloto: string;
    kart: number | null;
    foto: string | null;
    puntos: number;
    tiempo: string;
  }>;
  rows: Array<{
    posicion: number;
    pilotoId: number;
    piloto: string;
    kart: number | null;
    foto: string | null;
    tiempo: string;
    puntos: number;
  }>;
};

function createEmptyPublicResultadosSnapshot(): PublicResultadosSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    podium: [],
    rows: [],
  };
}

export async function getPublicResultadosSnapshot(): Promise<PublicResultadosSnapshot> {
  try {
    const snapshot = await getCarreraSnapshot();

  const pilotById = new Map(
    snapshot.pilots.map((pilot) => [
      pilot.id,
      {
        kart: pilot.kart,
        foto: pilot.foto,
      },
    ]),
  );

  const raceRowByPilotId = new Map(
    snapshot.raceRows.map((row) => [
      row.pilotoId,
      {
        tiempo: row.tiempoTotal,
      },
    ]),
  );

  const rows = snapshot.savedResults
    .map((result) => {
      const pilot = pilotById.get(result.pilotoId);
      const race = raceRowByPilotId.get(result.pilotoId);

      return {
        posicion: result.posicion,
        pilotoId: result.pilotoId,
        piloto: result.piloto,
        kart: pilot?.kart ?? null,
        foto: pilot?.foto ?? null,
        tiempo: formatLapTime(race?.tiempo ?? null),
        puntos: result.puntos,
      };
    })
    .sort((left, right) => left.posicion - right.posicion);

    return {
      generatedAt: new Date().toISOString(),
      podium: rows.filter((row) => row.posicion <= 3),
      rows,
    };
  } catch (error) {
    console.error("getPublicResultadosSnapshot failed", error);
    return createEmptyPublicResultadosSnapshot();
  }
}

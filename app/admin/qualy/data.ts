import "server-only";

import { computeQualySnapshot, QUALY_OFICIAL_SESSION, type QualySnapshot } from "@/lib/qualy";
import { prisma } from "@/lib/prisma";

export async function getQualySnapshot() {
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
        sesion: QUALY_OFICIAL_SESSION,
      },
      orderBy: [{ createdAt: "asc" }, { numero: "asc" }],
    }),
    prisma.sancion.findMany({
      where: {
        sesion: QUALY_OFICIAL_SESSION,
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
    foto: pilot.foto,
    kart: pilot.preCarrera?.kart ?? null,
  }));

  const computed = computeQualySnapshot({
    pilots: pilotBase,
    laps,
    sanctions,
  });

  return {
    generatedAt: new Date().toISOString(),
    ...computed,
  } satisfies QualySnapshot;
}

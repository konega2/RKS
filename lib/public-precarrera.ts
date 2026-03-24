import "server-only";

import { formatBallastBreakdown } from "@/lib/precarrera";
import { prisma } from "@/lib/prisma";

export type PublicPreCarreraSnapshot = {
  generatedAt: string;
  rows: Array<{
    pilotoId: number;
    piloto: string;
    kart: number | null;
    lastre: number | null;
    lastreLabel: string;
    hasKart: boolean;
    hasWeight: boolean;
  }>;
};

function createEmptyPublicPreCarreraSnapshot(): PublicPreCarreraSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    rows: [],
  };
}

export async function getPublicPreCarreraSnapshot(): Promise<PublicPreCarreraSnapshot> {
  try {
    const pilots = await prisma.piloto.findMany({
      orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
      include: {
        preCarrera: {
          select: {
            peso: true,
            kart: true,
            lastre: true,
          },
        },
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      rows: pilots.map((pilot: {
        id: number;
        nombre: string;
        apellidos: string;
        preCarrera: {
          peso: number | null;
          kart: number | null;
          lastre: number | null;
        } | null;
      }) => {
        const lastre = pilot.preCarrera?.lastre ?? null;

        return {
          pilotoId: pilot.id,
          piloto: `${pilot.nombre} ${pilot.apellidos}`,
          kart: pilot.preCarrera?.kart ?? null,
          lastre,
          lastreLabel:
            lastre == null
              ? "Sin dato"
              : lastre <= 0
                ? "Sin lastre"
                : formatBallastBreakdown(lastre),
          hasKart: pilot.preCarrera?.kart != null,
          hasWeight: pilot.preCarrera?.peso != null,
        };
      }),
    };
  } catch (error) {
    console.error("getPublicPreCarreraSnapshot failed", error);
    return createEmptyPublicPreCarreraSnapshot();
  }
}

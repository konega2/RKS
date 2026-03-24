import "server-only";

import { EVENT_PHASES, isEventPhase, type EventPhase } from "@/lib/evento";
import { prisma } from "@/lib/prisma";

export type EventoSnapshot = {
  generatedAt: string;
  faseActual: EventPhase;
  horarios: Record<EventPhase, string>;
  anuncios: Array<{
    id: number;
    mensaje: string;
    createdAt: string;
  }>;
};

async function ensureEvento() {
  const first = await prisma.evento.findFirst({
    orderBy: [{ id: "asc" }],
  });

  if (first) {
    if (isEventPhase(first.faseActual)) {
      return first;
    }

    return prisma.evento.update({
      where: { id: first.id },
      data: { faseActual: "registro" },
    });
  }

  return prisma.evento.create({
    data: {
      faseActual: "registro",
    },
  });
}

async function ensureFases() {
  const existing = await prisma.fase.findMany({
    where: {
      nombre: {
        in: [...EVENT_PHASES],
      },
    },
    orderBy: [{ id: "asc" }],
    select: {
      id: true,
      nombre: true,
      hora: true,
    },
  });

  const existingByName = new Map<
    string,
    { id: number; nombre: string; hora: string }
  >(existing.map((fase: { id: number; nombre: string; hora: string }) => [fase.nombre, fase]));

  for (const nombre of EVENT_PHASES) {
    if (!existingByName.has(nombre)) {
      const created = await prisma.fase.create({
        data: {
          nombre,
          hora: "",
        },
      });
      existingByName.set(nombre, created);
    }
  }

  return existingByName;
}

export async function getEventoSnapshot(): Promise<EventoSnapshot> {
  const [evento, fasesByName, anuncios] = await Promise.all([
    ensureEvento(),
    ensureFases(),
    prisma.anuncio.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        id: true,
        mensaje: true,
        createdAt: true,
      },
    }),
  ]);

  const horarios = {
    registro: fasesByName.get("registro")?.hora ?? "",
    entrenamiento: fasesByName.get("entrenamiento")?.hora ?? "",
    qualy: fasesByName.get("qualy")?.hora ?? "",
    carrera: fasesByName.get("carrera")?.hora ?? "",
  } satisfies Record<EventPhase, string>;

  return {
    generatedAt: new Date().toISOString(),
    faseActual: isEventPhase(evento.faseActual) ? evento.faseActual : "registro",
    horarios,
    anuncios: anuncios.map((anuncio: { id: number; mensaje: string; createdAt: Date }) => ({
      id: anuncio.id,
      mensaje: anuncio.mensaje,
      createdAt: anuncio.createdAt.toISOString(),
    })),
  };
}

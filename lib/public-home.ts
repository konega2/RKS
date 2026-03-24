import "server-only";

import { EVENT_PHASE_LABEL, EVENT_PHASES, isEventPhase, type EventPhase } from "@/lib/evento";
import { prisma } from "@/lib/prisma";

export type PublicHomeSnapshot = {
  generatedAt: string;
  eventTitle: string;
  circuito: string;
  faseActual: EventPhase;
  faseActualLabel: string;
  estadoActual: string;
  estadoResumen: string;
  siguienteFase: {
    nombre: EventPhase;
    label: string;
    hora: string;
  };
  horarios: Record<EventPhase, string>;
  anuncios: Array<{
    id: number;
    mensaje: string;
    createdAt: string;
  }>;
  anuncioDestacado: {
    id: number;
    mensaje: string;
    createdAt: string;
  } | null;
  ultimoResultado: {
    sesion: string;
    top3: Array<{
      posicion: number;
      piloto: string;
    }>;
  };
  totalPilotos: number;
};

function getNextPhase(current: EventPhase): EventPhase {
  const currentIndex = EVENT_PHASES.indexOf(current);
  if (currentIndex === -1) {
    return "registro";
  }

  const nextIndex = (currentIndex + 1) % EVENT_PHASES.length;
  return EVENT_PHASES[nextIndex] ?? "registro";
}

async function ensureEvento() {
  const existing = await prisma.evento.findFirst({
    orderBy: [{ id: "asc" }],
    select: { id: true, faseActual: true },
  });

  if (existing) {
    if (isEventPhase(existing.faseActual)) {
      return existing;
    }

    return prisma.evento.update({
      where: { id: existing.id },
      data: { faseActual: "registro" },
      select: { id: true, faseActual: true },
    });
  }

  return prisma.evento.create({
    data: {
      faseActual: "registro",
    },
    select: { id: true, faseActual: true },
  });
}

async function ensureFases() {
  const existing = await prisma.fase.findMany({
    where: {
      nombre: {
        in: [...EVENT_PHASES],
      },
    },
    select: {
      id: true,
      nombre: true,
      hora: true,
    },
    orderBy: [{ id: "asc" }],
  });

  const byName = new Map<string, { id: number; nombre: string; hora: string }>(
    existing.map((fase: { id: number; nombre: string; hora: string }) => [fase.nombre, fase]),
  );

  for (const nombre of EVENT_PHASES) {
    if (!byName.has(nombre)) {
      const created = await prisma.fase.create({
        data: {
          nombre,
          hora: "",
        },
        select: {
          id: true,
          nombre: true,
          hora: true,
        },
      });
      byName.set(nombre, created);
    }
  }

  return byName;
}

export async function getPublicHomeSnapshot(): Promise<PublicHomeSnapshot> {
  const [evento, fasesByName, anuncios, totalPilotos, resultados] = await Promise.all([
    ensureEvento(),
    ensureFases(),
    prisma.anuncio.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20,
      select: {
        id: true,
        mensaje: true,
        createdAt: true,
      },
    }),
    prisma.piloto.count(),
    prisma.resultadoCarrera.findMany({
      orderBy: [{ posicion: "asc" }],
      take: 3,
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

  const faseActualRaw = String(evento.faseActual ?? "");
  const faseActual: EventPhase = isEventPhase(faseActualRaw)
    ? faseActualRaw
    : "registro";
  const siguienteFaseNombre = getNextPhase(faseActual);

  const horarios = {
    registro: fasesByName.get("registro")?.hora ?? "",
    entrenamiento: fasesByName.get("entrenamiento")?.hora ?? "",
    qualy: fasesByName.get("qualy")?.hora ?? "",
    carrera: fasesByName.get("carrera")?.hora ?? "",
  } satisfies Record<EventPhase, string>;

  const anuncioDestacado = anuncios[0]
    ? {
        id: anuncios[0].id,
        mensaje: anuncios[0].mensaje,
        createdAt: anuncios[0].createdAt.toISOString(),
      }
    : null;

  return {
    generatedAt: new Date().toISOString(),
    eventTitle: "RKS Karting Event",
    circuito: "Chiva",
    faseActual,
    faseActualLabel: EVENT_PHASE_LABEL[faseActual],
    estadoActual: EVENT_PHASE_LABEL[faseActual],
    estadoResumen: `${EVENT_PHASE_LABEL[siguienteFaseNombre]} · ${horarios[siguienteFaseNombre] || "Por definir"}`,
    siguienteFase: {
      nombre: siguienteFaseNombre,
      label: EVENT_PHASE_LABEL[siguienteFaseNombre],
      hora: horarios[siguienteFaseNombre] || "Por definir",
    },
    horarios,
    anuncios: anuncios.map((anuncio: { id: number; mensaje: string; createdAt: Date }) => ({
      id: anuncio.id,
      mensaje: anuncio.mensaje,
      createdAt: anuncio.createdAt.toISOString(),
    })),
    anuncioDestacado,
    ultimoResultado: {
      sesion: "Última sesión",
      top3: resultados.map((item: {
        posicion: number;
        piloto: { nombre: string; apellidos: string };
      }) => ({
        posicion: item.posicion,
        piloto: `${item.piloto.nombre} ${item.piloto.apellidos}`,
      })),
    },
    totalPilotos,
  };
}

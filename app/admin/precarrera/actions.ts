"use server";

import { revalidatePath } from "next/cache";

import { calculateBallastKg } from "@/lib/precarrera";
import { prisma } from "@/lib/prisma";

export type PreCarreraSaveState = {
  status: "idle" | "success" | "error";
  message?: string;
  rows?: Array<{
    pilotoId: number;
    peso: number | null;
    kart: number | null;
    verificado: boolean;
  }>;
};

type IncomingRow = {
  pilotoId: number;
  peso: number | null;
  kart: number | null;
  verificado: boolean;
};

const initialState: PreCarreraSaveState = {
  status: "idle",
};

function parseRows(raw: string | null): IncomingRow[] | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const rows: IncomingRow[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as {
        pilotoId?: unknown;
        peso?: unknown;
        kart?: unknown;
        verificado?: unknown;
      };

      const pilotoId = Number(candidate.pilotoId);
      const peso =
        candidate.peso == null || candidate.peso === ""
          ? null
          : Number(candidate.peso);
      const kart =
        candidate.kart == null || candidate.kart === ""
          ? null
          : Number(candidate.kart);
      const verificado = Boolean(candidate.verificado);

      if (!Number.isInteger(pilotoId) || pilotoId <= 0) {
        return null;
      }

      if (peso != null && (!Number.isFinite(peso) || peso <= 0)) {
        return null;
      }

      if (kart != null && (!Number.isInteger(kart) || kart <= 0)) {
        return null;
      }

      rows.push({
        pilotoId,
        peso,
        kart,
        verificado,
      });
    }

    return rows;
  } catch {
    return null;
  }
}

function parseAvailableKarts(raw: string | null) {
  if (!raw) {
    return [] as number[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);
  } catch {
    return [] as number[];
  }
}

export async function savePreCarreraAction(
  prevState: PreCarreraSaveState = initialState,
  formData: FormData,
): Promise<PreCarreraSaveState> {
  void prevState;

  const rows = parseRows(formData.get("rows")?.toString() ?? null);

  if (!rows || rows.length === 0) {
    return {
      status: "error",
      message: "No hay datos válidos para guardar.",
    };
  }

  const availableKarts = parseAvailableKarts(
    formData.get("availableKarts")?.toString() ?? null,
  );
  const availableSet = new Set(availableKarts);

  const duplicatedKart = new Set<number>();
  const taken = new Set<number>();

  for (const row of rows) {
    if (row.kart == null) {
      continue;
    }

    if (availableSet.size > 0 && !availableSet.has(row.kart)) {
      return {
        status: "error",
        message: `El kart ${row.kart} no está disponible en la configuración actual.`,
      };
    }

    if (taken.has(row.kart)) {
      duplicatedKart.add(row.kart);
      continue;
    }

    taken.add(row.kart);
  }

  if (duplicatedKart.size > 0) {
    return {
      status: "error",
      message: `Hay karts duplicados: ${Array.from(duplicatedKart).join(", ")}.`,
    };
  }

  const pilots = await prisma.piloto.findMany({
    select: { id: true },
  });

  const pilotIds = new Set(
    pilots.map((pilot: { id: number }) => pilot.id),
  );
  const invalidPilot = rows.find((row) => !pilotIds.has(row.pilotoId));

  if (invalidPilot) {
    return {
      status: "error",
      message: "Se detectaron pilotos inválidos para guardar.",
    };
  }

  await prisma.$transaction(
    rows.map((row) => {
      const lastre = calculateBallastKg(row.peso);

      return prisma.preCarrera.upsert({
        where: { pilotoId: row.pilotoId },
        update: {
          peso: row.peso,
          lastre,
          kart: row.kart,
          verificado: row.verificado,
        },
        create: {
          pilotoId: row.pilotoId,
          peso: row.peso,
          lastre,
          kart: row.kart,
          verificado: row.verificado,
        },
      });
    }),
  );

  revalidatePath("/admin/precarrera");
  revalidatePath("/admin/pre-carrera");

  return {
    status: "success",
    message: "Pre-carrera guardada correctamente.",
    rows,
  };
}

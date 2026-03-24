import { revalidatePath } from "next/cache";

import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PilotPayload = {
  nombre?: string;
  apellidos?: string;
  edad?: number;
  dni?: string;
  dorsal?: number | null;
  socio?: boolean;
  entrenamiento?: boolean;
  foto?: string | null;
};

function validatePayload(payload: PilotPayload) {
  if (!payload.nombre?.trim()) {
    return "El nombre es obligatorio.";
  }

  if (!payload.apellidos?.trim()) {
    return "Los apellidos son obligatorios.";
  }

  if (!Number.isInteger(payload.edad) || (payload.edad ?? 0) <= 0) {
    return "La edad debe ser un número entero mayor que 0.";
  }

  if (!payload.dni?.trim()) {
    return "El DNI es obligatorio.";
  }

  if (
    payload.dorsal !== undefined &&
    payload.dorsal !== null &&
    (!Number.isInteger(payload.dorsal) || payload.dorsal <= 0)
  ) {
    return "El dorsal debe ser un número entero mayor que 0.";
  }

  return null;
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = (await req.json()) as PilotPayload;
    const error = validatePayload(payload);

    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    const piloto = await prisma.piloto.create({
      data: {
        nombre: payload.nombre!.trim(),
        apellidos: payload.apellidos!.trim(),
        edad: payload.edad!,
        dni: payload.dni!.trim(),
        dorsal: payload.dorsal ?? null,
        socio: Boolean(payload.socio),
        entrenamiento: Boolean(payload.entrenamiento),
        foto: payload.foto ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/admin/pilotos");
    return Response.json({ id: piloto.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "No se pudo crear el piloto. Intenta nuevamente." },
      { status: 500 },
    );
  }
}

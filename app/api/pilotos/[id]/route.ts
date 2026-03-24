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

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, { params }: RouteParams) {
  if (!(await isAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const pilotoId = Number(id);

  if (!Number.isInteger(pilotoId) || pilotoId <= 0) {
    return Response.json({ error: "Piloto inválido." }, { status: 400 });
  }

  try {
    const payload = (await req.json()) as PilotPayload;
    const error = validatePayload(payload);

    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    await prisma.piloto.update({
      where: { id: pilotoId },
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
    });

    revalidatePath("/admin/pilotos");
    revalidatePath(`/admin/pilotos/${pilotoId}`);

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "No se pudo actualizar el piloto. Intenta nuevamente." },
      { status: 500 },
    );
  }
}

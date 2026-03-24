import { type PilotListItem, PilotsList } from "@/components/pilots-list";
import { prisma } from "@/lib/prisma";

export default async function PilotosPage() {
  let pilotos: PilotListItem[] = [];

  try {
    pilotos = await prisma.piloto.findMany({
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        dorsal: true,
        socio: true,
        entrenamiento: true,
        foto: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("PilotosPage query failed", error);
    pilotos = [];
  }

  return <PilotsList pilotos={pilotos} />;
}

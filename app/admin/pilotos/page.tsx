import { type PilotListItem, PilotsList } from "@/components/pilots-list";
import { prisma } from "@/lib/prisma";

export default async function PilotosPage() {
  const pilotos: PilotListItem[] = await prisma.piloto.findMany({
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

  return <PilotsList pilotos={pilotos} />;
}

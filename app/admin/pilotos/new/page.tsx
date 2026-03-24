import Link from "next/link";

import { createPilotAction } from "@/app/admin/pilotos/actions";
import { Card } from "@/components/card";
import { PilotForm } from "@/components/pilot-form";

export default function NewPilotPage() {
  return (
    <section className="space-y-4">
      <Link
        href="/admin/pilotos"
        className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-zinc-400 hover:bg-zinc-900"
      >
        ← Volver a pilotos
      </Link>

      <Card className="p-4">
        <PilotForm
          formTitle="Nuevo piloto"
          submitLabel="Guardar piloto"
          action={createPilotAction}
        />
      </Card>
    </section>
  );
}

import { Card } from "@/components/card";

export default function AdminHomePage() {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-zinc-100">Bienvenido al panel</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Usa la navegación inferior para entrar a cada módulo: Pilotos,
        Pre-carrera, Entrenamiento, Qualy y Carrera.
      </p>
    </Card>
  );
}

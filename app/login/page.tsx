import { redirect } from "next/navigation";

import { Card } from "@/components/card";
import { LoginForm } from "@/components/login-form";
import { isAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-2xl font-bold text-zinc-100">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-zinc-400">Panel de administración RKS</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </main>
  );
}

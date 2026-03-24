import { logoutAction } from "@/app/admin/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="h-11 rounded-xl border border-rks-line bg-zinc-900/90 px-4 text-sm font-semibold text-zinc-100 transition hover:border-rks-amber/50 hover:bg-zinc-800 active:scale-[0.99]"
      >
        Cerrar sesión
      </button>
    </form>
  );
}

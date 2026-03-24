import { type ReactNode } from "react";

import { MobileNav } from "@/components/mobile-nav";
import { PageContainer } from "@/components/page-container";
import { requireAdminSession } from "@/lib/auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-black">
      <PageContainer className="max-w-7xl">
        <header className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-rks-line/70 bg-gradient-to-r from-rks-surface/90 via-zinc-950 to-zinc-950 p-3 md:p-4">
          <h1 className="text-lg font-bold tracking-wide text-zinc-100">
            Panel de Gestión <span className="text-rks-amber">RKS</span>
          </h1>
        </header>
        {children}
      </PageContainer>
      <MobileNav />
    </div>
  );
}

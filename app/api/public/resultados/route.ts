import { NextResponse } from "next/server";

import { getPublicResultadosSnapshot } from "@/lib/public-resultados";

export async function GET() {
  const snapshot = await getPublicResultadosSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

import { NextResponse } from "next/server";

import { getPublicEntrenamientoSnapshot } from "@/lib/public-entrenamiento";

export async function GET() {
  const snapshot = await getPublicEntrenamientoSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

import { NextResponse } from "next/server";

import { getPublicResultadosSnapshot } from "@/lib/public-resultados";

export async function GET() {
  try {
    const snapshot = await getPublicResultadosSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("/api/public/resultados failed", error);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        podium: [],
        rows: [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

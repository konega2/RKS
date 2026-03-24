import { NextResponse } from "next/server";

import { getPublicEntrenamientoSnapshot } from "@/lib/public-entrenamiento";

export async function GET() {
  try {
    const snapshot = await getPublicEntrenamientoSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("/api/public/entrenamiento failed", error);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        qualyRows: [],
        qualyLapSummary: [],
        raceRows: [],
        raceLapSummary: [],
        fastestRaceLap: null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

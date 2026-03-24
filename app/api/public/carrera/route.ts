import { NextResponse } from "next/server";

import { getCarreraSnapshot } from "@/app/admin/carrera/data";

export async function GET() {
  try {
    const snapshot = await getCarreraSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("/api/public/carrera failed", error);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        replayLap: null,
        maxLap: 0,
        targetLaps: 20,
        pilots: [],
        startingGrid: [],
        raceRows: [],
        raceLaps: [],
        fastestLap: null,
        savedResults: [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

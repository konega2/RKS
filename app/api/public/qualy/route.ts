import { NextResponse } from "next/server";

import { getQualySnapshot } from "@/app/admin/qualy/data";

export async function GET() {
  try {
    const snapshot = await getQualySnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("/api/public/qualy failed", error);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        pilots: [],
        rows: [],
        fastestLap: null,
        pilotLaps: [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

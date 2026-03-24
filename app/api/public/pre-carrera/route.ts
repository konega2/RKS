import { NextResponse } from "next/server";

import { getPublicPreCarreraSnapshot } from "@/lib/public-precarrera";

export async function GET() {
  try {
    const snapshot = await getPublicPreCarreraSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("/api/public/pre-carrera failed", error);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
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

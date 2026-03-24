import { NextResponse } from "next/server";

import { getCarreraSnapshot } from "@/app/admin/carrera/data";

export async function GET() {
  const snapshot = await getCarreraSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

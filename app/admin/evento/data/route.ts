import { NextResponse } from "next/server";

import { getEventoSnapshot } from "@/app/admin/evento/data";

export async function GET() {
  const snapshot = await getEventoSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

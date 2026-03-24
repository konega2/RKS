import { NextResponse } from "next/server";

import { getPublicPreCarreraSnapshot } from "@/lib/public-precarrera";

export async function GET() {
  const snapshot = await getPublicPreCarreraSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

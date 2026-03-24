import { NextResponse } from "next/server";

import { getPublicHomeSnapshot } from "@/lib/public-home";

export async function GET() {
  const snapshot = await getPublicHomeSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

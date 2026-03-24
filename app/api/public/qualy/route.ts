import { NextResponse } from "next/server";

import { getQualySnapshot } from "@/app/admin/qualy/data";

export async function GET() {
  const snapshot = await getQualySnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

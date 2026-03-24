import { NextResponse } from "next/server";

import { getCarreraSnapshot } from "@/app/admin/carrera/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const replayLapParam = searchParams.get("replayLap");
  const parsedReplayLap = replayLapParam == null ? null : Number(replayLapParam);

  const replayLap =
    parsedReplayLap != null && Number.isInteger(parsedReplayLap) && parsedReplayLap > 0
      ? parsedReplayLap
      : null;

  const snapshot = await getCarreraSnapshot(replayLap);

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

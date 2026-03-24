import { RaceLiveScreen } from "@/components/public/race-live-screen";
import { getCarreraSnapshot } from "@/app/admin/carrera/data";

export const dynamic = "force-dynamic";

export default async function PublicCarreraDirectoPage() {
  const snapshot = await getCarreraSnapshot();

  return <RaceLiveScreen initialSnapshot={snapshot} />;
}

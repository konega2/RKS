import { RaceLiveScreen } from "@/components/public/race-live-screen";
import { getCarreraSnapshot } from "@/app/admin/carrera/data";

export default async function PublicCarreraDirectoPage() {
  const snapshot = await getCarreraSnapshot();

  return <RaceLiveScreen initialSnapshot={snapshot} />;
}

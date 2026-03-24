import { RaceGridScreen } from "@/components/public/race-grid-screen";
import { getCarreraSnapshot } from "@/app/admin/carrera/data";

export const dynamic = "force-dynamic";

export default async function PublicCarreraParrillaPage() {
  const snapshot = await getCarreraSnapshot();

  return <RaceGridScreen initialSnapshot={snapshot} />;
}

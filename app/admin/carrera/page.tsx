import { CarreraBoard } from "@/components/carrera-board";
import { getCarreraSnapshot } from "./data";

export const dynamic = "force-dynamic";

export default async function CarreraPage() {
  const snapshot = await getCarreraSnapshot();

  return <CarreraBoard initialSnapshot={snapshot} />;
}

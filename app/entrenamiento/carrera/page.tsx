import { TrainingRaceScreen } from "@/components/public/training-race-screen";
import { getPublicEntrenamientoSnapshot } from "@/lib/public-entrenamiento";

export const dynamic = "force-dynamic";

export default async function PublicTrainingRacePage() {
  const snapshot = await getPublicEntrenamientoSnapshot();

  return <TrainingRaceScreen initialSnapshot={snapshot} />;
}

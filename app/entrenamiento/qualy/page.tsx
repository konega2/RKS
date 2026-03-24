import { TrainingQualyScreen } from "@/components/public/training-qualy-screen";
import { getPublicEntrenamientoSnapshot } from "@/lib/public-entrenamiento";

export default async function PublicTrainingQualyPage() {
  const snapshot = await getPublicEntrenamientoSnapshot();

  return <TrainingQualyScreen initialSnapshot={snapshot} />;
}

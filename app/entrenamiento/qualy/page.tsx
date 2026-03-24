import { TrainingQualyScreen } from "@/components/public/training-qualy-screen";
import { getPublicEntrenamientoSnapshot } from "@/lib/public-entrenamiento";

export const dynamic = "force-dynamic";

export default async function PublicTrainingQualyPage() {
  const snapshot = await getPublicEntrenamientoSnapshot();

  return <TrainingQualyScreen initialSnapshot={snapshot} />;
}

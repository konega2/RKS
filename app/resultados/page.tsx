import { PublicResultsScreen } from "@/components/public/public-results-screen";
import { getPublicResultadosSnapshot } from "@/lib/public-resultados";

export default async function PublicResultadosPage() {
  const snapshot = await getPublicResultadosSnapshot();

  return <PublicResultsScreen initialSnapshot={snapshot} />;
}

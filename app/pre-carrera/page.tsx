import { PreCarreraScreen } from "@/components/public/pre-carrera-screen";
import { getPublicPreCarreraSnapshot } from "@/lib/public-precarrera";

export default async function PublicPreCarreraPage() {
  const snapshot = await getPublicPreCarreraSnapshot();

  return <PreCarreraScreen initialSnapshot={snapshot} />;
}

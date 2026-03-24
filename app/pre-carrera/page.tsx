import { PreCarreraScreen } from "@/components/public/pre-carrera-screen";
import { getPublicPreCarreraSnapshot } from "@/lib/public-precarrera";

export const dynamic = "force-dynamic";

export default async function PublicPreCarreraPage() {
  const snapshot = await getPublicPreCarreraSnapshot();

  return <PreCarreraScreen initialSnapshot={snapshot} />;
}

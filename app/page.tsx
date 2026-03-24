import { PublicHomeScreen } from "@/components/public/public-home-screen";
import { getPublicHomeSnapshot } from "@/lib/public-home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getPublicHomeSnapshot();

  return <PublicHomeScreen initialSnapshot={snapshot} />;
}

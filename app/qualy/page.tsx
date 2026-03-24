import { PublicQualyScreen } from "@/components/public/public-qualy-screen";
import { getQualySnapshot } from "@/app/admin/qualy/data";

export const dynamic = "force-dynamic";

export default async function PublicQualyPage() {
  const snapshot = await getQualySnapshot();

  return <PublicQualyScreen initialSnapshot={snapshot} />;
}

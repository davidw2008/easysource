import { PricingClient } from "@/components/PricingClient";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  return (
    <main className="shell">
      <SiteHeader user={user} />
      <PricingClient plan={user?.plan ?? null} canceled={params.canceled === "1"} />
    </main>
  );
}

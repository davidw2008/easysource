import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { countLinksThisMonth } from "@/lib/links";
import { getPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [links, usedThisMonth] = await Promise.all([
    prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    countLinksThisMonth(user.id),
  ]);

  const plan = getPlan(user.plan);
  const appOrigin = process.env.APP_URL || "http://localhost:3000";

  return (
    <main className="shell">
      <SiteHeader user={user} />
      <DashboardClient
        initialLinks={links.map((l) => ({
          ...l,
          expiresAt: l.expiresAt?.toISOString() ?? null,
          createdAt: l.createdAt.toISOString(),
        }))}
        usage={{
          usedThisMonth,
          limit: plan.monthlyLinkLimit === Infinity ? null : plan.monthlyLinkLimit,
          plan: user.plan,
        }}
        appOrigin={appOrigin}
      />
    </main>
  );
}

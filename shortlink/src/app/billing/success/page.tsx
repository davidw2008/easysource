import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  return (
    <main className="shell">
      <SiteHeader user={user} />
      <section className="success-card">
        <p className="eyebrow">付款完成</p>
        <h1>已升級專業版</h1>
        <p className="muted">
          {params.demo === "1"
            ? "目前是 Demo 付款模式：帳號已即時升級。接上 Stripe 後會改走正式收款與 Webhook。"
            : "感謝訂閱。專業版功能已解鎖，可立即建立自訂短碼。"}
        </p>
        <Link href="/dashboard" className="btn-primary">
          返回控制台
        </Link>
      </section>
    </main>
  );
}

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ missing?: string; expired?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  return (
    <main className="shell">
      <SiteHeader user={user} />
      <section className="hero">
        <p className="eyebrow">EaseLink</p>
        <h1>短連結，做得乾淨利落</h1>
        <p className="lead">
          基本版即開即用；專業版付款後解鎖自訂短碼、無限連結與長期統計。適合推廣、客服與內部分享。
        </p>
        <div className="hero-actions">
          <Link href={user ? "/dashboard" : "/register"} className="btn-primary">
            {user ? "打開控制台" : "免費開始"}
          </Link>
          <Link href="/pricing" className="btn-secondary">
            睇方案同付款流程
          </Link>
        </div>
        {params.missing && <p className="form-error">找不到此短連結。</p>}
        {params.expired && <p className="form-error">此短連結已過期。</p>}
      </section>
    </main>
  );
}

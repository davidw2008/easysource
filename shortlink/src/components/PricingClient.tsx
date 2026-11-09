"use client";

import Link from "next/link";
import { useState } from "react";
import { PLANS } from "@/lib/plans";

export function PricingClient({
  plan,
  canceled,
}: {
  plan: string | null;
  canceled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upgrade() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "無法開始付款");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="pricing">
      <header className="pricing-hero">
        <p className="eyebrow">方案</p>
        <h1>基本版免費用，專業版解鎖完整流程</h1>
        <p className="muted">
          先驗證產品價值，再升級。本地可用 Demo 付款流程；接 Stripe 後即變正式收款。
        </p>
        {canceled && <p className="form-error">已取消付款，你仍可繼續使用基本版。</p>}
      </header>

      <div className="plan-grid">
        <article className="plan-block">
          <h2>{PLANS.free.name}</h2>
          <p className="price">HK$0</p>
          <ul>
            {PLANS.free.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {plan ? (
            <Link href="/dashboard" className="btn-secondary">
              前往控制台
            </Link>
          ) : (
            <Link href="/register" className="btn-secondary">
              免費註冊
            </Link>
          )}
        </article>

        <article className="plan-block featured">
          <p className="plan-badge">推薦</p>
          <h2>{PLANS.pro.name}</h2>
          <p className="price">
            HK${PLANS.pro.priceMonthlyHkd}
            <span>/月</span>
          </p>
          <ul>
            {PLANS.pro.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {plan === "pro" ? (
            <p className="form-ok">你已是專業版</p>
          ) : plan ? (
            <button type="button" className="btn-primary" onClick={upgrade} disabled={loading}>
              {loading ? "處理中…" : "升級並付款"}
            </button>
          ) : (
            <Link href="/register?next=/pricing" className="btn-primary">
              註冊後升級
            </Link>
          )}
        </article>
      </div>

      {error && <p className="form-error center">{error}</p>}

      <section className="flow">
        <h2>付款版流程</h2>
        <ol>
          <li>註冊／登入 → 預設基本版</li>
          <li>按「升級並付款」→ 建立 Checkout Session</li>
          <li>
            有 Stripe 金鑰：跳去 Stripe 收款頁；無金鑰且 <code>DEMO_PAYMENTS=true</code>
            ：即時升 Pro（本地 Demo）
          </li>
          <li>成功頁確認 → Webhook（正式環境）把 plan 寫成 pro</li>
          <li>控制台解鎖自訂短碼、無限連結、永不過期</li>
        </ol>
      </section>
    </div>
  );
}

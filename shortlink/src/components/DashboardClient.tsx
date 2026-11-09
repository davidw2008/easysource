"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type LinkItem = {
  id: string;
  code: string;
  url: string;
  title: string | null;
  clicks: number;
  isCustom: boolean;
  expiresAt: string | null;
  createdAt: string;
};

type Usage = {
  usedThisMonth: number;
  limit: number | null;
  plan: string;
};

export function DashboardClient({
  initialLinks,
  usage,
  appOrigin,
}: {
  initialLinks: LinkItem[];
  usage: Usage;
  appOrigin: string;
}) {
  const [links, setLinks] = useState(initialLinks);
  const [used, setUsed] = useState(usage.usedThisMonth);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const isPro = usage.plan === "pro";

  const usageLabel = useMemo(() => {
    if (usage.limit == null) return `本月已建立 ${used} 條（無限）`;
    return `本月已建立 ${used} / ${usage.limit} 條`;
  }, [used, usage.limit]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      url: String(form.get("url") || ""),
      title: String(form.get("title") || "") || undefined,
      customCode: String(form.get("customCode") || "") || undefined,
    };

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "建立失敗");
      return;
    }

    setLinks((prev) => [data.link, ...prev]);
    setUsed((n) => n + 1);
    setOkMsg(`已建立：${appOrigin}/l/${data.link.code}`);
    e.currentTarget.reset();
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function copy(code: string) {
    await navigator.clipboard.writeText(`${appOrigin}/l/${code}`);
    setOkMsg("已複製短連結");
  }

  return (
    <div className="dashboard">
      <section className="dash-hero">
        <div>
          <p className="eyebrow">{isPro ? "專業版" : "基本版"}</p>
          <h1>控制台</h1>
          <p className="muted">{usageLabel}</p>
        </div>
        {!isPro && (
          <Link href="/pricing" className="btn-secondary">
            升級專業版
          </Link>
        )}
      </section>

      <section className="create-panel">
        <h2>建立短連結</h2>
        <form onSubmit={onCreate} className="create-form">
          <label>
            目標網址
            <input
              name="url"
              type="url"
              required
              placeholder="https://example.com/very/long/path"
            />
          </label>
          <label>
            標題（可選）
            <input name="title" type="text" placeholder="活動頁 / 產品頁" />
          </label>
          <label className={!isPro ? "locked" : undefined}>
            自訂短碼 {!isPro && <span className="tag">Pro</span>}
            <input
              name="customCode"
              type="text"
              placeholder={isPro ? "promo2026" : "升級後可用"}
              disabled={!isPro}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "建立中…" : "縮短連結"}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        {okMsg && <p className="form-ok">{okMsg}</p>}
      </section>

      <section className="links-panel">
        <h2>你的連結</h2>
        {links.length === 0 ? (
          <p className="muted">尚未有短連結。貼上網址即可開始。</p>
        ) : (
          <ul className="link-list">
            {links.map((link) => (
              <li key={link.id}>
                <div>
                  <a
                    className="short-code"
                    href={`/l/${link.code}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    /l/{link.code}
                  </a>
                  <p className="target" title={link.url}>
                    {link.title || link.url}
                  </p>
                  <p className="meta">
                    {link.clicks} 次點擊
                    {link.isCustom ? " · 自訂" : ""}
                    {link.expiresAt
                      ? ` · ${new Date(link.expiresAt).toLocaleDateString("zh-HK")} 過期`
                      : " · 永不過期"}
                  </p>
                </div>
                <div className="link-actions">
                  <button type="button" onClick={() => copy(link.code)}>
                    複製
                  </button>
                  <button type="button" className="danger" onClick={() => onDelete(link.id)}>
                    刪除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

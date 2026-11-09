"use client";

import Link from "next/link";

type Props = {
  user?: { email: string; plan: string } | null;
};

export function SiteHeader({ user }: Props) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden />
        <span className="brand-name">EaseLink</span>
      </Link>
      <nav className="site-nav">
        <Link href="/pricing">方案</Link>
        {user ? (
          <>
            <Link href="/dashboard">控制台</Link>
            <span className="nav-email" title={user.email}>
              {user.plan === "pro" ? "Pro" : "Free"} · {user.email}
            </span>
            <button type="button" className="nav-ghost" onClick={logout}>
              登出
            </button>
          </>
        ) : (
          <>
            <Link href="/login">登入</Link>
            <Link href="/register" className="nav-cta">
              免費開始
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

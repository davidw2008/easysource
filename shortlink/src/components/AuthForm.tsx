"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      name: String(form.get("name") || "") || undefined,
    };

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "操作失敗");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h1>{mode === "login" ? "登入 EaseLink" : "建立帳號"}</h1>
      <p className="muted">
        {mode === "login"
          ? "回到控制台，繼續管理你的短連結。"
          : "免費開始，之後可一鍵升級專業版。"}
      </p>

      {mode === "register" && (
        <label>
          名稱
          <input name="name" type="text" placeholder="你的名字" autoComplete="name" />
        </label>
      )}

      <label>
        電郵
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <label>
        密碼
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="至少 8 位"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "處理中…" : mode === "login" ? "登入" : "註冊並開始"}
      </button>

      <p className="auth-switch">
        {mode === "login" ? (
          <>
            未有帳號？ <Link href="/register">免費註冊</Link>
          </>
        ) : (
          <>
            已有帳號？ <Link href="/login">登入</Link>
          </>
        )}
      </p>
    </form>
  );
}

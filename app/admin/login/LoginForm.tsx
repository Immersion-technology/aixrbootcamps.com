"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Sign-in failed");
      }
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <span className="text-[10.5px] font-bold tracking-[.18em] text-white/70 uppercase block mb-1.5">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-[14px] focus:outline-none focus:border-white/40 transition"
          placeholder="admin@immersia.ng"
        />
      </div>
      <div>
        <span className="text-[10.5px] font-bold tracking-[.18em] text-white/70 uppercase block mb-1.5">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-[14px] focus:outline-none focus:border-white/40 transition"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-[12.5px] text-pink-soft">⚠ {error}</p>
      )}
      <button
        disabled={submitting}
        className="w-full bg-white text-ink rounded-full py-3 font-accent font-extrabold text-[13.5px] tracking-[.06em] hover:bg-violet-brand hover:text-white transition disabled:opacity-60 mt-2"
      >
        {submitting ? "SIGNING IN…" : "SIGN IN →"}
      </button>
    </form>
  );
}

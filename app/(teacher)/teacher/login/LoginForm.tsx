"use client";

import { useState } from "react";

export default function TeacherLoginForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Could not send the link");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="frosted-glass rounded-2xl px-5 py-6 text-center">
        <div className="text-[28px] mb-2">📬</div>
        <div className="text-[10.5px] font-bold tracking-[.18em] text-aqua-deep mb-1.5">CHECK YOUR INBOX</div>
        <p className="text-[13.5px] text-neutral-700 leading-relaxed">
          If <strong>{email}</strong> is on the team, we&apos;ve sent a one-time login link. It expires in 30 minutes.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="text-[12.5px] font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep mt-4"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
        />
      </div>

      {error && <p className="field-error">⚠ {error}</p>}

      <button type="submit" className="btn-grass w-full justify-center !py-3.5" disabled={submitting}>
        {submitting ? "Sending link…" : <>Email me a login link <span aria-hidden>→</span></>}
      </button>
    </form>
  );
}

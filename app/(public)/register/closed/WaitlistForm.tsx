"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const r = await fetch("/api/public/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error ?? "Could not add to waitlist");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="ticket-card frosted-glass-dark rounded-3xl p-8 text-center anim-glow">
        <div className="font-accent text-[64px] leading-none mb-3">✓</div>
        <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 mb-2">YOU&apos;RE ON THE LIST</div>
        <h3 className="font-display font-extrabold uppercase text-[24px] mb-2">First in queue.</h3>
        <p className="text-[13px] text-white/80 max-w-[360px] mx-auto leading-relaxed">
          We&apos;ll email the moment a slot opens. Keep an eye on your inbox — slots fill within hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="frosted-glass rounded-3xl p-6 sm:p-8 text-left space-y-4">
      <div>
        <span className="label">Parent / Guardian name</span>
        <input name="parentName" required className="input" />
      </div>
      <div>
        <span className="label">Participant name</span>
        <input name="participantName" required className="input" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <span className="label">Email</span>
          <input type="email" name="email" required className="input" />
        </div>
        <div>
          <span className="label">Phone</span>
          <input name="phone" required className="input" placeholder="0801..." />
        </div>
      </div>
      {error && <p className="field-error">⚠ {error}</p>}
      <button
        disabled={submitting}
        className="btn-dark w-full justify-center disabled:opacity-60 !text-sm"
      >
        {submitting ? "Adding you…" : "Join the waitlist"} <span>→</span>
      </button>
      <p className="text-[11.5px] text-neutral-500 text-center">No payment, no commitment. We email when a slot opens.</p>
    </form>
  );
}

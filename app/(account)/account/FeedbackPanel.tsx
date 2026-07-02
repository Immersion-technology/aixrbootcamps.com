"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Status = { kind: "success" | "error"; text: string } | null;

export default function FeedbackPanel() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus({ kind: "error", text: "Please type a message before sending." });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/account/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "We could not send your feedback right now.");
      }
      setMessage("");
      setStatus({ kind: "success", text: "Thanks. Your feedback has been sent." });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "We could not send your feedback right now.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
      <div className="frosted-glass rounded-3xl p-6 sm:p-8">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-2">
          Feedback
        </div>
        <h2 className="font-bubble text-[clamp(24px,3.3vw,36px)] leading-[1.02] tracking-tight text-ink">
          Tell us what&apos;s working, what&apos;s not, or what you need next.
        </h2>
        <p className="text-[13.5px] text-neutral-700 leading-relaxed mt-3 max-w-[640px]">
          Use this space for questions, suggestions, or anything you want the team to see.
          We route it straight to the admin inbox.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="sr-only">Feedback message</span>
            <textarea
              className="input min-h-[160px] resize-y"
              placeholder="Type your feedback here..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
            />
          </label>

          {status && (
            <p
              className={`text-[12.5px] font-medium ${status.kind === "success" ? "text-emerald-700" : "text-rose-700"}`}
              aria-live="polite"
            >
              {status.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-dark" disabled={submitting}>
              {submitting ? "Sending..." : "Send feedback"}
            </button>
            <Link href="/contact" className="btn-light">
              Prefer WhatsApp? Contact us
            </Link>
          </div>
        </form>
      </div>

      <aside className="rounded-3xl bg-ink text-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 uppercase mb-2">
          Need a faster reply?
        </div>
        <h3 className="font-bubble text-[26px] leading-[1.02] tracking-tight">
          We also answer on WhatsApp and email.
        </h3>
        <p className="text-[13.5px] leading-relaxed text-white/80 mt-3">
          If your note is urgent, head to the contact page and send it through the fastest
          channel. We keep the feedback box here for longer thoughts and follow-ups.
        </p>

        <div className="mt-6 space-y-3 text-[13px]">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
            <div className="font-semibold">Email</div>
            <div className="text-white/75">hello@immersia.ng</div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
            <div className="font-semibold">WhatsApp</div>
            <div className="text-white/75">+234 813 701 3560</div>
          </div>
        </div>
      </aside>
    </section>
  );
}

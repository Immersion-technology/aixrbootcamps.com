"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CampaignData } from "./CampaignComposer";

interface Progress {
  status: string;
  total: number;
  sent: number;
  failed: number;
  suppressed: number;
  remaining: number;
  dailyCap: number;
  sentToday: number;
  atDailyCap: boolean;
  completedAt: string | null;
}

interface MessageRow {
  id: string;
  email: string;
  name: string;
  status: string;
  attempts: number;
  sentAt: string | null;
  error: string | null;
  errorCode: string | null;
}

/**
 * The view for a campaign that is sending or finished.
 *
 * It also DRIVES the send: while there's work left it calls the drain endpoint
 * in a loop. That's what makes a send feel immediate on Vercel Hobby, where
 * cron only runs once a day. Closing the tab doesn't lose anything — the queue
 * is in the database, and the daily cron picks up whatever is left.
 */
export default function SendingView({ campaign, onBack }: { campaign: CampaignData; onBack: () => void }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [showFailures, setShowFailures] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Guards against two overlapping drain loops if React re-runs the effect.
  const draining = useRef(false);
  const stopped = useRef(false);

  const loadProgress = useCallback(async (): Promise<Progress | null> => {
    try {
      const res = await fetch(`/api/admin/email/campaigns/${campaign.id}/progress`);
      if (!res.ok) return null;
      const json = (await res.json()) as Progress;
      setProgress(json);
      return json;
    } catch {
      return null;
    }
  }, [campaign.id]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/email/campaigns/${campaign.id}/messages?status=failed`);
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.messages ?? []);
    } catch {
      /* non-critical */
    }
  }, [campaign.id]);

  // Drive the queue, then keep polling until it's done.
  useEffect(() => {
    stopped.current = false;

    async function pump() {
      if (draining.current) return;
      draining.current = true;

      try {
        let current = await loadProgress();

        while (!stopped.current && current && current.status === "sending" && current.remaining > 0) {
          if (current.atDailyCap) break;

          const res = await fetch("/api/admin/email/drain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaignId: campaign.id }),
          });

          if (!res.ok) {
            setNote("Sending paused — the server returned an error. It will resume automatically.");
            break;
          }

          current = await loadProgress();
        }

        if (current && (current.failed > 0 || current.status === "failed")) void loadMessages();
      } finally {
        draining.current = false;
      }
    }

    void pump();

    // Slow poll so a send driven from another tab still updates this one.
    const poll = setInterval(() => {
      void loadProgress().then((p) => {
        if (p && p.failed > 0) void loadMessages();
      });
    }, 5000);

    return () => {
      stopped.current = true;
      clearInterval(poll);
    };
  }, [campaign.id, loadProgress, loadMessages]);

  async function control(action: "pause" | "resume" | "cancel") {
    if (action === "cancel" && !confirm("Cancel this send? Anything not yet sent will be dropped.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/email/campaigns/${campaign.id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't do that");
      setNote(null);
      await loadProgress();
      if (action === "resume") location.reload();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Couldn't do that");
    } finally {
      setBusy(false);
    }
  }

  const p = progress;
  const done = p ? p.sent + p.failed + p.suppressed : 0;
  const pct = p && p.total > 0 ? Math.round((done / p.total) * 100) : 0;
  const status = p?.status ?? campaign.status;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="frosted-glass rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <StatusChip status={status} />
            <h1 className="font-display font-extrabold text-[24px] leading-tight mt-2 truncate">{campaign.name}</h1>
            <p className="text-[13px] text-neutral-600 mt-1 truncate">{campaign.subject}</p>
          </div>
        </div>

        {/* progress bar */}
        <div className="h-2.5 rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-full bg-grass-brand transition-all duration-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[11.5px] text-neutral-500 mt-1.5">
          <span>
            {done} of {p?.total ?? 0}
          </span>
          <span>{pct}%</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <Stat label="Delivered" value={p?.sent ?? 0} tone="text-grass-deep" />
          <Stat label="Remaining" value={p?.remaining ?? 0} />
          <Stat label="Failed" value={p?.failed ?? 0} tone={p?.failed ? "text-pink-deep" : undefined} />
          <Stat label="Skipped" value={p?.suppressed ?? 0} />
        </div>

        {p?.atDailyCap && (
          <div className="mt-4 text-[12.5px] bg-amber-50 text-amber-800 rounded-xl p-3.5 leading-relaxed">
            <strong className="font-semibold">Daily limit reached.</strong> {p.sentToday} of {p.dailyCap} campaign
            emails have gone out today, so the remaining {p.remaining} are paused. They&apos;ll send automatically
            tomorrow — this cap exists so a broadcast can never eat the quota that receipts and login links need.
          </div>
        )}

        {note && <div className="mt-4 text-[12.5px] bg-neutral-100 rounded-xl p-3.5">{note}</div>}

        <div className="flex flex-wrap gap-2 mt-5">
          {status === "sending" && (
            <button
              type="button"
              onClick={() => control("pause")}
              disabled={busy}
              className="text-[12.5px] font-semibold px-4 py-2 rounded-full border border-black/[.1] bg-white hover:border-violet-brand hover:text-violet-brand transition disabled:opacity-40"
            >
              Pause
            </button>
          )}
          {status === "paused" && (
            <button
              type="button"
              onClick={() => control("resume")}
              disabled={busy}
              className="btn-dark !text-[12.5px] !py-2 !px-4 disabled:opacity-40"
            >
              Resume
            </button>
          )}
          {["sending", "paused", "scheduled"].includes(status) && (
            <button
              type="button"
              onClick={() => control("cancel")}
              disabled={busy}
              className="text-[12.5px] font-semibold px-4 py-2 rounded-full border border-black/[.1] bg-white hover:border-pink-deep hover:text-pink-deep transition disabled:opacity-40"
            >
              Cancel
            </button>
          )}
          <a
            href={`/api/admin/email/campaigns/${campaign.id}/messages?format=csv`}
            className="text-[12.5px] font-semibold px-4 py-2 rounded-full border border-black/[.1] bg-white hover:border-violet-brand hover:text-violet-brand transition"
          >
            Download report
          </a>
          <button
            type="button"
            onClick={onBack}
            className="text-[12.5px] font-semibold px-4 py-2 rounded-full text-neutral-500 hover:text-violet-brand transition"
          >
            ← All campaigns
          </button>
        </div>
      </div>

      {(p?.failed ?? 0) > 0 && (
        <div className="frosted-glass rounded-3xl p-5">
          <button
            type="button"
            onClick={() => setShowFailures((s) => !s)}
            className="flex items-center justify-between w-full"
          >
            <span className="font-display font-extrabold text-[16px]">
              {p?.failed} {p?.failed === 1 ? "delivery failed" : "deliveries failed"}
            </span>
            <span className="text-[11.5px] font-semibold text-violet-brand">{showFailures ? "Hide" : "Show"}</span>
          </button>

          {showFailures && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[12.5px] min-w-[440px]">
                <thead>
                  <tr className="text-left text-[10.5px] font-bold tracking-[.14em] uppercase text-neutral-500 border-b border-black/[.06]">
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Tries</th>
                    <th className="py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id} className="border-b border-black/[.04] last:border-0 align-top">
                      <td className="py-2 pr-3 font-mono text-[11.5px]">{m.email}</td>
                      <td className="py-2 pr-3 tabular-nums">{m.attempts}</td>
                      <td className="py-2 text-neutral-600">
                        {m.errorCode && <span className="font-mono text-[11px] mr-1.5">{m.errorCode}</span>}
                        {m.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11.5px] text-neutral-500 mt-3">
                Addresses that don&apos;t exist are added to the suppression list automatically, so they won&apos;t be
                retried on the next campaign.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-white/70 rounded-2xl p-3.5">
      <div className={`font-display font-extrabold text-[22px] tabular-nums leading-none ${tone ?? ""}`}>{value}</div>
      <div className="text-[10.5px] font-bold tracking-[.14em] uppercase text-neutral-500 mt-1.5">{label}</div>
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-neutral-200 text-neutral-600" },
    scheduled: { label: "Scheduled", className: "bg-amber-100 text-amber-800" },
    sending: { label: "Sending", className: "bg-aqua-brand/20 text-aqua-deep" },
    paused: { label: "Paused", className: "bg-amber-100 text-amber-800" },
    sent: { label: "Sent", className: "bg-grass-brand/20 text-grass-deep" },
    cancelled: { label: "Cancelled", className: "bg-neutral-200 text-neutral-500" },
    failed: { label: "Failed", className: "bg-pink-deep/15 text-pink-deep" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[.14em] uppercase px-2.5 py-1 rounded-full ${s.className}`}
    >
      {status === "sending" && <span className="w-1.5 h-1.5 rounded-full bg-aqua-deep animate-pulse" />}
      {s.label}
    </span>
  );
}

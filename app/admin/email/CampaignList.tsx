"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusChip } from "./[id]/SendingView";

export interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  status: string;
  segmentLabel: string;
  stats: { total: number; sent: number; failed: number; suppressed: number; opened: number };
  scheduledFor: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface TemplateRow {
  id: string;
  name: string;
  description: string;
  subject: string;
  blockCount: number;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "—";

export default function CampaignList({
  initial,
  templates,
}: {
  initial: CampaignRow[];
  templates: TemplateRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Give the campaign a name so you can find it later.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: templateId ? "" : name.trim(),
          templateId: templateId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't create that campaign");
      router.push(`/admin/email/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }

  async function remove(row: CampaignRow) {
    if (!confirm(`Delete "${row.name}"? This can't be undone.`)) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== row.id));
    try {
      const res = await fetch(`/api/admin/email/campaigns/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error);
      }
    } catch (err) {
      setRows(prev);
      alert(err instanceof Error && err.message ? err.message : "Couldn't delete that campaign.");
    }
  }

  return (
    <div className="space-y-5">
      {/* new campaign */}
      {showNew ? (
        <form onSubmit={create} className="frosted-glass rounded-3xl p-5 sm:p-7">
          <div className="mb-4">
            <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">New campaign</div>
            <h2 className="font-display font-extrabold text-[18px] mt-0.5">What&apos;s this email about?</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Name (only you see this)</span>
              <input
                className="input"
                autoFocus
                placeholder="Cohort 2 — day one logistics"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">Start from</span>
              <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">A blank email</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="text-[12.5px] text-pink-deep mt-3">⚠ {error}</p>}

          <div className="flex gap-2 mt-5">
            <button type="submit" disabled={creating} className="btn-dark !text-sm disabled:opacity-60">
              {creating ? "Creating…" : "Start writing →"}
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="text-[13px] font-semibold px-5 rounded-full text-neutral-500 hover:text-violet-brand transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowNew(true)} className="btn-dark !text-sm">
          + New campaign
        </button>
      )}

      {/* list */}
      <div className="frosted-glass rounded-3xl p-5 sm:p-7">
        <div className="mb-4">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">
            {rows.length} {rows.length === 1 ? "campaign" : "campaigns"}
          </div>
          <h2 className="font-display font-extrabold text-[18px] mt-0.5">All campaigns</h2>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[13.5px] text-neutral-600 max-w-sm mx-auto leading-relaxed">
              No campaigns yet. Create one to email parents, the waitlist or your facilitators — with a preview
              and a test send before anything goes out.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[13px] min-w-[720px]">
              <thead>
                <tr className="text-left text-[10.5px] font-bold tracking-[.14em] uppercase text-neutral-500 border-b border-black/[.06]">
                  <th className="py-2 pr-3">Campaign</th>
                  <th className="py-2 pr-3">Audience</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Sent</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-black/[.04] last:border-0">
                    <td className="py-3 pr-3">
                      <Link href={`/admin/email/${c.id}`} className="font-semibold hover:text-violet-brand transition">
                        {c.name}
                      </Link>
                      <div className="text-[11.5px] text-neutral-500 mt-0.5 truncate max-w-[260px]" title={c.subject}>
                        {c.subject || "No subject yet"}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-neutral-600">{c.segmentLabel}</td>
                    <td className="py-3 pr-3">
                      <StatusChip status={c.status} />
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">
                      {c.stats.sent > 0 || c.stats.total > 0 ? (
                        <>
                          {c.stats.sent}
                          <span className="text-neutral-400">/{c.stats.total}</span>
                          {c.stats.failed > 0 && (
                            <div className="text-[11px] text-pink-deep">{c.stats.failed} failed</div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-3 text-neutral-600 whitespace-nowrap">
                      {fmtDate(c.completedAt ?? c.scheduledFor ?? c.createdAt)}
                    </td>
                    <td className="py-3 pr-1 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/email/${c.id}`}
                        className="text-[11.5px] font-semibold text-violet-brand hover:underline mr-3"
                      >
                        {["draft", "scheduled"].includes(c.status) ? "Edit" : "View"}
                      </Link>
                      {c.status !== "sending" && (
                        <button
                          type="button"
                          onClick={() => remove(c)}
                          className="text-[11.5px] font-semibold text-pink-deep hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

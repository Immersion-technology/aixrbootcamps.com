"use client";

import { useState } from "react";

export interface SuppressionRow {
  id: string;
  email: string;
  reason: string;
  source: string;
  note: string;
  createdAt: string;
}

const REASON_LABEL: Record<string, { label: string; className: string; hint: string }> = {
  unsubscribe: {
    label: "Unsubscribed",
    className: "bg-neutral-200 text-neutral-600",
    hint: "They asked to stop receiving camp updates",
  },
  bounce: {
    label: "Bounced",
    className: "bg-pink-deep/15 text-pink-deep",
    hint: "The mailbox doesn't exist — kept off the list to protect deliverability",
  },
  complaint: {
    label: "Marked as spam",
    className: "bg-pink-deep/15 text-pink-deep",
    hint: "They reported an email as spam",
  },
  admin: { label: "Added by you", className: "bg-amber-100 text-amber-800", hint: "Added manually from this page" },
};

export default function SuppressionManager({ initial }: { initial: SuppressionRow[] }) {
  const [rows, setRows] = useState(initial);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/email/suppressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), reason: "admin", note: note.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't add that address");

      const added: SuppressionRow = {
        id: `tmp-${Date.now()}`,
        email: email.trim().toLowerCase(),
        reason: "admin",
        source: "admin",
        note: note.trim(),
        createdAt: new Date().toISOString(),
      };
      setRows((r) => [added, ...r.filter((x) => x.email !== added.email)]);
      setEmail("");
      setNote("");
      flash(`✓ ${added.email} won't receive campaigns`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: SuppressionRow) {
    const warning =
      row.reason === "unsubscribe" || row.reason === "complaint"
        ? `${row.email} asked to stop receiving camp updates. Removing them means they'll be emailed again.\n\nOnly do this if they've asked you to re-subscribe them. Continue?`
        : `Remove ${row.email} from the suppression list? They'll be included in future campaigns.`;
    if (!confirm(warning)) return;

    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== row.id));
    try {
      const res = await fetch(`/api/admin/email/suppressions?email=${encodeURIComponent(row.email)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      flash(`Removed ${row.email}`);
    } catch {
      setRows(prev);
      flash(`⚠ Couldn't remove ${row.email}`);
    }
  }

  const filtered = query.trim()
    ? rows.filter((r) => r.email.includes(query.trim().toLowerCase()))
    : rows;

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="frosted-glass rounded-3xl p-5 sm:p-7">
        <div className="mb-4">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">Add manually</div>
          <h2 className="font-display font-extrabold text-[18px] mt-0.5">Block an address</h2>
          <p className="text-[12.5px] text-neutral-600 mt-1.5 max-w-[520px] leading-relaxed">
            Use this when a parent asks you to stop emailing them over the phone or on WhatsApp. They&apos;ll still
            receive receipts and login links — those aren&apos;t marketing and are never blocked.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="label">Email address</span>
            <input
              type="email"
              className="input"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="label">Note (optional)</span>
            <input
              className="input"
              placeholder="Asked on the phone, 12 Aug"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="text-[12.5px] text-pink-deep mt-3">⚠ {error}</p>}

        <button type="submit" disabled={busy} className="btn-dark !text-sm mt-5 disabled:opacity-60">
          {busy ? "Adding…" : "Add to list"}
        </button>
      </form>

      <div className="frosted-glass rounded-3xl p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">
              {rows.length} {rows.length === 1 ? "address" : "addresses"}
            </div>
            <h2 className="font-display font-extrabold text-[18px] mt-0.5">Won&apos;t receive campaigns</h2>
          </div>
          <div className="flex gap-2 items-center">
            <input
              className="input !py-2 !w-auto min-w-[180px] text-[12.5px]"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <a
              href="/api/admin/email/suppressions?format=csv"
              className="text-[12px] font-semibold px-3.5 py-2 rounded-full border border-black/[.1] bg-white hover:border-violet-brand hover:text-violet-brand transition whitespace-nowrap"
            >
              Export
            </a>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-[13.5px] text-neutral-600 py-8 text-center">
            {rows.length === 0 ? "Nobody has unsubscribed. " : "No matches. "}
            {rows.length === 0 && "Anyone who taps unsubscribe will appear here automatically."}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead>
                <tr className="text-left text-[10.5px] font-bold tracking-[.14em] uppercase text-neutral-500 border-b border-black/[.06]">
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Reason</th>
                  <th className="py-2 pr-3">Added</th>
                  <th className="py-2 pr-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const meta = REASON_LABEL[r.reason] ?? REASON_LABEL.admin;
                  return (
                    <tr key={r.id} className="border-b border-black/[.04] last:border-0">
                      <td className="py-3 pr-3 font-mono text-[12px]">{r.email}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block text-[10.5px] font-bold tracking-[.1em] uppercase px-2 py-0.5 rounded-full ${meta.className}`}
                          title={meta.hint}
                        >
                          {meta.label}
                        </span>
                        {r.note && <div className="text-[11px] text-neutral-500 mt-1">{r.note}</div>}
                      </td>
                      <td className="py-3 pr-3 text-neutral-600 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-1 text-right">
                        <button
                          type="button"
                          onClick={() => remove(r)}
                          className="text-[11.5px] font-semibold text-neutral-500 hover:text-pink-deep hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="frosted-glass-dark rounded-full px-4 py-2 text-[12px] font-semibold anim-fade-up">{toast}</div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

export interface PromoRow {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number; // percent, or kobo when fixed
  maxUses: number | null;
  usedCount: number;
  minSubtotalKobo: number | null;
  active: boolean;
  expiresAt: string | null; // ISO
}

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

const BLANK = {
  code: "",
  description: "",
  discountType: "percent" as "percent" | "fixed",
  value: "",
  maxUses: "",
  minSubtotal: "",
  expiresAt: "",
};

export default function PromoManager({ initial }: { initial: PromoRow[] }) {
  const [rows, setRows] = useState<PromoRow[]>(initial);
  const [form, setForm] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const value = Number(form.value);
    if (!form.code.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Enter a code and a discount greater than 0.");
      return;
    }
    if (form.discountType === "percent" && value > 100) {
      setError("A percentage discount can't exceed 100.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      // percent → whole percent; fixed → naira input converted to kobo.
      discountValue: form.discountType === "percent" ? Math.round(value) : Math.round(value * 100),
      maxUses: form.maxUses ? Math.round(Number(form.maxUses)) : null,
      minSubtotalKobo: form.minSubtotal ? Math.round(Number(form.minSubtotal) * 100) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      active: true,
    };

    setBusy(true);
    try {
      const r = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Failed to create code");

      setRows((prev) => [
        {
          id: json.id,
          code: payload.code,
          description: payload.description ?? "",
          discountType: payload.discountType,
          discountValue: payload.discountValue,
          maxUses: payload.maxUses,
          usedCount: 0,
          minSubtotalKobo: payload.minSubtotalKobo ?? null,
          active: true,
          expiresAt: payload.expiresAt ?? null,
        },
        ...prev,
      ]);
      setForm({ ...BLANK });
      flash(`✓ Created ${payload.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: PromoRow) {
    const next = !row.active;
    setRows((prev) => prev.map((p) => (p.id === row.id ? { ...p, active: next } : p)));
    try {
      const r = await fetch(`/api/admin/promos/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      if (!r.ok) throw new Error();
      flash(`${row.code} ${next ? "activated" : "paused"}`);
    } catch {
      // revert on failure
      setRows((prev) => prev.map((p) => (p.id === row.id ? { ...p, active: !next } : p)));
      flash(`⚠ Couldn't update ${row.code}`);
    }
  }

  async function remove(row: PromoRow) {
    if (!confirm(`Delete promo code ${row.code}? This can't be undone.`)) return;
    const prev = rows;
    setRows((cur) => cur.filter((p) => p.id !== row.id));
    try {
      const r = await fetch(`/api/admin/promos/${row.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      flash(`Deleted ${row.code}`);
    } catch {
      setRows(prev);
      flash(`⚠ Couldn't delete ${row.code}`);
    }
  }

  const discountLabel = (p: PromoRow) =>
    p.discountType === "percent" ? `${p.discountValue}% off` : `${naira(p.discountValue)} off`;

  return (
    <div className="space-y-6">
      {/* CREATE */}
      <form onSubmit={create} className="frosted-glass rounded-3xl p-5 sm:p-7">
        <div className="mb-5">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">New code</div>
          <h2 className="font-display font-extrabold text-[18px] mt-0.5">Create a promo code</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="label">Code</span>
            <input
              className="input uppercase"
              placeholder="EARLYBIRD20"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
            />
          </label>
          <label className="block">
            <span className="label">Discount type</span>
            <select
              className="input"
              value={form.discountType}
              onChange={(e) => set("discountType", e.target.value as "percent" | "fixed")}
            >
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (₦)</option>
            </select>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <label className="block">
            <span className="label">{form.discountType === "percent" ? "Percent off (1–100)" : "Amount off (₦)"}</span>
            <input
              type="number"
              min={1}
              className="input"
              placeholder={form.discountType === "percent" ? "20" : "10000"}
              value={form.value}
              onChange={(e) => set("value", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">Max uses (blank = unlimited)</span>
            <input
              type="number"
              min={1}
              className="input"
              placeholder="50"
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value)}
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <label className="block">
            <span className="label">Minimum order (₦, optional)</span>
            <input
              type="number"
              min={0}
              className="input"
              placeholder="0"
              value={form.minSubtotal}
              onChange={(e) => set("minSubtotal", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">Expires (optional)</span>
            <input
              type="datetime-local"
              className="input"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
            />
          </label>
        </div>

        <label className="block mt-4">
          <span className="label">Description (optional, internal)</span>
          <input
            className="input"
            placeholder="Early-bird campaign"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>

        {error && <p className="text-[12.5px] text-pink-deep mt-3">⚠ {error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn-dark !text-sm mt-5 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create code"}
        </button>
      </form>

      {/* LIST */}
      <div className="frosted-glass rounded-3xl p-5 sm:p-7">
        <div className="mb-4">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">
            {rows.length} {rows.length === 1 ? "code" : "codes"}
          </div>
          <h2 className="font-display font-extrabold text-[18px] mt-0.5">All promo codes</h2>
        </div>

        {rows.length === 0 ? (
          <p className="text-[13px] text-neutral-500 py-6 text-center">No promo codes yet. Create one above.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead>
                <tr className="text-left text-[10.5px] font-bold tracking-[.14em] uppercase text-neutral-500 border-b border-black/[.06]">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Discount</th>
                  <th className="py-2 pr-3">Uses</th>
                  <th className="py-2 pr-3">Expires</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-black/[.04] last:border-0">
                    <td className="py-3 pr-3">
                      <div className="font-mono font-semibold">{p.code}</div>
                      {p.description && <div className="text-[11px] text-neutral-500 mt-0.5">{p.description}</div>}
                      {p.minSubtotalKobo ? (
                        <div className="text-[10.5px] text-neutral-400 mt-0.5">min {naira(p.minSubtotalKobo)}</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 font-semibold">{discountLabel(p)}</td>
                    <td className="py-3 pr-3 tabular-nums">
                      {p.usedCount}
                      {p.maxUses != null ? ` / ${p.maxUses}` : ""}
                    </td>
                    <td className="py-3 pr-3 text-neutral-600">
                      {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[.1em] uppercase px-2 py-0.5 rounded-full ${
                          p.active ? "bg-grass-brand/20 text-grass-deep" : "bg-neutral-200 text-neutral-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.active ? "bg-grass-brand" : "bg-neutral-400"}`} />
                        {p.active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="py-3 pr-1 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggle(p)}
                        className="text-[11.5px] font-semibold text-violet-brand hover:underline mr-3"
                      >
                        {p.active ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        className="text-[11.5px] font-semibold text-pink-deep hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
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

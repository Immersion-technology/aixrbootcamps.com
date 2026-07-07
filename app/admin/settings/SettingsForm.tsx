"use client";

import { useState } from "react";
import { SETTING_KEYS } from "@/models/Setting";

interface Props {
  initial: Record<string, string | number>;
}

export default function SettingsForm({ initial }: Props) {
  const [vals, setVals] = useState(initial);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ key: string; ok: boolean } | null>(null);

  function set(k: string, v: string | number) {
    setVals((prev) => ({ ...prev, [k]: v }));
  }

  async function save(key: string, value: unknown) {
    setSavingKey(key);
    setToast(null);
    try {
      const r = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!r.ok) throw new Error("Failed");
      setToast({ key, ok: true });
    } catch {
      setToast({ key, ok: false });
    } finally {
      setSavingKey(null);
      setTimeout(() => setToast(null), 2400);
    }
  }

  return (
    <div className="space-y-5">
      {/* PRICING — now configured via environment variables (see lib/pricing.ts / .env). */}
      <Section title="Pricing" eyebrow="Set via env">
        <p className="text-[13px] text-neutral-600 leading-relaxed">
          Boot-camp prices are configured through environment variables
          (<code className="text-[12px] bg-black/[.05] rounded px-1.5 py-0.5">PRICE_EARLY_BIRD_KOBO</code>,
          <code className="text-[12px] bg-black/[.05] rounded px-1.5 py-0.5 ml-1">PRICE_REGULAR_KOBO</code>,
          <code className="text-[12px] bg-black/[.05] rounded px-1.5 py-0.5 ml-1">PRICE_LAPTOP_RENTAL_KOBO</code>,
          <code className="text-[12px] bg-black/[.05] rounded px-1.5 py-0.5 ml-1">PRICE_ROBOTICS_ELECTIVE_KOBO</code>)
          so there's a single source of truth for what campers are shown and charged. Update them in your
          deployment's environment and redeploy. To run limited-time discounts, use{" "}
          <a href="/admin/promos" className="text-violet-brand font-semibold hover:underline">promo codes</a>.
        </p>
      </Section>

      {/* COHORT DATES */}
      <Section title="Cohort dates" eyebrow="When camp runs">
        <Field label="Early-bird cutoff (datetime)">
          <input
            type="datetime-local"
            className="input"
            value={(vals[SETTING_KEYS.EARLY_BIRD_CUTOFF] as string)?.slice(0, 16) ?? ""}
            onChange={(e) => set(SETTING_KEYS.EARLY_BIRD_CUTOFF, new Date(e.target.value).toISOString())}
            onBlur={() => save(SETTING_KEYS.EARLY_BIRD_CUTOFF, vals[SETTING_KEYS.EARLY_BIRD_CUTOFF])}
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Field label="Camp start date">
            <input type="date" className="input"
              value={vals[SETTING_KEYS.CAMP_START_DATE] as string}
              onChange={(e) => set(SETTING_KEYS.CAMP_START_DATE, e.target.value)}
              onBlur={() => save(SETTING_KEYS.CAMP_START_DATE, vals[SETTING_KEYS.CAMP_START_DATE])} />
          </Field>
          <Field label="Camp end date">
            <input type="date" className="input"
              value={vals[SETTING_KEYS.CAMP_END_DATE] as string}
              onChange={(e) => set(SETTING_KEYS.CAMP_END_DATE, e.target.value)}
              onBlur={() => save(SETTING_KEYS.CAMP_END_DATE, vals[SETTING_KEYS.CAMP_END_DATE])} />
          </Field>
        </div>
      </Section>

      {/* OPERATIONS */}
      <Section title="Operations" eyebrow="Capacity & alerts">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Total slot capacity">
            <input type="number" className="input"
              value={vals[SETTING_KEYS.CAPACITY]}
              onChange={(e) => set(SETTING_KEYS.CAPACITY, Number(e.target.value))}
              onBlur={() => save(SETTING_KEYS.CAPACITY, vals[SETTING_KEYS.CAPACITY])} />
          </Field>
          <Field label="Admin alert email">
            <input type="email" className="input"
              value={vals[SETTING_KEYS.ADMIN_ALERT_EMAIL] as string}
              onChange={(e) => set(SETTING_KEYS.ADMIN_ALERT_EMAIL, e.target.value)}
              onBlur={() => save(SETTING_KEYS.ADMIN_ALERT_EMAIL, vals[SETTING_KEYS.ADMIN_ALERT_EMAIL])} />
          </Field>
        </div>
      </Section>

      {/* TOAST */}
      {(savingKey || toast) && (
        <div className="fixed bottom-5 right-5 z-50">
          {savingKey && (
            <div className="frosted-glass-dark rounded-full px-4 py-2 text-[12px] font-semibold flex items-center gap-2 anim-fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-white anim-pulse inline-block" />
              Saving {savingKey}…
            </div>
          )}
          {!savingKey && toast && (
            <div className={`rounded-full px-4 py-2 text-[12px] font-semibold anim-fade-up ${toast.ok ? "frosted-glass-violet" : "bg-pink-deep text-white"}`}>
              {toast.ok ? `✓ Saved ${toast.key}` : `⚠ Failed to save ${toast.key}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="frosted-glass rounded-3xl p-5 sm:p-7">
      <div className="mb-5">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">{eyebrow}</div>
        <h2 className="font-display font-extrabold text-[18px] mt-0.5">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

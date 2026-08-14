"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BlockEditor, { type EditorBlock, type MergeFieldInfo } from "../BlockEditor";
import SendingView from "./SendingView";

export interface SegmentOption {
  key: string;
  label: string;
  description: string;
  supportsFilters: boolean;
}

export interface CampaignData {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  blocks: EditorBlock[];
  replyTo: string;
  segment: { source: string; filters: Record<string, string | number | undefined> };
  status: string;
  scheduledFor: string | null;
  trackOpens: boolean;
  stats: { total: number; sent: number; failed: number; suppressed: number; opened: number };
}

interface Props {
  initial: CampaignData;
  segments: SegmentOption[];
  cohorts: Array<{ id: number; label: string }>;
  courses: string[];
  mergeFields: MergeFieldInfo[];
}

type SaveState = "idle" | "saving" | "saved" | "error";

const EDITABLE = ["draft", "scheduled"];

export default function CampaignComposer({ initial, segments, cohorts, courses, mergeFields }: Props) {
  const [campaign, setCampaign] = useState<CampaignData>(initial);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{ index: number; message: string }>>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [audience, setAudience] = useState<{
    count: number;
    matched: number;
    suppressed: number;
    label: string;
    sample: Array<{ email: string; name: string }>;
    loading: boolean;
    error: string | null;
  }>({ count: 0, matched: 0, suppressed: 0, label: "", sample: [], loading: true, error: null });
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const editable = EDITABLE.includes(campaign.status);
  // Skip the autosave that would otherwise fire from the initial hydration.
  const firstRender = useRef(true);

  const flash = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const patch = (next: Partial<CampaignData>) => setCampaign((c) => ({ ...c, ...next }));

  // ---------------------------------------------------------------- save ---
  const save = useCallback(
    async (data: CampaignData) => {
      setSaveState("saving");
      setSaveError(null);
      try {
        const res = await fetch(`/api/admin/email/campaigns/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            subject: data.subject,
            preheader: data.preheader,
            blocks: data.blocks,
            replyTo: data.replyTo,
            trackOpens: data.trackOpens,
            segment: data.segment,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Couldn't save");
        setSaveState("saved");
        setIssues([]);
      } catch (err) {
        setSaveState("error");
        setSaveError(err instanceof Error ? err.message : "Couldn't save");
      }
    },
    []
  );

  // Debounced autosave — a composer that loses work on a stray refresh is worse
  // than one that saves a little too eagerly.
  useEffect(() => {
    if (!editable) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => void save(campaign), 1200);
    return () => clearTimeout(t);
  }, [campaign, editable, save]);

  // ------------------------------------------------------------- preview ---
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/email/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: campaign.subject,
            preheader: campaign.preheader,
            blocks: campaign.blocks,
          }),
        });
        const json = await res.json();
        if (res.ok) {
          setPreviewHtml(json.html);
          setIssues(json.issues ?? []);
        } else {
          setIssues([{ index: -1, message: json.error ?? "Preview failed" }]);
        }
      } catch {
        /* preview is best-effort; the editor keeps working without it */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [campaign.subject, campaign.preheader, campaign.blocks]);

  // ------------------------------------------------------------ audience ---
  const segmentDef = useMemo(
    () => segments.find((s) => s.key === campaign.segment.source),
    [segments, campaign.segment.source]
  );

  useEffect(() => {
    const t = setTimeout(async () => {
      setAudience((a) => ({ ...a, loading: true, error: null }));
      try {
        const params = new URLSearchParams({ source: campaign.segment.source });
        for (const [k, v] of Object.entries(campaign.segment.filters ?? {})) {
          if (v !== undefined && v !== "") params.set(k, String(v));
        }
        const res = await fetch(`/api/admin/email/segments?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Couldn't count that audience");
        setAudience({
          count: json.count,
          matched: json.matched,
          suppressed: json.suppressed,
          label: json.label,
          sample: json.sample ?? [],
          loading: false,
          error: null,
        });
      } catch (err) {
        setAudience((a) => ({
          ...a,
          loading: false,
          error: err instanceof Error ? err.message : "Couldn't count that audience",
        }));
      }
    }, 400);
    return () => clearTimeout(t);
  }, [campaign.segment]);

  // ---------------------------------------------------------------- send ---
  async function saveAsTemplate() {
    const name = prompt("Save this email as a reusable template. What should it be called?", campaign.name);
    if (!name?.trim()) return;
    try {
      const res = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: campaign.subject,
          preheader: campaign.preheader,
          blocks: campaign.blocks,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't save that template");
      flash(`✓ Saved "${name.trim()}" to your templates`);
    } catch (err) {
      flash(`⚠ ${err instanceof Error ? err.message : "Couldn't save that template"}`);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      await save(campaign);
      const res = await fetch(`/api/admin/email/campaigns/${campaign.id}/test`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Test send failed");
      flash(`✓ Test sent to ${json.sentTo}`);
    } catch (err) {
      flash(`⚠ ${err instanceof Error ? err.message : "Test send failed"}`);
    } finally {
      setTesting(false);
    }
  }

  async function send(scheduledFor?: string) {
    await save(campaign);
    const res = await fetch(`/api/admin/email/campaigns/${campaign.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledFor, expectedRecipients: audience.count }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Couldn't start the send");
    setConfirmOpen(false);
    patch({ status: json.status, scheduledFor: json.scheduledFor });
    flash(json.status === "scheduled" ? "✓ Scheduled" : `✓ Sending to ${json.queued}`);
  }

  // Already sending or finished — hand over to the live progress view.
  if (!editable) {
    return <SendingView campaign={campaign} onBack={() => location.assign("/admin/email")} />;
  }

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_460px] gap-6 items-start">
      {/* ---------------------------------------------------------- editor */}
      <div className="space-y-4 min-w-0">
        <div className="frosted-glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">
                {campaign.status === "scheduled" ? "Scheduled" : "Draft"}
              </div>
              <input
                className="font-display font-extrabold text-[20px] bg-transparent border-0 p-0 w-full focus:outline-none focus:ring-0"
                value={campaign.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Campaign name (internal)"
              />
            </div>
            <SaveBadge state={saveState} error={saveError} />
          </div>

          <label className="block mb-3">
            <span className="label">Subject line</span>
            <input
              className="input"
              value={campaign.subject}
              onChange={(e) => patch({ subject: e.target.value })}
              placeholder="Camp starts Monday — what to bring"
            />
          </label>

          <label className="block">
            <span className="label">Preview text</span>
            <input
              className="input"
              value={campaign.preheader}
              onChange={(e) => patch({ preheader: e.target.value })}
              placeholder="The grey line Gmail shows next to the subject"
            />
          </label>
        </div>

        <BlockEditor
          blocks={campaign.blocks}
          onChange={(blocks) => patch({ blocks })}
          mergeFields={mergeFields}
          issues={issues}
        />

        {/* advanced */}
        <details className="frosted-glass rounded-2xl p-4">
          <summary className="text-[13px] font-semibold cursor-pointer">Advanced</summary>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="label">Reply-to address (optional)</span>
              <input
                className="input"
                value={campaign.replyTo}
                onChange={(e) => patch({ replyTo: e.target.value })}
                placeholder="registrations@immersia.ng"
              />
            </label>
            <label className="flex items-start gap-2.5 text-[13px]">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={campaign.trackOpens}
                onChange={(e) => patch({ trackOpens: e.target.checked })}
              />
              <span>
                <strong className="font-semibold">Track opens</strong>
                <span className="block text-[12px] text-neutral-500">
                  Embeds an invisible pixel. Off by default — it&apos;s disclosed in the privacy policy,
                  and Gmail&apos;s image proxy makes the numbers approximate at best.
                </span>
              </span>
            </label>
          </div>
        </details>
      </div>

      {/* --------------------------------------------------------- preview */}
      <div className="space-y-4 xl:sticky xl:top-6">
        <AudiencePicker
          segments={segments}
          segmentDef={segmentDef}
          cohorts={cohorts}
          courses={courses}
          value={campaign.segment}
          audience={audience}
          onChange={(segment) => patch({ segment })}
        />

        <div className="frosted-glass rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">Preview</div>
            <div className="flex gap-1">
              {(["desktop", "mobile"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPreviewWidth(w)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition ${
                    previewWidth === w ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-violet-brand"
                  }`}
                >
                  {w === "desktop" ? "Desktop" : "Mobile"}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-black/[.06] bg-neutral-100">
            <iframe
              title="Email preview"
              // Sandboxed with no allowances: the preview can render but can
              // never execute script or navigate the admin away.
              sandbox=""
              srcDoc={previewHtml}
              className="w-full h-[560px] bg-white transition-all mx-auto block"
              style={{ maxWidth: previewWidth === "mobile" ? 380 : "100%" }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Shown with sample details. Each recipient sees their own.
          </p>
        </div>

        {/* actions */}
        <div className="frosted-glass rounded-3xl p-5 space-y-3">
          {issues.length > 0 && (
            <div className="text-[12.5px] text-pink-deep bg-pink-deep/5 rounded-xl p-3">
              ⚠ Fix {issues.length} {issues.length === 1 ? "problem" : "problems"} above before sending.
            </div>
          )}

          <button
            type="button"
            onClick={sendTest}
            disabled={testing}
            className="w-full text-[13px] font-semibold py-2.5 rounded-full border border-black/[.1] bg-white hover:border-violet-brand hover:text-violet-brand transition disabled:opacity-50"
          >
            {testing ? "Sending…" : "Send a test to myself"}
          </button>

          <button
            type="button"
            onClick={saveAsTemplate}
            className="w-full text-[12.5px] font-semibold py-2 rounded-full text-neutral-500 hover:text-violet-brand transition"
          >
            Save as a template
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={audience.count === 0 || issues.length > 0 || saveState === "saving"}
            className="btn-dark w-full justify-center !text-sm disabled:opacity-40"
          >
            Review &amp; send →
          </button>

          <p className="text-[11.5px] text-neutral-500 text-center">
            {audience.loading
              ? "Counting recipients…"
              : `${audience.count} ${audience.count === 1 ? "person" : "people"} will receive this`}
          </p>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmSend
          count={audience.count}
          segmentLabel={audience.label}
          subject={campaign.subject}
          onCancel={() => setConfirmOpen(false)}
          onSend={send}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="frosted-glass-dark rounded-full px-4 py-2 text-[12px] font-semibold anim-fade-up">{toast}</div>
        </div>
      )}
    </div>
  );
}

function SaveBadge({ state, error }: { state: SaveState; error: string | null }) {
  if (state === "saving") return <span className="text-[11.5px] text-neutral-500 shrink-0">Saving…</span>;
  if (state === "saved") return <span className="text-[11.5px] text-grass-deep shrink-0">Saved</span>;
  if (state === "error")
    return (
      <span className="text-[11.5px] text-pink-deep shrink-0 max-w-[180px] text-right" title={error ?? ""}>
        ⚠ {error ?? "Not saved"}
      </span>
    );
  return null;
}

function AudiencePicker({
  segments,
  segmentDef,
  cohorts,
  courses,
  value,
  audience,
  onChange,
}: {
  segments: SegmentOption[];
  segmentDef?: SegmentOption;
  cohorts: Array<{ id: number; label: string }>;
  courses: string[];
  value: CampaignData["segment"];
  audience: { count: number; matched: number; suppressed: number; sample: Array<{ email: string; name: string }>; loading: boolean; error: string | null };
  onChange: (segment: CampaignData["segment"]) => void;
}) {
  const setFilter = (key: string, v: string) =>
    onChange({ ...value, filters: { ...value.filters, [key]: v || undefined } });

  return (
    <div className="frosted-glass rounded-3xl p-5">
      <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-2.5">Audience</div>

      <select
        className="input"
        value={value.source}
        onChange={(e) => onChange({ source: e.target.value, filters: {} })}
      >
        {segments.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      {segmentDef && <p className="text-[11.5px] text-neutral-500 mt-1.5">{segmentDef.description}</p>}

      {segmentDef?.supportsFilters && (
        <div className="grid gap-3 mt-3">
          <select className="input" value={String(value.filters.cohort ?? "")} onChange={(e) => setFilter("cohort", e.target.value)}>
            <option value="">Every cohort</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={String(value.filters.attendanceMode ?? "")}
            onChange={(e) => setFilter("attendanceMode", e.target.value)}
          >
            <option value="">In-person and online</option>
            <option value="in_person">In-person only</option>
            <option value="online">Online only</option>
          </select>
          <select className="input" value={String(value.filters.course ?? "")} onChange={(e) => setFilter("course", e.target.value)}>
            <option value="">Any course</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {value.source === "custom" && (
        <textarea
          className="input mt-3 min-h-[90px] font-mono text-[12px]"
          placeholder="one@example.com&#10;two@example.com"
          value={String(value.filters.emails ?? "")}
          onChange={(e) => setFilter("emails", e.target.value)}
        />
      )}

      <div className="mt-4 pt-3.5 border-t border-black/[.06]">
        {audience.error ? (
          <p className="text-[12.5px] text-pink-deep">⚠ {audience.error}</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-[26px] tabular-nums leading-none">
                {audience.loading ? "…" : audience.count}
              </span>
              <span className="text-[12.5px] text-neutral-600">
                {audience.count === 1 ? "recipient" : "recipients"}
              </span>
            </div>
            {audience.suppressed > 0 && (
              <p className="text-[11.5px] text-neutral-500 mt-1">
                {audience.suppressed} excluded — unsubscribed or bounced
              </p>
            )}
            {audience.sample.length > 0 && (
              <p className="text-[11px] text-neutral-400 mt-1.5 truncate" title={audience.sample.map((s) => s.email).join(", ")}>
                e.g. {audience.sample.slice(0, 3).map((s) => s.email).join(", ")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmSend({
  count,
  segmentLabel,
  subject,
  onCancel,
  onSend,
}: {
  count: number;
  segmentLabel: string;
  subject: string;
  onCancel: () => void;
  onSend: (scheduledFor?: string) => Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Typing the exact number is the last line of defence against sending the
  // right email to the wrong list.
  const confirmed = typed.trim() === String(count);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      await onSend(when ? new Date(when).toISOString() : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the send");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1">Confirm send</div>
        <h2 className="font-display font-extrabold text-[22px] leading-tight mb-4">
          This goes to {count} {count === 1 ? "person" : "people"}
        </h2>

        <dl className="text-[13px] space-y-1.5 mb-4 bg-neutral-50 rounded-xl p-3.5">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500 shrink-0">Audience</dt>
            <dd className="font-semibold text-right">{segmentLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500 shrink-0">Subject</dt>
            <dd className="font-semibold text-right truncate" title={subject}>
              {subject}
            </dd>
          </div>
        </dl>

        <label className="block mb-3">
          <span className="label">Schedule for later (optional)</span>
          <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Leave blank to start sending now.
          </span>
        </label>

        <label className="block mb-4">
          <span className="label">Type {count} to confirm</span>
          <input
            className="input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={String(count)}
            inputMode="numeric"
          />
        </label>

        {error && <p className="text-[12.5px] text-pink-deep mb-3">⚠ {error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-[13px] font-semibold py-2.5 rounded-full border border-black/[.1] hover:bg-neutral-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={go}
            disabled={!confirmed || busy}
            className="btn-dark flex-1 justify-center !text-sm !py-2.5 disabled:opacity-40"
          >
            {busy ? "Starting…" : when ? "Schedule" : "Send now"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import BlockEditor, { makeBlock, type EditorBlock, type MergeFieldInfo } from "../BlockEditor";

export interface TemplateRow {
  id: string;
  name: string;
  description: string;
  subject: string;
  preheader: string;
  blocks: EditorBlock[];
  blockCount: number;
  updatedAt: string;
}

interface Draft {
  id: string | null;
  name: string;
  description: string;
  subject: string;
  preheader: string;
  blocks: EditorBlock[];
}

const blank = (): Draft => ({
  id: null,
  name: "",
  description: "",
  subject: "",
  preheader: "",
  blocks: [makeBlock("heading"), makeBlock("text")],
});

export default function TemplateManager({
  initial,
  mergeFields,
}: {
  initial: TemplateRow[];
  mergeFields: MergeFieldInfo[];
}) {
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{ index: number; message: string }>>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  // Live preview, same endpoint and renderer the composer uses.
  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/email/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: draft.subject, preheader: draft.preheader, blocks: draft.blocks }),
        });
        const json = await res.json();
        if (res.ok) {
          setPreviewHtml(json.html);
          setIssues(json.issues ?? []);
        }
      } catch {
        /* preview is best-effort */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [draft]);

  async function save() {
    if (!draft) return;
    setError(null);

    if (draft.name.trim().length < 2) return setError("Give the template a name.");
    if (draft.subject.trim().length < 2) return setError("Add a subject line.");

    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        subject: draft.subject.trim(),
        preheader: draft.preheader.trim(),
        blocks: draft.blocks,
      };
      const res = await fetch(
        draft.id ? `/api/admin/email/templates/${draft.id}` : "/api/admin/email/templates",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't save this template");

      const saved: TemplateRow = {
        id: draft.id ?? json.id,
        ...payload,
        blockCount: draft.blocks.length,
        updatedAt: new Date().toISOString(),
      };
      setRows((r) => (draft.id ? r.map((x) => (x.id === draft.id ? saved : x)) : [saved, ...r]));
      setDraft(null);
      flash(draft.id ? `✓ Updated ${saved.name}` : `✓ Created ${saved.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: TemplateRow) {
    if (!confirm(`Delete the "${row.name}" template? Campaigns already created from it aren't affected.`)) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== row.id));
    try {
      const res = await fetch(`/api/admin/email/templates/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      flash(`Deleted ${row.name}`);
    } catch {
      setRows(prev);
      flash(`⚠ Couldn't delete ${row.name}`);
    }
  }

  if (draft) {
    return (
      <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        <div className="space-y-4 min-w-0">
          <div className="frosted-glass rounded-3xl p-5 sm:p-6">
            <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-3">
              {draft.id ? "Edit template" : "New template"}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="label">Template name</span>
                <input
                  className="input"
                  autoFocus
                  placeholder="Day-one logistics"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="label">What it&apos;s for (optional)</span>
                <input
                  className="input"
                  placeholder="Sent the Friday before each cohort"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>
            </div>
            <label className="block mt-4">
              <span className="label">Subject line</span>
              <input
                className="input"
                placeholder="Camp starts Monday — what to bring"
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              />
            </label>
            <label className="block mt-4">
              <span className="label">Preview text</span>
              <input
                className="input"
                placeholder="The grey line Gmail shows next to the subject"
                value={draft.preheader}
                onChange={(e) => setDraft({ ...draft, preheader: e.target.value })}
              />
            </label>
          </div>

          <BlockEditor
            blocks={draft.blocks}
            onChange={(blocks) => setDraft({ ...draft, blocks })}
            mergeFields={mergeFields}
            issues={issues}
          />
        </div>

        <div className="space-y-4 xl:sticky xl:top-6">
          <div className="frosted-glass rounded-3xl p-4">
            <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-3">Preview</div>
            <div className="rounded-2xl overflow-hidden border border-black/[.06] bg-neutral-100">
              <iframe title="Template preview" sandbox="" srcDoc={previewHtml} className="w-full h-[520px] bg-white" />
            </div>
          </div>

          <div className="frosted-glass rounded-3xl p-5">
            {error && <p className="text-[12.5px] text-pink-deep mb-3">⚠ {error}</p>}
            {issues.length > 0 && (
              <p className="text-[12.5px] text-pink-deep mb-3">
                ⚠ Fix {issues.length} {issues.length === 1 ? "problem" : "problems"} before saving.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setError(null);
                  setIssues([]);
                }}
                className="flex-1 text-[13px] font-semibold py-2.5 rounded-full border border-black/[.1] hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy || issues.length > 0}
                className="btn-dark flex-1 justify-center !text-sm !py-2.5 disabled:opacity-40"
              >
                {busy ? "Saving…" : "Save template"}
              </button>
            </div>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-5 right-5 z-50">
            <div className="frosted-glass-dark rounded-full px-4 py-2 text-[12px] font-semibold anim-fade-up">{toast}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => setDraft(blank())} className="btn-dark !text-sm">
        + New template
      </button>

      <div className="frosted-glass rounded-3xl p-5 sm:p-7">
        <div className="mb-4">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase">
            {rows.length} {rows.length === 1 ? "template" : "templates"}
          </div>
          <h2 className="font-display font-extrabold text-[18px] mt-0.5">Your content library</h2>
        </div>

        {rows.length === 0 ? (
          <p className="text-[13.5px] text-neutral-600 py-8 text-center max-w-sm mx-auto leading-relaxed">
            No templates yet. Save the emails you send every cohort — day-one logistics, the waitlist
            slot-opened notice — and reuse them instead of rewriting from scratch.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[13px] min-w-[600px]">
              <thead>
                <tr className="text-left text-[10.5px] font-bold tracking-[.14em] uppercase text-neutral-500 border-b border-black/[.06]">
                  <th className="py-2 pr-3">Template</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3 text-right">Blocks</th>
                  <th className="py-2 pr-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-black/[.04] last:border-0">
                    <td className="py-3 pr-3">
                      <div className="font-semibold">{t.name}</div>
                      {t.description && <div className="text-[11.5px] text-neutral-500 mt-0.5">{t.description}</div>}
                    </td>
                    <td className="py-3 pr-3 text-neutral-600 truncate max-w-[240px]" title={t.subject}>
                      {t.subject}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-neutral-600">{t.blockCount}</td>
                    <td className="py-3 pr-1 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDraft({ ...t, id: t.id })}
                        className="text-[11.5px] font-semibold text-violet-brand hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(t)}
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

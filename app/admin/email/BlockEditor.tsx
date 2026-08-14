"use client";

import { useState } from "react";

/**
 * The composer's block stack.
 *
 * Blocks are plain JSON — the server renders them, so what you build here is
 * exactly what sends. There is no rich-text state to get out of sync, and no
 * way to author markup that breaks in Outlook.
 */

export type EditorBlock =
  | { id: string; type: "heading"; eyebrow: string; text: string; level: 1 | 2; align: "left" | "center" }
  | { id: string; type: "text"; text: string; align: "left" | "center" }
  | { id: string; type: "button"; label: string; url: string; style: "dark" | "light"; align: "left" | "center" }
  | { id: string; type: "image"; url: string; alt: string; href: string; width: number }
  | { id: string; type: "list"; items: string[]; ordered: boolean }
  | {
      id: string;
      type: "callout";
      title: string;
      text: string;
      tone: "subtle" | "dark" | "violet" | "success" | "warning";
    }
  | { id: string; type: "divider" };

export type BlockType = EditorBlock["type"];

export interface MergeFieldInfo {
  key: string;
  label: string;
  description: string;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b${Date.now()}${Math.floor(Math.random() * 1e6)}`;

export function makeBlock(type: BlockType): EditorBlock {
  const id = newId();
  switch (type) {
    case "heading":
      return { id, type, eyebrow: "", text: "New heading", level: 2, align: "left" };
    case "text":
      return { id, type, text: "Write something here.", align: "left" };
    case "button":
      return { id, type, label: "Open my portal", url: "{{portalUrl}}", style: "dark", align: "center" };
    case "image":
      return { id, type, url: "https://", alt: "", href: "", width: 520 };
    case "list":
      return { id, type, items: ["First item"], ordered: false };
    case "callout":
      return { id, type, title: "", text: "Something worth highlighting.", tone: "subtle" };
    case "divider":
      return { id, type };
  }
}

const BLOCK_META: Record<BlockType, { label: string; hint: string }> = {
  heading: { label: "Heading", hint: "A section title, with an optional small kicker above it" },
  text: { label: "Paragraph", hint: "Body copy" },
  button: { label: "Button", hint: "A single call to action" },
  image: { label: "Image", hint: "Must be a public URL — email can't show local files" },
  list: { label: "List", hint: "Bulleted or numbered" },
  callout: { label: "Callout", hint: "A coloured box for the thing they mustn't miss" },
  divider: { label: "Divider", hint: "A horizontal rule" },
};

const TONES: Array<{ value: string; label: string }> = [
  { value: "subtle", label: "White" },
  { value: "dark", label: "Black" },
  { value: "violet", label: "Petrol" },
  { value: "success", label: "Green" },
  { value: "warning", label: "Amber" },
];

interface Props {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  mergeFields: MergeFieldInfo[];
  /** Editor-time problems from the server, keyed by block index. */
  issues: Array<{ index: number; message: string }>;
  disabled?: boolean;
}

export default function BlockEditor({ blocks, onChange, mergeFields, issues, disabled }: Props) {
  const [showFields, setShowFields] = useState(false);

  function update(index: number, patch: Partial<EditorBlock>) {
    onChange(blocks.map((b, i) => (i === index ? ({ ...b, ...patch } as EditorBlock) : b)));
  }
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function remove(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }
  function duplicate(index: number) {
    const copy = { ...blocks[index], id: newId() } as EditorBlock;
    onChange([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]);
  }
  function add(type: BlockType) {
    onChange([...blocks, makeBlock(type)]);
  }

  const issuesFor = (index: number) => issues.filter((i) => i.index === index);

  return (
    <div className="space-y-3">
      {/* merge field reference */}
      <div className="frosted-glass rounded-2xl p-4">
        <button
          type="button"
          onClick={() => setShowFields((s) => !s)}
          className="flex items-center justify-between w-full text-left"
        >
          <span>
            <span className="text-[10.5px] font-bold tracking-[.2em] text-violet-brand uppercase block">
              Personalisation
            </span>
            <span className="text-[13px] font-semibold">
              Insert a field like <code className="font-mono text-violet-brand">{"{{firstName}}"}</code>
            </span>
          </span>
          <span className="text-[11.5px] font-semibold text-neutral-500">{showFields ? "Hide" : "Show all"}</span>
        </button>

        {showFields && (
          <div className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 border-t border-black/[.06] pt-3">
            {mergeFields.map((f) => (
              <div key={f.key} className="text-[12px] leading-snug">
                <code className="font-mono text-[11.5px] text-violet-brand">{`{{${f.key}}}`}</code>
                <span className="text-neutral-500"> — {f.description}</span>
              </div>
            ))}
            <p className="sm:col-span-2 text-[11.5px] text-neutral-500 mt-1.5 pt-1.5 border-t border-black/[.04]">
              Formatting: <code className="font-mono">**bold**</code>,{" "}
              <code className="font-mono">*italic*</code>,{" "}
              <code className="font-mono">[label](https://…)</code>. Anything else is shown as plain text.
            </p>
          </div>
        )}
      </div>

      {blocks.map((block, index) => {
        const blockIssues = issuesFor(index);
        return (
          <div
            key={block.id}
            className={`frosted-glass rounded-2xl p-4 ${
              blockIssues.length ? "ring-2 ring-pink-deep/40" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10.5px] font-bold tracking-[.18em] text-violet-brand uppercase">
                  {BLOCK_META[block.type].label}
                </span>
                <span className="text-[11px] text-neutral-400 ml-2">{BLOCK_META[block.type].hint}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconBtn label="Move up" onClick={() => move(index, -1)} disabled={disabled || index === 0}>
                  ↑
                </IconBtn>
                <IconBtn
                  label="Move down"
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === blocks.length - 1}
                >
                  ↓
                </IconBtn>
                <IconBtn label="Duplicate" onClick={() => duplicate(index)} disabled={disabled}>
                  ⧉
                </IconBtn>
                <IconBtn label="Delete" onClick={() => remove(index)} disabled={disabled} danger>
                  ✕
                </IconBtn>
              </div>
            </div>

            <BlockFields block={block} index={index} update={update} disabled={disabled} />

            {blockIssues.map((issue, i) => (
              <p key={i} className="text-[12px] text-pink-deep mt-2">
                ⚠ {issue.message}
              </p>
            ))}
          </div>
        );
      })}

      {blocks.length === 0 && (
        <p className="text-[13px] text-neutral-500 text-center py-8 frosted-glass rounded-2xl">
          Empty email. Add a block below to get started.
        </p>
      )}

      {/* add block */}
      <div className="frosted-glass rounded-2xl p-4">
        <div className="text-[10.5px] font-bold tracking-[.2em] text-violet-brand uppercase mb-2.5">Add a block</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BLOCK_META) as BlockType[]).map((type) => (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => add(type)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-full bg-white border border-black/[.08] hover:border-violet-brand hover:text-violet-brand transition disabled:opacity-40"
            >
              + {BLOCK_META[type].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`w-7 h-7 rounded-lg text-[13px] leading-none flex items-center justify-center border border-black/[.08] bg-white transition disabled:opacity-25 disabled:cursor-not-allowed ${
        danger ? "hover:text-pink-deep hover:border-pink-deep" : "hover:text-violet-brand hover:border-violet-brand"
      }`}
    >
      {children}
    </button>
  );
}

function BlockFields({
  block,
  index,
  update,
  disabled,
}: {
  block: EditorBlock;
  index: number;
  update: (index: number, patch: Partial<EditorBlock>) => void;
  disabled?: boolean;
}) {
  const set = (patch: Partial<EditorBlock>) => update(index, patch);

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Kicker above the heading (optional)"
            value={block.eyebrow}
            disabled={disabled}
            onChange={(e) => set({ eyebrow: e.target.value } as Partial<EditorBlock>)}
          />
          <input
            className="input font-semibold"
            placeholder="Heading text"
            value={block.text}
            disabled={disabled}
            onChange={(e) => set({ text: e.target.value } as Partial<EditorBlock>)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Size"
              value={String(block.level)}
              disabled={disabled}
              onChange={(v) => set({ level: Number(v) as 1 | 2 } as Partial<EditorBlock>)}
              options={[
                { value: "1", label: "Large" },
                { value: "2", label: "Small" },
              ]}
            />
            <AlignSelect value={block.align} disabled={disabled} onChange={(align) => set({ align } as Partial<EditorBlock>)} />
          </div>
        </div>
      );

    case "text":
      return (
        <div className="space-y-3">
          <textarea
            className="input min-h-[110px] resize-y"
            placeholder="Body copy"
            value={block.text}
            disabled={disabled}
            onChange={(e) => set({ text: e.target.value } as Partial<EditorBlock>)}
          />
          <AlignSelect value={block.align} disabled={disabled} onChange={(align) => set({ align } as Partial<EditorBlock>)} />
        </div>
      );

    case "button":
      return (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Button label"
              value={block.label}
              disabled={disabled}
              onChange={(e) => set({ label: e.target.value } as Partial<EditorBlock>)}
            />
            <input
              className="input font-mono text-[12.5px]"
              placeholder="https://… or {{portalUrl}}"
              value={block.url}
              disabled={disabled}
              onChange={(e) => set({ url: e.target.value } as Partial<EditorBlock>)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Style"
              value={block.style}
              disabled={disabled}
              onChange={(v) => set({ style: v as "dark" | "light" } as Partial<EditorBlock>)}
              options={[
                { value: "dark", label: "Solid black" },
                { value: "light", label: "Outlined" },
              ]}
            />
            <AlignSelect value={block.align} disabled={disabled} onChange={(align) => set({ align } as Partial<EditorBlock>)} />
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <input
            className="input font-mono text-[12.5px]"
            placeholder="https://immersia.ng/photo.jpg"
            value={block.url}
            disabled={disabled}
            onChange={(e) => set({ url: e.target.value } as Partial<EditorBlock>)}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Alt text (shown if images are blocked)"
              value={block.alt}
              disabled={disabled}
              onChange={(e) => set({ alt: e.target.value } as Partial<EditorBlock>)}
            />
            <input
              className="input font-mono text-[12.5px]"
              placeholder="Link when clicked (optional)"
              value={block.href}
              disabled={disabled}
              onChange={(e) => set({ href: e.target.value } as Partial<EditorBlock>)}
            />
          </div>
          <label className="block">
            <span className="label">Width — {block.width}px</span>
            <input
              type="range"
              min={80}
              max={580}
              step={20}
              className="w-full"
              value={block.width}
              disabled={disabled}
              onChange={(e) => set({ width: Number(e.target.value) } as Partial<EditorBlock>)}
            />
          </label>
        </div>
      );

    case "list":
      return (
        <div className="space-y-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input"
                placeholder={`Item ${i + 1}`}
                value={item}
                disabled={disabled}
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = e.target.value;
                  set({ items } as Partial<EditorBlock>);
                }}
              />
              <IconBtn
                label="Remove item"
                danger
                disabled={disabled || block.items.length === 1}
                onClick={() => set({ items: block.items.filter((_, x) => x !== i) } as Partial<EditorBlock>)}
              >
                ✕
              </IconBtn>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => set({ items: [...block.items, ""] } as Partial<EditorBlock>)}
              className="text-[12px] font-semibold text-violet-brand hover:underline disabled:opacity-40"
            >
              + Add item
            </button>
            <label className="flex items-center gap-2 text-[12px] font-medium">
              <input
                type="checkbox"
                checked={block.ordered}
                disabled={disabled}
                onChange={(e) => set({ ordered: e.target.checked } as Partial<EditorBlock>)}
              />
              Numbered
            </label>
          </div>
        </div>
      );

    case "callout":
      return (
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Callout title (optional)"
            value={block.title}
            disabled={disabled}
            onChange={(e) => set({ title: e.target.value } as Partial<EditorBlock>)}
          />
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="Callout text"
            value={block.text}
            disabled={disabled}
            onChange={(e) => set({ text: e.target.value } as Partial<EditorBlock>)}
          />
          <Select
            label="Colour"
            value={block.tone}
            disabled={disabled}
            onChange={(v) => set({ tone: v as "subtle" } as Partial<EditorBlock>)}
            options={TONES}
          />
        </div>
      );

    case "divider":
      return <div className="border-t border-black/[.08] my-1" />;
  }
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AlignSelect({
  value,
  onChange,
  disabled,
}: {
  value: "left" | "center";
  onChange: (v: "left" | "center") => void;
  disabled?: boolean;
}) {
  return (
    <Select
      label="Align"
      value={value}
      disabled={disabled}
      onChange={(v) => onChange(v as "left" | "center")}
      options={[
        { value: "left", label: "Left" },
        { value: "center", label: "Centre" },
      ]}
    />
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "present" | "late" | "absent" | "excused";
type Attraction = "table-tennis" | "go-karting" | "pro-gaming";
type SaveState = "idle" | "saving" | "saved" | "error";

const STATUSES: Array<{ k: Status; label: string; cls: string; activeCls: string }> = [
  { k: "present", label: "Present", cls: "hover:bg-emerald-50", activeCls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { k: "late", label: "Late", cls: "hover:bg-amber-50", activeCls: "bg-amber-100 text-amber-900 border-amber-300" },
  { k: "absent", label: "Absent", cls: "hover:bg-rose-50", activeCls: "bg-rose-100 text-rose-900 border-rose-300" },
  { k: "excused", label: "Excused", cls: "hover:bg-neutral-100", activeCls: "bg-neutral-200 text-neutral-800 border-neutral-300" },
];

const ATTRACTIONS: Array<{ k: Attraction; label: string; activeCls: string }> = [
  { k: "table-tennis", label: "Table Tennis", activeCls: "bg-cyan-100 text-cyan-900 border-cyan-300" },
  { k: "go-karting", label: "Go Karting", activeCls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { k: "pro-gaming", label: "Pro Gaming", activeCls: "bg-violet-100 text-violet-900 border-violet-300" },
];

export default function TeacherRosterRow({
  registrationId,
  name,
  regCode,
  date,
  hasMedical,
  initialStatus,
  initialNote,
  initialAttraction,
}: {
  registrationId: string;
  name: string;
  regCode: string;
  date: string;
  hasMedical: boolean;
  initialStatus?: Status;
  initialNote?: string;
  initialAttraction?: Attraction;
}) {
  const [status, setStatus] = useState<Status | undefined>(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [state, setState] = useState<SaveState>("idle");
  const [attraction, setAttraction] = useState<Attraction | undefined>(initialAttraction);
  const [attrState, setAttrState] = useState<SaveState>("idle");

  async function save(nextStatus: Status, nextNote: string) {
    setState("saving");
    try {
      const r = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, date, status: nextStatus, note: nextNote || undefined }),
      });
      if (!r.ok) throw new Error("save failed");
      setState("saved");
      setTimeout(() => setState("idle"), 1200);
    } catch {
      setState("error");
    }
  }

  function pick(s: Status) {
    setStatus(s);
    void save(s, note);
  }

  function commitNote() {
    if (!status) return;
    void save(status, note);
  }

  async function pickAttraction(a: Attraction) {
    setAttraction(a);
    setAttrState("saving");
    try {
      const r = await fetch("/api/teacher/attraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, date, attraction: a }),
      });
      if (!r.ok) throw new Error("save failed");
      setAttrState("saved");
      setTimeout(() => setAttrState("idle"), 1200);
    } catch {
      setAttrState("error");
    }
  }

  return (
    <tr className="border-t border-black/[.05]">
      <td className="p-3">
        <Link href={`/teacher/campers/${registrationId}`} className="font-semibold hover:text-aqua-deep transition inline-flex items-center gap-1.5">
          {name}
          {hasMedical && <span title="Has medical notes" className="text-[10px]">🩺</span>}
        </Link>
        <div className="font-mono text-[11px] text-neutral-500 md:hidden">{regCode}</div>
      </td>
      <td className="p-3 font-mono text-[12px] text-neutral-600 hidden md:table-cell">{regCode}</td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const active = status === s.k;
            return (
              <button
                key={s.k}
                type="button"
                onClick={() => pick(s.k)}
                aria-pressed={active}
                className={`text-[11px] font-bold tracking-[.14em] uppercase border rounded-full px-3 py-1.5 transition ${
                  active ? s.activeCls : `border-neutral-200 text-neutral-600 ${s.cls}`
                }`}
              >
                {s.label}
              </button>
            );
          })}
          {state === "saving" && <span className="text-[10.5px] text-neutral-500 self-center ml-1">Saving…</span>}
          {state === "saved" && <span className="text-[10.5px] text-emerald-700 self-center ml-1">✓ Saved</span>}
          {state === "error" && <span className="text-[10.5px] text-rose-700 self-center ml-1">⚠ Try again</span>}
        </div>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1.5">
          {ATTRACTIONS.map((a) => {
            const active = attraction === a.k;
            return (
              <button
                key={a.k}
                type="button"
                onClick={() => pickAttraction(a.k)}
                aria-pressed={active}
                className={`text-[11px] font-bold tracking-[.14em] uppercase border rounded-full px-3 py-1.5 transition ${
                  active ? a.activeCls : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {a.label}
              </button>
            );
          })}
          {attrState === "saving" && <span className="text-[10.5px] text-neutral-500 self-center ml-1">Saving…</span>}
          {attrState === "saved" && <span className="text-[10.5px] text-emerald-700 self-center ml-1">✓ Saved</span>}
          {attrState === "error" && <span className="text-[10.5px] text-rose-700 self-center ml-1">⚠ Try again</span>}
        </div>
      </td>
      <td className="p-3 hidden lg:table-cell">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
          placeholder={status ? "Optional note…" : "Set a status first"}
          disabled={!status}
          maxLength={280}
          className="input !py-1.5 !text-[12.5px] disabled:opacity-50"
        />
      </td>
    </tr>
  );
}

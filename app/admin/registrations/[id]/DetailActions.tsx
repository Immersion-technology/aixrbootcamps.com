"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  registrationId: string;
  currentStatus: "pending" | "admitted" | "rejected";
  paymentStatus: string;
}

export default function DetailActions({ registrationId, currentStatus, paymentStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function updateStatus(status: "pending" | "admitted" | "rejected") {
    if (status === "rejected" && !confirm("Mark this registration as rejected?")) return;
    setBusy(status);
    try {
      const r = await fetch(`/api/admin/registrations/${registrationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (!r.ok) throw new Error("Failed");
      router.refresh();
      setNote("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function action(kind: "manual-payment" | "resend-email") {
    if (kind === "manual-payment" && !confirm("Mark this registration as manually paid?")) return;
    setBusy(kind);
    try {
      const r = await fetch(`/api/admin/registrations/${registrationId}/${kind}`, { method: "POST" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed");
      }
      router.refresh();
      alert(kind === "manual-payment" ? "Marked as paid" : "Confirmation email resent");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendInvite() {
    setBusy("invite");
    try {
      const r = await fetch(`/api/admin/parent-account/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      alert(`Login link emailed to ${j.name} <${j.email}>. It expires in 30 minutes.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="frosted-glass-dark rounded-2xl p-4 sm:p-5 sticky top-3 z-30 mb-8">
      <div className="text-[10px] font-bold tracking-[.22em] text-white/70 uppercase mb-3">Quick actions</div>
      <div className="flex flex-wrap gap-2.5 items-center">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for the status log…"
          className="flex-1 min-w-[180px] px-3.5 py-2 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 text-[12px] focus:outline-none focus:border-white/40 transition"
        />

        <ActionBtn
          onClick={() => updateStatus("admitted")}
          disabled={busy !== null || currentStatus === "admitted"}
          tone="mint"
          loading={busy === "admitted"}
        >
          ✓ Admit
        </ActionBtn>

        <ActionBtn
          onClick={() => updateStatus("rejected")}
          disabled={busy !== null}
          tone="pink"
          loading={busy === "rejected"}
        >
          ✕ Reject
        </ActionBtn>

        <ActionBtn
          onClick={() => updateStatus("pending")}
          disabled={busy !== null || currentStatus === "pending"}
          tone="ghost"
          loading={busy === "pending"}
        >
          Reset
        </ActionBtn>

        {paymentStatus !== "paid" ? (
          <ActionBtn
            onClick={() => action("manual-payment")}
            disabled={busy !== null}
            tone="yellow"
            loading={busy === "manual-payment"}
          >
            ₦ Mark as paid
          </ActionBtn>
        ) : (
          <ActionBtn
            onClick={() => action("resend-email")}
            disabled={busy !== null}
            tone="white"
            loading={busy === "resend-email"}
          >
            ✉ Resend confirmation
          </ActionBtn>
        )}

        <ActionBtn
          onClick={sendInvite}
          disabled={busy !== null}
          tone="cyan"
          loading={busy === "invite"}
        >
          🔑 Email login link
        </ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({
  children, onClick, disabled, tone, loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  tone: "mint" | "pink" | "ghost" | "yellow" | "white" | "cyan";
  loading: boolean;
}) {
  const toneCls = {
    mint: "bg-mint-soft text-ink hover:bg-mint-deep hover:text-white",
    pink: "bg-pink-soft text-ink hover:bg-pink-deep hover:text-white",
    yellow: "bg-yellow-soft text-ink hover:bg-yellow-deep",
    white: "bg-white text-ink hover:bg-violet-brand hover:text-white",
    ghost: "bg-white/10 text-white border border-white/15 hover:bg-white/20",
    cyan: "bg-aqua-soft text-ink hover:bg-aqua-brand hover:text-white",
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-full text-[11.5px] font-bold tracking-wider uppercase transition disabled:opacity-50 disabled:cursor-not-allowed",
        toneCls,
      )}
    >
      {loading ? "…" : children}
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function TeacherVerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const ran = useRef(false);
  const [status, setStatus] = useState<"verifying" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get("token");
    if (!token) {
      setMessage("This link is missing its token. Request a fresh one.");
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const r = await fetch("/api/teacher/login/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Could not sign you in");
        router.replace("/teacher");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not sign you in");
        setStatus("error");
      }
    })();
  }, [params, router]);

  return (
    <section className="px-5 sm:px-7 py-24">
      <div className="max-w-[440px] mx-auto text-center">
        {status === "verifying" ? (
          <>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full bg-aqua-brand inline-block anim-pulse" />
              <span className="text-[10.5px] font-bold tracking-[.2em] text-aqua-deep">SIGNING YOU IN</span>
            </div>
            <p className="text-[14px] text-neutral-700">One moment…</p>
          </>
        ) : (
          <>
            <div className="text-[40px] mb-3">⚠️</div>
            <h1 className="font-bubble text-[28px] tracking-tight text-ink mb-2">Link didn&apos;t work</h1>
            <p className="text-[14px] text-neutral-700 leading-relaxed mb-6">{message}</p>
            <Link href="/teacher/login" className="btn-grass">Request a new link →</Link>
          </>
        )}
      </div>
    </section>
  );
}

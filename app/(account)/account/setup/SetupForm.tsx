"use client";

import { useState } from "react";

export default function SetupForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/account/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Could not set password");
      window.location.href = "/account";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm password</label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input"
          placeholder="Same as above"
        />
      </div>

      {error && <p className="field-error">⚠ {error}</p>}

      <button type="submit" className="btn-grass w-full justify-center !py-3.5" disabled={submitting}>
        {submitting ? "Saving…" : <>Save and sign in <span aria-hidden>→</span></>}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Revenue stream 6 — the list. Phase 1 posts to a stub route; swapping in
 * ConvertKit/Resend later is a change to `/api/subscribe` only.
 */
export function EmailCapture({
  placement,
  label = "Get deal alerts",
  hint = "January and Black Friday equipment deals. No spam, unsubscribe anytime.",
}: {
  placement: "landing" | "planner" | "cart";
  label?: string;
  hint?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, placement }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setStatus("done");
      track({ name: "email_captured", placement });
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <p className="rounded-lg border border-ok/30 bg-okBg p-3 text-sm text-ok">
        You&apos;re on the list. Watch your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          className="field flex-1"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          aria-label="Email address"
        />
        <button
          type="submit"
          className="btn-accent shrink-0"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Adding…" : label}
        </button>
      </div>
      <p className={`text-xs ${status === "error" ? "text-danger" : "text-ink-500"}`}>
        {status === "error" ? "That email didn't look right — try again." : hint}
      </p>
    </form>
  );
}

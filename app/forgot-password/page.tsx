"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setResetLink(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to generate reset link");
      return;
    }

    setMsg(data?.message ?? "Reset link generated.");
    if (data?.resetLink) {
      setResetLink(data.resetLink);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Forgot Password</h1>
        <p className="mt-2 text-black/70">
          Enter your email to generate a password reset link.
        </p>
      </div>

      {msg && (
        <div className="rounded-md border border-black/10 bg-black/5 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-black/10 bg-white p-5"
      >
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Reset Link"}
        </button>
      </form>

      {resetLink && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
          <div className="font-medium">Development Reset Link</div>
          <a href={resetLink} className="mt-2 block break-all underline">
            {resetLink}
          </a>
        </div>
      )}
    </div>
  );
}
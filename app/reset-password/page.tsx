"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg("Missing reset token.");
      return;
    }

    if (!password || !confirmPassword) {
      setMsg("Please fill both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to reset password");
      return;
    }

    setMsg(data?.message ?? "Password reset successful.");

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Reset Password</h1>
        <p className="mt-2 text-black/70">Enter your new password below.</p>
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
          <label className="text-sm font-medium">New Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Confirm New Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md space-y-6 py-8">
          <div>
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="mt-2 text-black/70">Enter your new password below.</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
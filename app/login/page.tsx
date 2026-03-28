"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mergeGuestCartIntoUserCart } from "@/app/lib/cart";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Login failed");
      return;
    }
    mergeGuestCartIntoUserCart();
    window.dispatchEvent(new Event("auth-updated"));
    window.dispatchEvent(new Event("cart-updated"));
    router.push("/account");
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="mt-2 text-black/70">
          Sign in to view your orders and account details.
        </p>
      </div>

      {msg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <form
        onSubmit={handleLogin}
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

        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="flex justify-between text-sm text-black/70">
          <Link href="/forgot-password" className="underline">
            Forgot password?
          </Link>
          <Link href="/signup" className="underline">
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}
import fs from "fs";
import path from "path";

const root = process.cwd();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Wrote:", path.relative(root, filePath));
}

// 1) API route: /api/admin/login
writeFile(
  path.join(root, "app", "api", "admin", "login", "route.ts"),
  `import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = body?.email?.toString() ?? "";
  const password = body?.password?.toString() ?? "";

  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_JWT_SECRET ?? "";

  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_JWT_SECRET missing in .env.local" },
      { status: 500 }
    );
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));

  const res = NextResponse.json({ ok: true });

  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
`
);

// 2) Middleware to protect /admin/*
writeFile(
  path.join(root, "middleware.ts"),
  `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow admin login page and login API
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_token")?.value;
    const secret = process.env.ADMIN_JWT_SECRET ?? "";

    if (!token || !secret) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
`
);

// 3) Admin login page
writeFile(
  path.join(root, "app", "admin", "login", "page.tsx"),
  `"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Login failed");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <p className="mt-2 text-sm text-black/70">
        Use the credentials from <code>.env.local</code>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
`
);

// 4) Admin dashboard placeholder
writeFile(
  path.join(root, "app", "admin", "page.tsx"),
  `export default function AdminDashboard() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-black/70">Next: Home page content manager.</p>
    </div>
  );
}
`
);

console.log("\\nDone. If you haven't, add ADMIN_* vars to .env.local and restart dev server.");
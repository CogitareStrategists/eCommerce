import { NextResponse } from "next/server";
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

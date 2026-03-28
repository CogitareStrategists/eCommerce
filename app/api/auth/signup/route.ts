import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const full_name = (body?.full_name ?? "").toString().trim();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const res = await pool.query(
      `insert into users (full_name, email, password_hash)
       values ($1, $2, $3)
       returning id, full_name, email`,
      [full_name, email, hashed]
    );

    const user = res.rows[0];

    return NextResponse.json({ user });
  } catch (err: any) {
    const msg = (err?.message ?? "").toLowerCase();

    if (msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Signup failed", detail: err?.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = (body?.email ?? "").toString().trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const userRes = await pool.query(
      `select id, email
       from users
       where email = $1
       and is_active = true
       limit 1`,
      [email]
    );

    const user = userRes.rows[0];

    // Do not reveal whether email exists
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If this email exists, a reset link has been generated.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await pool.query(
      `insert into password_reset_tokens (user_id, token, expires_at)
       values ($1::uuid, $2, $3)`,
      [user.id, token, expiresAt]
    );

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    return NextResponse.json({
      ok: true,
      message: "Reset link generated.",
      resetLink,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to generate reset link",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
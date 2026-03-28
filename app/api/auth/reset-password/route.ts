import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const token = (body?.token ?? "").toString().trim();
    const password = (body?.password ?? "").toString();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    const tokenRes = await pool.query(
      `select id, user_id, expires_at, used_at
       from password_reset_tokens
       where token = $1
       limit 1`,
      [token]
    );

    const resetRow = tokenRes.rows[0];

    if (!resetRow) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    if (resetRow.used_at) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 }
      );
    }

    if (new Date(resetRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This reset link has expired" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query("begin");

    await pool.query(
      `update users
       set password_hash = $1
       where id = $2::uuid`,
      [passwordHash, resetRow.user_id]
    );

    await pool.query(
      `update password_reset_tokens
       set used_at = now()
       where id = $1::uuid`,
      [resetRow.id]
    );

    await pool.query("commit");

    return NextResponse.json({
      ok: true,
      message: "Password has been reset successfully.",
    });
  } catch (err: any) {
    try {
      await pool.query("rollback");
    } catch {}

    return NextResponse.json(
      {
        error: "Failed to reset password",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
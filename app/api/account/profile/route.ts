import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_token")?.value ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await pool.query(
      `select id, full_name, email, is_verified, is_active, created_at
       from users
       where id = $1::uuid
       limit 1`,
      [userId]
    );

    const user = res.rows[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load profile",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_token")?.value ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const full_name = (body?.full_name ?? "").toString().trim();

    if (!full_name) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      `update users
       set full_name = $1
       where id = $2::uuid
       returning id, full_name, email, is_verified, is_active, created_at`,
      [full_name, userId]
    );

    const user = res.rows[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to update profile",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
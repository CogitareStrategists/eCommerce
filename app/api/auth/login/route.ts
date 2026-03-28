import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      `select id, full_name, email, password_hash
       from users
       where email = $1
       limit 1`,
      [email]
    );

    const user = res.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
    });

    // set session cookie
    response.cookies.set("user_token", user.id, {
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Login failed", detail: err?.message },
      { status: 500 }
    );
  }
}
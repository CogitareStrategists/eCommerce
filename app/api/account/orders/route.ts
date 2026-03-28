import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_token")?.value ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const res = await pool.query(
      `select
        id,
        order_number,
        total_amount,
        payment_status,
        order_status,
        created_at
       from orders
       where user_id = $1::uuid
       order by created_at desc`,
      [userId]
    );

    return NextResponse.json({ orders: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load orders",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      `select
        id,
        order_number,
        customer_name,
        customer_email,
        total_amount,
        payment_status,
        order_status,
        created_at
       from orders
       order by created_at desc`
    );

    return NextResponse.json({ orders: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load orders", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

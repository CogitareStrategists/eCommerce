import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const customer_email = (body?.customer_email ?? "").toString().trim();

    if (!customer_email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const ordersRes = await pool.query(
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
       where lower(customer_email) = lower($1)
       order by created_at desc`,
      [customer_email]
    );

    const orders = ordersRes.rows;

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "No orders found for this email" },
        { status: 404 }
      );
    }

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to track orders",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
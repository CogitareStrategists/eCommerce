import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const orderRes = await pool.query(
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
       where id = $1::uuid
       limit 1`,
      [id]
    );

    const order = orderRes.rows[0];
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const itemsRes = await pool.query(
      `select
        id,
        product_name,
        variant_label,
        unit_price,
        quantity,
        line_total
       from order_items
       where order_id = $1::uuid
       order by created_at asc`,
      [id]
    );

    return NextResponse.json({
      order,
      items: itemsRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load order",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
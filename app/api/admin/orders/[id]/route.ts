import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed"];

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
        customer_phone,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        subtotal,
        shipping_amount,
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
      { error: "Failed to load order", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    const order_status = (body?.order_status ?? "").toString().trim().toLowerCase();
    const payment_status = (body?.payment_status ?? "").toString().trim().toLowerCase();

    if (!ORDER_STATUSES.includes(order_status)) {
      return NextResponse.json(
        { error: "Invalid order_status" },
        { status: 400 }
      );
    }

    if (!PAYMENT_STATUSES.includes(payment_status)) {
      return NextResponse.json(
        { error: "Invalid payment_status" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      `update orders
       set order_status = $1,
           payment_status = $2
       where id = $3::uuid
       returning id, order_status, payment_status`,
      [order_status, payment_status, id]
    );

    const order = res.rows[0];
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update order", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

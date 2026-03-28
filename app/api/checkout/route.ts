import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";
import { cookies } from "next/headers";

type CheckoutItem = {
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
};

function makeOrderNumber() {
  const rand = crypto.randomInt(100000, 999999);
  return `ORD${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const cookieStore = await cookies();
    const user_id = cookieStore.get("user_token")?.value ?? null;

    const customer_name = (body?.customer_name ?? "").toString().trim();
    const customer_email = (body?.customer_email ?? "").toString().trim();
    const customer_phone = (body?.customer_phone ?? "").toString().trim();

    const shipping_address_line1 = (body?.shipping_address_line1 ?? "")
      .toString()
      .trim();
    const shipping_address_line2 = (body?.shipping_address_line2 ?? "")
      .toString()
      .trim();
    const shipping_city = (body?.shipping_city ?? "").toString().trim();
    const shipping_state = (body?.shipping_state ?? "").toString().trim();
    const shipping_postal_code = (body?.shipping_postal_code ?? "")
      .toString()
      .trim();
    const shipping_country = (body?.shipping_country ?? "India")
      .toString()
      .trim();

    const razorpay_order_id = (body?.razorpay_order_id ?? "").toString().trim();
    const razorpay_payment_id = (body?.razorpay_payment_id ?? "").toString().trim();
    const razorpay_signature = (body?.razorpay_signature ?? "").toString().trim();

    const items = Array.isArray(body?.items) ? (body.items as CheckoutItem[]) : [];

    if (
      !customer_name ||
      !customer_email ||
      !shipping_address_line1 ||
      !shipping_city ||
      !shipping_state ||
      !shipping_postal_code ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required checkout fields or cart is empty" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
    const shipping_amount = 0;
    const total_amount = subtotal + shipping_amount;

    const order_number = makeOrderNumber();

    await pool.query("begin");

    const orderRes = await pool.query(
      `insert into orders (
        user_id,
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
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'paid','placed',$15,$16,$17
      )
      returning id, order_number`,
      [
        user_id,
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
        razorpay_order_id || null,
        razorpay_payment_id || null,
        razorpay_signature || null,
      ]
    );

    const order = orderRes.rows[0];

    for (const item of items) {
      const variantRes = await pool.query(
        `select v.id, v.product_id
         from product_variants v
         where v.id = $1::uuid
         limit 1`,
        [item.variantId]
      );

      const variant = variantRes.rows[0] ?? null;

      await pool.query(
        `insert into order_items (
          order_id,
          product_id,
          variant_id,
          product_name,
          variant_label,
          unit_price,
          quantity,
          line_total
        ) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          order.id,
          variant?.product_id ?? null,
          item.variantId,
          item.productName,
          item.variantLabel,
          Number(item.price),
          Number(item.quantity),
          Number(item.price) * Number(item.quantity),
        ]
      );
    }

    await pool.query("commit");

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (err: any) {
    try {
      await pool.query("rollback");
    } catch {}

    return NextResponse.json(
      {
        error: "Failed to place order",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import crypto from "crypto";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Only handle successful payment
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const razorpay_payment_id = payment.id;
      const razorpay_order_id = payment.order_id;

      // Update order if exists
      await pool.query(
        `update orders
         set payment_status = 'paid'
         where razorpay_order_id = $1`,
        [razorpay_order_id]
      );

      console.log("Webhook: payment captured", razorpay_payment_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Webhook failed",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
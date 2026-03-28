import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body ?? {};

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Razorpay secret" },
        { status: 500 }
      );
    }

    const bodyString = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyString)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Payment verified successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Verification failed",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
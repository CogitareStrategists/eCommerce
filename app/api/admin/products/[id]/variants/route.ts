import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);

    const label = (body?.label ?? "").toString().trim();
    const price = Number(body?.price ?? 0);
    const discount_percent = Number(body?.discount_percent ?? 0);
    const stock_qty = Number(body?.stock_qty ?? 0);
    const sku = (body?.sku ?? "").toString().trim() || null;
    const is_active = body?.is_active !== false;

    if (!label || !(price >= 0)) {
      return NextResponse.json({ error: "label and price are required" }, { status: 400 });
    }

    const res = await pool.query(
      `insert into product_variants
        (product_id, label, price, discount_percent, stock_qty, sku, is_active)
       values
        ($1::uuid, $2, $3, $4, $5, $6, $7)
       returning id, label, price, discount_percent, stock_qty, sku, is_active`,
      [id, label, price, discount_percent, stock_qty, sku, is_active]
    );

    return NextResponse.json({ variant: res.rows[0] });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create variant", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

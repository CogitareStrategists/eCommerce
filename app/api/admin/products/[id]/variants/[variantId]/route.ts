import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;

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
      `update product_variants
       set label=$1,
           price=$2,
           discount_percent=$3,
           stock_qty=$4,
           sku=$5,
           is_active=$6
       where id=$7::uuid
         and product_id=$8::uuid
       returning id, label, price, discount_percent, stock_qty, sku, is_active`,
      [label, price, discount_percent, stock_qty, sku, is_active, variantId, id]
    );

    const variant = res.rows[0];
    if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ variant });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update variant", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;

  try {
    const res = await pool.query(
      `delete from product_variants
       where id=$1::uuid
         and product_id=$2::uuid
       returning id`,
      [variantId, id]
    );

    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete variant", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);

    const image_url = (body?.image_url ?? "").toString().trim();
    const sort_order = Number(body?.sort_order ?? 0);
    const is_primary = body?.is_primary === true;

    if (!image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }

    await pool.query("begin");

    if (is_primary) {
      await pool.query(
        `update product_images
         set is_primary = false
         where product_id = $1::uuid`,
        [id]
      );
    }

    const res = await pool.query(
      `insert into product_images (product_id, image_url, sort_order, is_primary)
       values ($1::uuid, $2, $3, $4)
       returning id, image_url, sort_order, is_primary`,
      [id, image_url, sort_order, is_primary]
    );

    await pool.query("commit");

    return NextResponse.json({ image: res.rows[0] });
  } catch (err: any) {
    try { await pool.query("rollback"); } catch {}
    return NextResponse.json(
      { error: "Failed to add image", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

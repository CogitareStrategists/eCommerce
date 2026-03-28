import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;

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
      `update product_images
       set image_url=$1, sort_order=$2, is_primary=$3
       where id=$4::uuid and product_id=$5::uuid
       returning id, image_url, sort_order, is_primary`,
      [image_url, sort_order, is_primary, imageId, id]
    );

    await pool.query("commit");

    const image = res.rows[0];
    if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ image });
  } catch (err: any) {
    try { await pool.query("rollback"); } catch {}
    return NextResponse.json(
      { error: "Failed to update image", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;

  try {
    const res = await pool.query(
      `delete from product_images
       where id=$1::uuid and product_id=$2::uuid
       returning id`,
      [imageId, id]
    );

    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete image", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

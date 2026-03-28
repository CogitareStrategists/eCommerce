import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [pRes, imgRes, vRes] = await Promise.all([
      pool.query(`select * from products where id = $1::uuid`, [id]),
      pool.query(
        `select id, image_url, sort_order, is_primary
         from product_images
         where product_id = $1::uuid
         order by is_primary desc, sort_order asc`,
        [id]
      ),
      pool.query(
        `select id, label, price, discount_percent, stock_qty, sku, is_active
         from product_variants
         where product_id = $1::uuid
         order by created_at asc`,
        [id]
      ),
    ]);

    const product = pRes.rows[0];
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      product,
      images: imgRes.rows,
      variants: vRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load product", detail: err?.message ?? String(err) },
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

    const category_id = body?.category_id || null;
    const name = (body?.name ?? "").toString().trim();
    const slug = (body?.slug ?? "").toString().trim();

    const description = (body?.description ?? "").toString();
    const ingredients = (body?.ingredients ?? "").toString();
    const benefits = (body?.benefits ?? "").toString();
    const how_to_use = (body?.how_to_use ?? "").toString();
    const is_active = body?.is_active !== false;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    const res = await pool.query(
      `update products
       set category_id = $1::uuid,
           name = $2,
           slug = $3,
           description = $4,
           ingredients = $5,
           benefits = $6,
           how_to_use = $7,
           is_active = $8
       where id = $9::uuid
       returning *`,
      [category_id, name, slug, description, ingredients, benefits, how_to_use, is_active, id]
    );

    const product = res.rows[0];
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ product });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update product", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await pool.query(
      `delete from products where id = $1::uuid returning id`,
      [id]
    );
    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete product", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

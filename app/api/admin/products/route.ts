import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      `select
        p.id, p.name, p.slug, p.is_active,
        p.category_id,
        c.name as category_name
      from products p
      left join categories c on c.id = p.category_id
      order by p.created_at desc`
    );
    return NextResponse.json({ products: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load products", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
      `insert into products
        (category_id, name, slug, description, ingredients, benefits, how_to_use, is_active)
       values
        ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [category_id, name, slug, description, ingredients, benefits, how_to_use, is_active]
    );

    return NextResponse.json({ product: res.rows[0] });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create product", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

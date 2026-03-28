import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await pool.query(
    `select id, name, slug, is_active
     from categories
     where id = $1::uuid`,
    [id]
  );

  const category = res.rows[0];
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ category });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const name = (body?.name ?? "").toString().trim();
  const slug = (body?.slug ?? "").toString().trim();
  const is_active = body?.is_active !== false;

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }

  const res = await pool.query(
    `update categories
     set name=$1, slug=$2, is_active=$3
     where id=$4::uuid
     returning id, name, slug, is_active`,
    [name, slug, is_active, id]
  );

  const category = res.rows[0];
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ category });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await pool.query(
    `update products
     set category_id = null
     where category_id = $1::uuid`,
    [id]
  );

  const res = await pool.query(
    `delete from categories
     where id=$1::uuid
     returning id`,
    [id]
  );

  if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

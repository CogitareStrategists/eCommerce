import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await pool.query(
    `select * from concerns where id=$1::uuid`,
    [id]
  );
  if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ row: res.rows[0] });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const res = await pool.query(
    `update concerns
     set title=$1, image_url=$2, filter_key=$3, is_active=$4
     where id=$5::uuid
     returning *`,
    [body.title, body.image_url, body.filter_key, body.is_active !== false, id]
  );

  if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ row: res.rows[0] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await pool.query(`delete from concerns where id=$1::uuid`, [id]);
  return NextResponse.json({ ok: true });
}

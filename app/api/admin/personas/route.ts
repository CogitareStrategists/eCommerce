import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      `select id, title, image_url, filter_key, is_active, show_on_home, home_order
       from personas
       order by home_order asc, title asc`
    );
    return NextResponse.json({ rows: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load personas", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const title = (body?.title ?? "").toString().trim();
    const image_url = (body?.image_url ?? "").toString().trim();
    const filter_key = (body?.filter_key ?? "").toString().trim();
    const is_active = body?.is_active !== false;

    if (!title || !image_url || !filter_key) {
      return NextResponse.json(
        { error: "title, image_url, filter_key are required" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      `insert into personas (title, image_url, filter_key, is_active)
       values ($1,$2,$3,$4)
       returning id, title, image_url, filter_key, is_active, show_on_home, home_order`,
      [title, image_url, filter_key, is_active]
    );

    return NextResponse.json({ row: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create persona", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
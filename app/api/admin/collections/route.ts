import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      `select id, name, slug, image_url, is_active
       from collections
       order by name asc`
    );
    return NextResponse.json({ collections: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load collections", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = (body?.name ?? "").toString().trim();
    const slug = (body?.slug ?? "").toString().trim();
    const image_url = (body?.image_url ?? "").toString().trim();
    const is_active = body?.is_active !== false;

    if (!name || !slug || !image_url) {
      return NextResponse.json(
        { error: "name, slug, image_url are required" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      `insert into collections (name, slug, image_url, is_active)
       values ($1, $2, $3, $4)
       returning id, name, slug, image_url, is_active`,
      [name, slug, image_url, is_active]
    );

    return NextResponse.json({ collection: res.rows[0] });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Slug already exists. Use a different slug." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create collection", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
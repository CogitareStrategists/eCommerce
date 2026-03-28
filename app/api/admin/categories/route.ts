import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      `select id, name, slug, is_active
       from categories
       order by name asc`
    );
    return NextResponse.json({ categories: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load categories", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = (body?.name ?? "").toString().trim();
    const slug = (body?.slug ?? "").toString().trim();
    const is_active = body?.is_active !== false;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug required" }, { status: 400 });
    }

    const res = await pool.query(
      `insert into categories (name, slug, is_active)
       values ($1, $2, $3)
       returning id, name, slug, is_active`,
      [name, slug, is_active]
    );

    return NextResponse.json({ category: res.rows[0] });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create category", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * GET single collection
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await pool.query(
      `select id, name, slug, image_url, is_active
       from collections
       where id = $1::uuid`,
      [id]
    );

    const collection = res.rows[0];

    if (!collection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load collection",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

/**
 * UPDATE collection
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
      `update collections
       set name = $1,
           slug = $2,
           image_url = $3,
           is_active = $4
       where id = $5::uuid
       returning id, name, slug, image_url, is_active`,
      [name, slug, image_url, is_active, id]
    );

    const collection = res.rows[0];

    if (!collection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();

    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Slug already exists. Use a different slug." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update collection",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE collection
 */
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await pool.query("begin");

    // Remove from home sections first
    await pool.query(
      `delete from home_section_items
       where item_type = 'collection'
       and ref_id = $1::uuid`,
      [id]
    );

    const res = await pool.query(
      `delete from collections
       where id = $1::uuid
       returning id`,
      [id]
    );

    await pool.query("commit");

    if (!res.rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try {
      await pool.query("rollback");
    } catch {}

    return NextResponse.json(
      {
        error: "Failed to delete collection",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const sectionRes = await pool.query(
      `select id from home_sections where key = 'collections' limit 1`
    );
    const sectionId = sectionRes.rows?.[0]?.id;
    if (!sectionId) {
      return NextResponse.json({ error: "Section 'collections' not found" }, { status: 404 });
    }

    const [allCollectionsRes, selectedRes] = await Promise.all([
      pool.query(`select id, name, slug, image_url from collections where is_active = true order by name asc`),
      pool.query(
        `select ref_id, display_order
         from home_section_items
         where section_id = $1
         and item_type = 'collection'
         and is_active = true`,
        [sectionId]
      ),
    ]);

    const selectedMap = new Map<string, number>();
    for (const row of selectedRes.rows) selectedMap.set(row.ref_id, row.display_order);

    const collections = allCollectionsRes.rows.map((c: any) => ({
      ...c,
      selected: selectedMap.has(c.id),
      display_order: selectedMap.get(c.id) ?? 0,
    }));

    return NextResponse.json({ sectionId, collections });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load collections editor data", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const sectionId = body?.sectionId;
    const items = body?.items;

    if (!sectionId || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Replace items for this section (simple + safe)
    await pool.query("begin");

    await pool.query(
      `delete from home_section_items
        where section_id = $1
        and item_type = 'collection'`,
      [sectionId]
    );

    // Insert selected items only
    const selected = items
      .filter((i: any) => i.selected === true)
      .map((i: any) => ({
        ref_id: i.id,
        display_order: Number(i.display_order) || 0,
      }))
      .sort((a: any, b: any) => a.display_order - b.display_order);

    for (const s of selected) {
      await pool.query(
        `insert into home_section_items (section_id, item_type, ref_id, display_order, is_active)
          values ($1, 'collection', $2, $3, true)`,
        [sectionId, s.ref_id, s.display_order]
      );
    }

    await pool.query("commit");
    return NextResponse.json({ ok: true, saved: selected.length });
  } catch (err: any) {
    try {
      await pool.query("rollback");
    } catch {}
    return NextResponse.json(
      { error: "Failed to save collections section", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

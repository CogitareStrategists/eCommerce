import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const SECTION_KEY = 'popular_products';
const ITEM_TYPE = 'product';

export async function GET() {
  try {
    const sectionRes = await pool.query(
      `select id from home_sections where key = $1 limit 1`,
      [SECTION_KEY]
    );
    const sectionId = sectionRes.rows?.[0]?.id;
    if (!sectionId) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const [allRes, selectedRes] = await Promise.all([
      pool.query(`select id, name, slug, price from products where is_active = true order by name asc`),
      pool.query(
        `select ref_id, display_order
         from home_section_items
         where section_id = $1
         and item_type = $2
         and is_active = true`,
        [sectionId, ITEM_TYPE]
      ),
    ]);

    const selectedMap = new Map();
    for (const row of selectedRes.rows)
      selectedMap.set(row.ref_id, row.display_order);

    const items = allRes.rows.map((p) => ({
      ...p,
      selected: selectedMap.has(p.id),
      display_order: selectedMap.get(p.id) ?? 0,
    }));

    return NextResponse.json({ sectionId, items });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sectionId, items } = body;

    await pool.query("begin");

    await pool.query(
      `delete from home_section_items
        where section_id = $1
        and item_type = $2`,
      [sectionId, ITEM_TYPE]
    );

    const selected = items
      .filter((i) => i.selected)
      .map((i) => ({
        ref_id: i.id,
        display_order: Number(i.display_order) || 0,
      }))
      .sort((a, b) => a.display_order - b.display_order);

    for (const s of selected) {
      await pool.query(
        `insert into home_section_items
         (section_id, item_type, ref_id, display_order, is_active)
         values ($1, $2, $3, $4, true)`,
        [sectionId, ITEM_TYPE, s.ref_id, s.display_order]
      );
    }

    await pool.query("commit");
    return NextResponse.json({ ok: true, saved: selected.length });
  } catch (err) {
    await pool.query("rollback");
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

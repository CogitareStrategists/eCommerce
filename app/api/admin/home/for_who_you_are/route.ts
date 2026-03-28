import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

async function getSectionId() {
  const s = await pool.query(
    `select id from home_sections where key = $1 limit 1`,
    ["for_who_you_are"]
  );
  return s.rows[0]?.id ?? null;
}

export async function GET() {
  try {
    const sectionId = await getSectionId();
    if (!sectionId) {
      return NextResponse.json({ error: "Home section not found: for_who_you_are" }, { status: 404 });
    }

    const [allRes, selectedRes] = await Promise.all([
      pool.query(`select * from personas where is_active = true order by title asc`),
      pool.query(
        `select ref_id, display_order
         from home_section_items
         where section_id = $1::uuid
           and item_type = $2
           and is_active = true
         order by display_order asc`,
        [sectionId, "persona"]
      ),
    ]);

    return NextResponse.json({
      sectionKey: "for_who_you_are",
      all: allRes.rows,
      selected: selectedRes.rows, // [{ref_id, display_order}]
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load selector data", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

// Update selection + order
// body.items: [{ id: uuid, display_order: number }]
export async function POST(req: Request) {
  try {
    const sectionId = await getSectionId();
    if (!sectionId) {
      return NextResponse.json({ error: "Home section not found: for_who_you_are" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const items = Array.isArray(body?.items) ? body.items : [];

    await pool.query("begin");

    // deactivate existing items for this section+type
    await pool.query(
      `update home_section_items
       set is_active = false
       where section_id = $1::uuid and item_type = $2`,
      [sectionId, "persona"]
    );

    // upsert selected items as active with order
    for (const it of items) {
      const ref_id = (it?.id ?? "").toString();
      const display_order = Number(it?.display_order ?? 0);

      if (!ref_id) continue;

      // Try update first
      const upd = await pool.query(
        `update home_section_items
         set is_active = true, display_order = $1
         where section_id = $2::uuid
           and item_type = $3
           and ref_id = $4::uuid`,
        [display_order, sectionId, "persona", ref_id]
      );

      // If nothing updated, insert
      if (upd.rowCount === 0) {
        await pool.query(
          `insert into home_section_items (section_id, item_type, ref_id, display_order, is_active)
           values ($1::uuid, $2, $3::uuid, $4, true)`,
          [sectionId, "persona", ref_id, display_order]
        );
      }
    }

    await pool.query("commit");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try { await pool.query("rollback"); } catch {}
    return NextResponse.json(
      { error: "Failed to save selection", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

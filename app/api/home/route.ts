import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const sectionsRes = await pool.query(
      `select id, key, title, is_enabled, display_order
       from home_sections
       where is_enabled = true
       order by display_order asc`
    );

    const sections = sectionsRes.rows ?? [];

    if (sections.length === 0) {
      return NextResponse.json({ sections: [] });
    }

    const sectionIds = sections.map((s: any) => s.id);

    const itemsRes = await pool.query(
      `select section_id, item_type, ref_id, display_order
       from home_section_items
       where is_active = true
         and section_id = any($1::uuid[])
       order by section_id asc, display_order asc`,
      [sectionIds]
    );

    const [
      collectionsRes,
      productsRes,
      personasRes,
      concernsRes,
      videosRes,
      testimonialsRes,
    ] = await Promise.all([
      pool.query(`select * from collections where is_active = true`),
      pool.query(`select * from products where is_active = true`),
      pool.query(`select * from personas where is_active = true`),
      pool.query(`select * from concerns where is_active = true`),
      pool.query(`select * from videos where is_active = true`),
      pool.query(`select * from testimonials where is_active = true`),
    ]);

    const mapById = (rows: any[]) =>
      new Map(rows.map((r) => [r.id, r] as const));

    const colMap = mapById(collectionsRes.rows);
    const prodMap = mapById(productsRes.rows);
    const personaMap = mapById(personasRes.rows);
    const concernMap = mapById(concernsRes.rows);
    const videoMap = mapById(videosRes.rows);
    const testiMap = mapById(testimonialsRes.rows);

    const itemsBySection = new Map<string, any[]>();

    for (const item of itemsRes.rows) {
      const list = itemsBySection.get(item.section_id) ?? [];
      let data: any = null;

      if (item.item_type === "collection") data = colMap.get(item.ref_id) ?? null;
      if (item.item_type === "product") data = prodMap.get(item.ref_id) ?? null;
      if (item.item_type === "persona") data = personaMap.get(item.ref_id) ?? null;
      if (item.item_type === "concern") data = concernMap.get(item.ref_id) ?? null;
      if (item.item_type === "video") data = videoMap.get(item.ref_id) ?? null;
      if (item.item_type === "testimonial") data = testiMap.get(item.ref_id) ?? null;

      if (!data) continue;

      list.push({
        type: item.item_type,
        order: item.display_order,
        data,
      });

      itemsBySection.set(item.section_id, list);
    }

    const payload = sections.map((s: any) => ({
      key: s.key,
      title: s.title,
      items: itemsBySection.get(s.id) ?? [],
    }));

    return NextResponse.json({ sections: payload });
  } catch (err: any) {
    console.error("API /api/home failed:", err);

    return NextResponse.json(
      {
        error: "Failed to load home data",
        detail:
          err?.message ||
          err?.detail ||
          err?.code ||
          "Unknown server error",
      },
      { status: 500 }
    );
  }
}
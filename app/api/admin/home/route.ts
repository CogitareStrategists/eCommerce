import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      `select
        s.id,
        s.key,
        s.title,
        s.is_enabled,
        s.display_order,
        (
          select count(*)
          from home_section_items i
          where i.section_id = s.id
          and i.is_active = true
        ) as item_count
      from home_sections s
      order by s.display_order asc`
    );

    return NextResponse.json({ sections: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load admin home sections", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      `select id, name, slug, image_url
       from collections
       where is_active = true
       order by name asc`
    );

    return NextResponse.json({ collections: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load collections",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
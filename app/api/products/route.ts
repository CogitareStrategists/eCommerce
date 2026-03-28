import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(`
      select 
        p.id,
        p.name,
        p.slug,

        -- lowest price
        min(v.price) as price,

        -- max discount
        max(v.discount_percent) as discount_percent,

        -- primary image
        (
          select image_url
          from product_images pi
          where pi.product_id = p.id
          order by is_primary desc, sort_order asc
          limit 1
        ) as image_url

      from products p
      left join product_variants v on v.product_id = p.id and v.is_active = true

      where p.is_active = true
      group by p.id
      order by p.name asc
    `);

    return NextResponse.json({ products: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load products",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
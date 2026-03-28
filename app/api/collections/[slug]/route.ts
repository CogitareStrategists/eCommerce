import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const collectionRes = await pool.query(
      `select id, name, slug, image_url
       from collections
       where slug = $1
       and is_active = true`,
      [slug]
    );

    const collection = collectionRes.rows[0];

    if (!collection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const productsRes = await pool.query(`
      select 
        p.id,
        p.name,
        p.slug,

        min(v.price) as price,
        max(v.discount_percent) as discount_percent,

        (
          select image_url
          from product_images pi
          where pi.product_id = p.id
          order by is_primary desc, sort_order asc
          limit 1
        ) as image_url

      from products p
      left join product_variants v 
        on v.product_id = p.id and v.is_active = true

      where p.collection_id = $1::uuid
      and p.is_active = true

      group by p.id
      order by p.name asc
    `, [collection.id]);

    return NextResponse.json({
      collection,
      products: productsRes.rows,
    });
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
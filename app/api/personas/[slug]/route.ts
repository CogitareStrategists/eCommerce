import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const personaRes = await pool.query(
      `select id, title, image_url
       from personas
       where filter_key = $1
       and is_active = true
       limit 1`,
      [slug]
    );

    const persona = personaRes.rows[0];

    if (!persona) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const productsRes = await pool.query(
      `select
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
       join product_personas pp on pp.product_id = p.id
       left join product_variants v
         on v.product_id = p.id and v.is_active = true
       where pp.persona_id = $1::uuid
       and p.is_active = true
       group by p.id
       order by p.name asc`,
      [persona.id]
    );

    return NextResponse.json({
      persona,
      products: productsRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load persona",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
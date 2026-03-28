import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const productRes = await pool.query(
      `select
         p.id,
         p.name,
         p.slug,
         p.description,
         p.ingredients,
         p.benefits,
         p.how_to_use,
         p.is_active,
         c.name as category_name
       from products p
       left join categories c on c.id = p.category_id
       where p.slug = $1
       and p.is_active = true
       limit 1`,
      [slug]
    );

    const product = productRes.rows[0];

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [imagesRes, variantsRes, reviewsRes] = await Promise.all([
      pool.query(
        `select id, image_url, sort_order, is_primary
         from product_images
         where product_id = $1::uuid
         order by is_primary desc, sort_order asc`,
        [product.id]
      ),
      pool.query(
        `select
           id,
           label,
           price,
           discount_percent,
           stock_qty,
           sku,
           is_active
         from product_variants
         where product_id = $1::uuid
         and is_active = true
         order by created_at asc`,
        [product.id]
      ),
      pool.query(
        `select
           id,
           reviewer_name,
           rating,
           title,
           body,
           created_at
         from product_reviews
         where product_id = $1::uuid
         and is_approved = true
         order by created_at desc`,
        [product.id]
      ),
    ]);

    return NextResponse.json({
      product,
      images: imagesRes.rows,
      variants: variantsRes.rows,
      reviews: reviewsRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load product",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET /api/public/products/cards
// Optional query:
//   ids=uuid,uuid,uuid   -> only those products (keeps ordering)
//   limit=24             -> default 24
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");
    const limitParam = url.searchParams.get("limit");

    const limit = Math.max(1, Math.min(Number(limitParam ?? 24), 100));

    // Parse IDs (if provided)
    const ids = (idsParam ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // If ids provided, we preserve order using array_position
    const useIds = ids.length > 0;

    const query = useIds
      ? `
      with requested as (
        select unnest($1::uuid[]) as id
      ),
      card as (
        select
          p.id,
          p.name,
          p.slug,
          p.is_active,

          -- primary image (if any)
          (
            select pi.image_url
            from product_images pi
            where pi.product_id = p.id
            order by pi.is_primary desc, pi.sort_order asc
            limit 1
          ) as primary_image_url,

          -- starting price = minimum final price among active variants
          (
            select min(
              round(
                (v.price * (1 - (coalesce(v.discount_percent, 0) / 100.0)))::numeric
              , 2)
            )
            from product_variants v
            where v.product_id = p.id
              and v.is_active = true
          ) as starting_price,

          -- show discount flag if any active variant has discount > 0
          (
            select bool_or(coalesce(v.discount_percent, 0) > 0)
            from product_variants v
            where v.product_id = p.id
              and v.is_active = true
          ) as has_discount,

          -- in_stock if any active variant has stock_qty > 0
          (
            select bool_or(coalesce(v.stock_qty, 0) > 0)
            from product_variants v
            where v.product_id = p.id
              and v.is_active = true
          ) as in_stock
        from products p
        join requested r on r.id = p.id
        where p.is_active = true
      )
      select *
      from card
      order by array_position($1::uuid[], id);
    `
      : `
      select
        p.id,
        p.name,
        p.slug,
        p.is_active,

        (
          select pi.image_url
          from product_images pi
          where pi.product_id = p.id
          order by pi.is_primary desc, pi.sort_order asc
          limit 1
        ) as primary_image_url,

        (
          select min(
            round(
              (v.price * (1 - (coalesce(v.discount_percent, 0) / 100.0)))::numeric
            , 2)
          )
          from product_variants v
          where v.product_id = p.id
            and v.is_active = true
        ) as starting_price,

        (
          select bool_or(coalesce(v.discount_percent, 0) > 0)
          from product_variants v
          where v.product_id = p.id
            and v.is_active = true
        ) as has_discount,

        (
          select bool_or(coalesce(v.stock_qty, 0) > 0)
          from product_variants v
          where v.product_id = p.id
            and v.is_active = true
        ) as in_stock

      from products p
      where p.is_active = true
      order by p.created_at desc
      limit $1;
    `;

    const res = useIds
      ? await pool.query(query, [ids])
      : await pool.query(query, [limit]);

    return NextResponse.json({ products: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load product cards", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
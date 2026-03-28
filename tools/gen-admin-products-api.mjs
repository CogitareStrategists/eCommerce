import fs from "fs";
import path from "path";

const root = process.cwd();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Wrote:", path.relative(root, filePath));
}

/**
 * API: /api/admin/products
 * - GET list products with category name
 * - POST create product
 */
writeFile(
  path.join(root, "app", "api", "admin", "products", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      \`select
        p.id, p.name, p.slug, p.is_active,
        p.category_id,
        c.name as category_name
      from products p
      left join categories c on c.id = p.category_id
      order by p.created_at desc\`
    );
    return NextResponse.json({ products: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load products", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const category_id = body?.category_id || null;
    const name = (body?.name ?? "").toString().trim();
    const slug = (body?.slug ?? "").toString().trim();

    const description = (body?.description ?? "").toString();
    const ingredients = (body?.ingredients ?? "").toString();
    const benefits = (body?.benefits ?? "").toString();
    const how_to_use = (body?.how_to_use ?? "").toString();
    const is_active = body?.is_active !== false;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    const res = await pool.query(
      \`insert into products
        (category_id, name, slug, description, ingredients, benefits, how_to_use, is_active)
       values
        ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
       returning *\`,
      [category_id, name, slug, description, ingredients, benefits, how_to_use, is_active]
    );

    return NextResponse.json({ product: res.rows[0] });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create product", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

/**
 * API: /api/admin/products/[id]
 * - GET product + images + variants
 * - PUT update product
 * - DELETE delete product (cascades variants/images/reviews)
 */
writeFile(
  path.join(root, "app", "api", "admin", "products", "[id]", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [pRes, imgRes, vRes] = await Promise.all([
      pool.query(\`select * from products where id = $1::uuid\`, [id]),
      pool.query(
        \`select id, image_url, sort_order, is_primary
         from product_images
         where product_id = $1::uuid
         order by is_primary desc, sort_order asc\`,
        [id]
      ),
      pool.query(
        \`select id, label, price, discount_percent, stock_qty, sku, is_active
         from product_variants
         where product_id = $1::uuid
         order by created_at asc\`,
        [id]
      ),
    ]);

    const product = pRes.rows[0];
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      product,
      images: imgRes.rows,
      variants: vRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load product", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);

    const category_id = body?.category_id || null;
    const name = (body?.name ?? "").toString().trim();
    const slug = (body?.slug ?? "").toString().trim();

    const description = (body?.description ?? "").toString();
    const ingredients = (body?.ingredients ?? "").toString();
    const benefits = (body?.benefits ?? "").toString();
    const how_to_use = (body?.how_to_use ?? "").toString();
    const is_active = body?.is_active !== false;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    const res = await pool.query(
      \`update products
       set category_id = $1::uuid,
           name = $2,
           slug = $3,
           description = $4,
           ingredients = $5,
           benefits = $6,
           how_to_use = $7,
           is_active = $8
       where id = $9::uuid
       returning *\`,
      [category_id, name, slug, description, ingredients, benefits, how_to_use, is_active, id]
    );

    const product = res.rows[0];
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ product });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update product", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await pool.query(
      \`delete from products where id = $1::uuid returning id\`,
      [id]
    );
    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete product", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

/**
 * API: /api/admin/products/[id]/variants
 * - POST create variant
 */
writeFile(
  path.join(root, "app", "api", "admin", "products", "[id]", "variants", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);

    const label = (body?.label ?? "").toString().trim();
    const price = Number(body?.price ?? 0);
    const discount_percent = Number(body?.discount_percent ?? 0);
    const stock_qty = Number(body?.stock_qty ?? 0);
    const sku = (body?.sku ?? "").toString().trim() || null;
    const is_active = body?.is_active !== false;

    if (!label || !(price >= 0)) {
      return NextResponse.json({ error: "label and price are required" }, { status: 400 });
    }

    const res = await pool.query(
      \`insert into product_variants
        (product_id, label, price, discount_percent, stock_qty, sku, is_active)
       values
        ($1::uuid, $2, $3, $4, $5, $6, $7)
       returning id, label, price, discount_percent, stock_qty, sku, is_active\`,
      [id, label, price, discount_percent, stock_qty, sku, is_active]
    );

    return NextResponse.json({ variant: res.rows[0] });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create variant", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

console.log("\\nDone. Restart dev server if needed: npm run dev");
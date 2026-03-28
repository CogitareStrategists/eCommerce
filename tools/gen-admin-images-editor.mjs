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

/* =========================================
   API: /api/admin/products/[id]/images
   POST create image
========================================= */
writeFile(
  path.join(root, "app", "api", "admin", "products", "[id]", "images", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);

    const image_url = (body?.image_url ?? "").toString().trim();
    const sort_order = Number(body?.sort_order ?? 0);
    const is_primary = body?.is_primary === true;

    if (!image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }

    await pool.query("begin");

    if (is_primary) {
      await pool.query(
        \`update product_images
         set is_primary = false
         where product_id = $1::uuid\`,
        [id]
      );
    }

    const res = await pool.query(
      \`insert into product_images (product_id, image_url, sort_order, is_primary)
       values ($1::uuid, $2, $3, $4)
       returning id, image_url, sort_order, is_primary\`,
      [id, image_url, sort_order, is_primary]
    );

    await pool.query("commit");

    return NextResponse.json({ image: res.rows[0] });
  } catch (err: any) {
    try { await pool.query("rollback"); } catch {}
    return NextResponse.json(
      { error: "Failed to add image", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

/* =========================================
   API: /api/admin/products/[id]/images/[imageId]
   PUT update image (url/order/primary)
   DELETE delete image
========================================= */
writeFile(
  path.join(root, "app", "api", "admin", "products", "[id]", "images", "[imageId]", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;

  try {
    const body = await req.json().catch(() => null);

    const image_url = (body?.image_url ?? "").toString().trim();
    const sort_order = Number(body?.sort_order ?? 0);
    const is_primary = body?.is_primary === true;

    if (!image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }

    await pool.query("begin");

    if (is_primary) {
      await pool.query(
        \`update product_images
         set is_primary = false
         where product_id = $1::uuid\`,
        [id]
      );
    }

    const res = await pool.query(
      \`update product_images
       set image_url=$1, sort_order=$2, is_primary=$3
       where id=$4::uuid and product_id=$5::uuid
       returning id, image_url, sort_order, is_primary\`,
      [image_url, sort_order, is_primary, imageId, id]
    );

    await pool.query("commit");

    const image = res.rows[0];
    if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ image });
  } catch (err: any) {
    try { await pool.query("rollback"); } catch {}
    return NextResponse.json(
      { error: "Failed to update image", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;

  try {
    const res = await pool.query(
      \`delete from product_images
       where id=$1::uuid and product_id=$2::uuid
       returning id\`,
      [imageId, id]
    );

    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete image", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

/* =========================================
   Update Product Edit page:
   - add images state + UI section
   - keeps variants section
========================================= */
writeFile(
  path.join(root, "app", "admin", "products", "[id]", "edit", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string };

type Variant = {
  id: string;
  label: string;
  price: string; // numeric -> string
  discount_percent: string;
  stock_qty: number;
  sku: string | null;
  is_active: boolean;
};

type ProductImage = {
  id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const raw = (params as any)?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [benefits, setBenefits] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  // Variant add form
  const [vLabel, setVLabel] = useState("");
  const [vPrice, setVPrice] = useState<number>(0);
  const [vDiscount, setVDiscount] = useState<number>(0);
  const [vStock, setVStock] = useState<number>(0);
  const [vSku, setVSku] = useState<string>("");
  const [vActive, setVActive] = useState(true);

  // Image add form
  const [imgUrl, setImgUrl] = useState("");
  const [imgOrder, setImgOrder] = useState<number>(0);
  const [imgPrimary, setImgPrimary] = useState(false);

  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setMsg(null);

    const [catRes, pRes] = await Promise.all([
      fetch("/api/admin/categories", { cache: "no-store" }),
      fetch(\`/api/admin/products/\${id}\`, { cache: "no-store" }),
    ]);

    const catData = await catRes.json().catch(() => null);
    if (catRes.ok) setCategories(catData.categories ?? []);

    const pData = await pRes.json().catch(() => null);
    if (!pRes.ok) {
      setMsg(pData?.error ?? "Failed to load product");
      setLoading(false);
      return;
    }

    const p = pData.product;
    setCategoryId(p.category_id ?? "");
    setName(p.name ?? "");
    setSlug(p.slug ?? "");
    setDescription(p.description ?? "");
    setIngredients(p.ingredients ?? "");
    setBenefits(p.benefits ?? "");
    setHowToUse(p.how_to_use ?? "");
    setIsActive(!!p.is_active);

    setVariants(pData.variants ?? []);
    setImages(pData.images ?? []);

    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const activeVariantsCount = useMemo(
    () => variants.filter((v) => v.is_active).length,
    [variants]
  );

  const primaryImage = useMemo(
    () => images.find((i) => i.is_primary) ?? null,
    [images]
  );

  async function saveBase() {
    setMsg(null);
    const res = await fetch(\`/api/admin/products/\${id}\`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId || null,
        name,
        slug,
        description,
        ingredients,
        benefits,
        how_to_use: howToUse,
        is_active: isActive,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMsg(data?.error ?? "Save failed");
      return;
    }
    setMsg("Saved.");
  }

  async function delProduct() {
    const ok = confirm("Delete this product? This will remove its variants, images, and reviews.");
    if (!ok) return;

    const res = await fetch(\`/api/admin/products/\${id}\`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Delete failed");
      return;
    }
    router.push("/admin/products");
  }

  // ---------------- Variants ----------------
  async function addVariant() {
    setBusy(true);
    setMsg(null);

    const res = await fetch(\`/api/admin/products/\${id}/variants\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: vLabel,
        price: vPrice,
        discount_percent: vDiscount,
        stock_qty: vStock,
        sku: vSku || null,
        is_active: vActive,
      }),
    });

    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to add variant");
      return;
    }

    setVariants((prev) => [...prev, data.variant]);
    setVLabel("");
    setVPrice(0);
    setVDiscount(0);
    setVStock(0);
    setVSku("");
    setVActive(true);
  }

  async function updateVariant(variant: Variant) {
    setBusy(true);
    setMsg(null);

    const res = await fetch(\`/api/admin/products/\${id}/variants/\${variant.id}\`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: variant.label,
        price: Number(variant.price),
        discount_percent: Number(variant.discount_percent),
        stock_qty: Number(variant.stock_qty),
        sku: variant.sku,
        is_active: variant.is_active,
      }),
    });

    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to update variant");
      return;
    }

    setVariants((prev) => prev.map((v) => (v.id === variant.id ? data.variant : v)));
    setMsg("Variant updated.");
  }

  async function deleteVariant(variantId: string) {
    const ok = confirm("Delete this variant?");
    if (!ok) return;

    setBusy(true);
    setMsg(null);

    const res = await fetch(\`/api/admin/products/\${id}/variants/\${variantId}\`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to delete variant");
      return;
    }

    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  }

  // ---------------- Images ----------------
  async function addImage() {
    setBusy(true);
    setMsg(null);

    const res = await fetch(\`/api/admin/products/\${id}/images\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imgUrl,
        sort_order: imgOrder,
        is_primary: imgPrimary,
      }),
    });

    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to add image");
      return;
    }

    // If primary was set, unset others in UI too
    setImages((prev) => {
      const next = imgPrimary ? prev.map((x) => ({ ...x, is_primary: false })) : prev;
      return [...next, data.image].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order);
    });

    setImgUrl("");
    setImgOrder(0);
    setImgPrimary(false);
  }

  async function updateImage(image: ProductImage) {
    setBusy(true);
    setMsg(null);

    const res = await fetch(\`/api/admin/products/\${id}/images/\${image.id}\`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: image.image_url,
        sort_order: Number(image.sort_order),
        is_primary: image.is_primary,
      }),
    });

    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to update image");
      return;
    }

    setImages((prev) => {
      // If server set this as primary, unset others
      const updated = data.image as ProductImage;
      const next = prev.map((x) =>
        x.id === updated.id ? updated : (updated.is_primary ? { ...x, is_primary: false } : x)
      );
      return next.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order);
    });

    setMsg("Image updated.");
  }

  async function deleteImage(imageId: string) {
    const ok = confirm("Delete this image?");
    if (!ok) return;

    setBusy(true);
    setMsg(null);

    const res = await fetch(\`/api/admin/products/\${id}/images/\${imageId}\`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to delete image");
      return;
    }

    setImages((prev) => prev.filter((i) => i.id !== imageId));
  }

  if (loading) return <div className="py-10 text-sm text-black/70">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="mt-1 text-sm text-black/70">
            Base info + variants + images.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/products"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Back to Products
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {msg && (
        <div className="rounded-md border border-black/10 bg-black/5 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      {/* Base Product */}
      <div className="space-y-4 rounded-xl border border-black/10 p-4">
        <div className="text-sm font-semibold">Base Product</div>

        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">(No category)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Slug</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Ingredients</label>
          <textarea
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            rows={3}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Benefits</label>
          <textarea
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            rows={3}
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">How to use</label>
          <textarea
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            rows={3}
            value={howToUse}
            onChange={(e) => setHowToUse(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <div className="flex gap-2">
          <button onClick={saveBase} className="rounded-md bg-black px-4 py-2 text-white">
            Save Base
          </button>

          <button
            onClick={delProduct}
            className="rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
          >
            Delete Product
          </button>
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-4 rounded-xl border border-black/10 p-4">
        <div>
          <div className="text-sm font-semibold">Variants</div>
          <div className="mt-1 text-sm text-black/70">
            Total: <span className="font-medium text-black">{variants.length}</span>, Active:{" "}
            <span className="font-medium text-black">{activeVariantsCount}</span>
          </div>
        </div>

        {/* Add variant */}
        <div className="grid gap-3 rounded-xl border border-black/10 p-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-black/70">Size/Quantity Label</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm"
              value={vLabel}
              onChange={(e) => setVLabel(e.target.value)}
              placeholder="e.g. 100g"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-black/70">Price</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm"
              value={vPrice}
              onChange={(e) => setVPrice(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-black/70">Discount %</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm"
              value={vDiscount}
              onChange={(e) => setVDiscount(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-black/70">Stock</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm"
              value={vStock}
              onChange={(e) => setVStock(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-black/70">SKU (optional)</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm"
              value={vSku}
              onChange={(e) => setVSku(e.target.value)}
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              disabled={busy}
              onClick={addVariant}
              className="w-full rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
            >
              Add
            </button>
          </div>

          <div className="md:col-span-12">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={vActive}
                onChange={(e) => setVActive(e.target.checked)}
              />
              Active
            </label>
          </div>
        </div>

        {/* Existing variants */}
        <div className="overflow-hidden rounded-xl border border-black/10">
          <div className="grid grid-cols-12 bg-black/5 px-4 py-3 text-xs font-semibold uppercase text-black/70">
            <div className="col-span-3">Label</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Discount%</div>
            <div className="col-span-2">Stock</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-black/10">
            {variants.map((v, idx) => (
              <div key={v.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-3">
                  <input
                    className="w-full rounded-md border border-black/20 px-2 py-1"
                    value={v.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, label } : x)));
                    }}
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-black/70">
                    <input
                      type="checkbox"
                      checked={v.is_active}
                      onChange={(e) => {
                        const is_active = e.target.checked;
                        setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, is_active } : x)));
                      }}
                    />
                    Active
                  </label>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    className="w-full rounded-md border border-black/20 px-2 py-1"
                    value={v.price}
                    onChange={(e) => {
                      const price = e.target.value;
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, price } : x)));
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    className="w-full rounded-md border border-black/20 px-2 py-1"
                    value={v.discount_percent}
                    onChange={(e) => {
                      const discount_percent = e.target.value;
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, discount_percent } : x)));
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    className="w-full rounded-md border border-black/20 px-2 py-1"
                    value={v.stock_qty}
                    onChange={(e) => {
                      const stock_qty = Number(e.target.value);
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, stock_qty } : x)));
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <input
                    className="w-full rounded-md border border-black/20 px-2 py-1"
                    value={v.sku ?? ""}
                    onChange={(e) => {
                      const sku = e.target.value || null;
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, sku } : x)));
                    }}
                  />
                </div>

                <div className="col-span-1 flex justify-end gap-2">
                  <button
                    disabled={busy}
                    onClick={() => updateVariant(variants[idx])}
                    className="rounded-md border border-black/20 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => deleteVariant(v.id)}
                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}

            {variants.length === 0 && (
              <div className="px-4 py-8 text-sm text-black/70">
                No variants yet. Add at least one active variant.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4 rounded-xl border border-black/10 p-4">
        <div>
          <div className="text-sm font-semibold">Images</div>
          <div className="mt-1 text-sm text-black/70">
            Total: <span className="font-medium text-black">{images.length}</span>
            {primaryImage ? (
              <>
                {" "}• Primary set
              </>
            ) : (
              <>
                {" "}• No primary image yet
              </>
            )}
          </div>
        </div>

        {/* Add image */}
        <div className="grid gap-3 rounded-xl border border-black/10 p-3 md:grid-cols-12">
          <div className="md:col-span-7">
            <label className="text-xs font-medium text-black/70">Image URL</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm"
              value={imgUrl}
              onChange={(e) => setImgUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-black/70">Sort Order</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm"
              value={imgOrder}
              onChange={(e) => setImgOrder(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={imgPrimary}
                onChange={(e) => setImgPrimary(e.target.checked)}
              />
              Primary
            </label>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              disabled={busy}
              onClick={addImage}
              className="w-full rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </div>

        {/* Images list */}
        <div className="overflow-hidden rounded-xl border border-black/10">
          <div className="grid grid-cols-12 bg-black/5 px-4 py-3 text-xs font-semibold uppercase text-black/70">
            <div className="col-span-5">Preview</div>
            <div className="col-span-4">URL</div>
            <div className="col-span-1">Order</div>
            <div className="col-span-1">Primary</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-black/10">
            {images.map((img, idx) => (
              <div key={img.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-5 flex items-center gap-3">
                  <img
                    src={img.image_url}
                    alt="product"
                    className="h-12 w-16 rounded-md object-cover"
                  />
                  {img.is_primary && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs">Primary</span>
                  )}
                </div>

                <div className="col-span-4">
                  <input
                    className="w-full rounded-md border border-black/20 px-2 py-1 text-xs"
                    value={img.image_url}
                    onChange={(e) => {
                      const image_url = e.target.value;
                      setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, image_url } : x)));
                    }}
                  />
                </div>

                <div className="col-span-1">
                  <input
                    type="number"
                    className="w-full rounded-md border border-black/20 px-2 py-1"
                    value={img.sort_order}
                    onChange={(e) => {
                      const sort_order = Number(e.target.value);
                      setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, sort_order } : x)));
                    }}
                  />
                </div>

                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={img.is_primary}
                    onChange={(e) => {
                      const is_primary = e.target.checked;
                      setImages((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, is_primary }
                            : (is_primary ? { ...x, is_primary: false } : x)
                        )
                      );
                    }}
                  />
                </div>

                <div className="col-span-1 flex justify-end gap-2">
                  <button
                    disabled={busy}
                    onClick={() => updateImage(images[idx])}
                    className="rounded-md border border-black/20 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => deleteImage(img.id)}
                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}

            {images.length === 0 && (
              <div className="px-4 py-8 text-sm text-black/70">
                No images yet. Add at least one image and mark one as primary.
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-black/60">
          Tip: Set one image as Primary. It will be used in product cards and product detail page.
        </p>
      </div>
    </div>
  );
}
`
);

console.log("\\nDone. Restart dev server: npm run dev");
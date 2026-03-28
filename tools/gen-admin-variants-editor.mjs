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
   API: /api/admin/products/[id]/variants/[variantId]
   PUT update variant
   DELETE delete variant
========================================= */
writeFile(
  path.join(root, "app", "api", "admin", "products", "[id]", "variants", "[variantId]", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;

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
      \`update product_variants
       set label=$1,
           price=$2,
           discount_percent=$3,
           stock_qty=$4,
           sku=$5,
           is_active=$6
       where id=$7::uuid
         and product_id=$8::uuid
       returning id, label, price, discount_percent, stock_qty, sku, is_active\`,
      [label, price, discount_percent, stock_qty, sku, is_active, variantId, id]
    );

    const variant = res.rows[0];
    if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ variant });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update variant", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;

  try {
    const res = await pool.query(
      \`delete from product_variants
       where id=$1::uuid
         and product_id=$2::uuid
       returning id\`,
      [variantId, id]
    );

    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete variant", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

/* =========================================
   Update Product Edit page: add full variants UI
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
  price: string; // API returns numeric as string
  discount_percent: string;
  stock_qty: number;
  sku: string | null;
  is_active: boolean;
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

  // Add form
  const [vLabel, setVLabel] = useState("");
  const [vPrice, setVPrice] = useState<number>(0);
  const [vDiscount, setVDiscount] = useState<number>(0);
  const [vStock, setVStock] = useState<number>(0);
  const [vSku, setVSku] = useState<string>("");
  const [vActive, setVActive] = useState(true);
  const [variantBusy, setVariantBusy] = useState(false);

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
    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const activeVariantsCount = useMemo(
    () => variants.filter((v) => v.is_active).length,
    [variants]
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

  async function addVariant() {
    setVariantBusy(true);
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
    setVariantBusy(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to add variant");
      return;
    }

    setVariants((prev) => [...prev, data.variant]);

    // reset
    setVLabel("");
    setVPrice(0);
    setVDiscount(0);
    setVStock(0);
    setVSku("");
    setVActive(true);
  }

  async function updateVariant(variant: Variant) {
    setVariantBusy(true);
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
    setVariantBusy(false);

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

    setVariantBusy(true);
    setMsg(null);

    const res = await fetch(\`/api/admin/products/\${id}/variants/\${variantId}\`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);
    setVariantBusy(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to delete variant");
      return;
    }

    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  }

  if (loading) return <div className="py-10 text-sm text-black/70">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="mt-1 text-sm text-black/70">
            Base info + variants (size/quantity + price/stock/discount).
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
          <button
            onClick={saveBase}
            className="rounded-md bg-black px-4 py-2 text-white"
          >
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
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm font-semibold">Variants</div>
            <div className="mt-1 text-sm text-black/70">
              Total: <span className="font-medium text-black">{variants.length}</span>, Active:{" "}
              <span className="font-medium text-black">{activeVariantsCount}</span>
            </div>
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
              disabled={variantBusy}
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
                      setVariants((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, label } : x))
                      );
                    }}
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-black/70">
                    <input
                      type="checkbox"
                      checked={v.is_active}
                      onChange={(e) => {
                        const is_active = e.target.checked;
                        setVariants((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, is_active } : x))
                        );
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
                      setVariants((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, price } : x))
                      );
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
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, discount_percent } : x
                        )
                      );
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
                      setVariants((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, stock_qty } : x))
                      );
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <input
                    className="w-full rounded-md border border-black/20 px-2 py-1"
                    value={v.sku ?? ""}
                    onChange={(e) => {
                      const sku = e.target.value || null;
                      setVariants((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, sku } : x))
                      );
                    }}
                  />
                </div>

                <div className="col-span-1 flex justify-end gap-2">
                  <button
                    disabled={variantBusy}
                    onClick={() => updateVariant(variants[idx])}
                    className="rounded-md border border-black/20 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    disabled={variantBusy}
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
                No variants yet. Add at least one variant.
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-black/60">
          Tip: Add at least one active variant for the product to be purchasable.
        </p>
      </div>
    </div>
  );
}
`
);

console.log("\\nDone. Restart dev server: npm run dev");
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

/* -----------------------
   1) Update Admin Dashboard
----------------------- */
writeFile(
  path.join(root, "app", "admin", "page.tsx"),
  `import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-black/70">Manage store content.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/admin/home"
          className="rounded-xl border border-black/10 p-4 hover:bg-black/5"
        >
          <div className="font-semibold">Home Page</div>
          <div className="mt-1 text-sm text-black/70">
            Sections, items, and ordering.
          </div>
        </Link>

        <Link
          href="/admin/collections"
          className="rounded-xl border border-black/10 p-4 hover:bg-black/5"
        >
          <div className="font-semibold">Collections</div>
          <div className="mt-1 text-sm text-black/70">
            Add, edit, and delete collections.
          </div>
        </Link>

        <Link
          href="/admin/categories"
          className="rounded-xl border border-black/10 p-4 hover:bg-black/5"
        >
          <div className="font-semibold">Categories</div>
          <div className="mt-1 text-sm text-black/70">
            Add, edit, and delete categories.
          </div>
        </Link>

        <Link
          href="/admin/products"
          className="rounded-xl border border-black/10 p-4 hover:bg-black/5"
        >
          <div className="font-semibold">Products</div>
          <div className="mt-1 text-sm text-black/70">
            Add products and manage variants.
          </div>
        </Link>
      </div>
    </div>
  );
}
`
);

/* -----------------------
   2) Products list page
----------------------- */
writeFile(
  path.join(root, "app", "admin", "products", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  category_name: string | null;
};

export default function AdminProductsList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const res = await fetch("/api/admin/products", { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load");
      return;
    }
    setRows(data.products ?? []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-black/70">
            Create products and manage variants (size/quantity + price/stock/discount).
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-md bg-black px-3 py-2 text-sm text-white"
          >
            + New Product
          </Link>
        </div>
      </div>

      {msg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="grid grid-cols-12 bg-black/5 px-4 py-3 text-xs font-semibold uppercase text-black/70">
          <div className="col-span-5">Name</div>
          <div className="col-span-3">Category</div>
          <div className="col-span-3">Slug</div>
          <div className="col-span-1 text-right">Edit</div>
        </div>

        <div className="divide-y divide-black/10">
          {rows.map((p) => (
            <div key={p.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
              <div className="col-span-5 font-medium">{p.name}</div>
              <div className="col-span-3 text-black/70">{p.category_name ?? "-"}</div>
              <div className="col-span-3 text-black/70">{p.slug}</div>
              <div className="col-span-1 text-right">
                <Link className="underline" href={\`/admin/products/\${p.id}/edit\`}>
                  Edit
                </Link>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="px-4 py-8 text-sm text-black/70">
              No products yet. Click “New Product”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`
);

/* -----------------------
   3) New product page
----------------------- */
writeFile(
  path.join(root, "app", "admin", "products", "new", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Category = { id: string; name: string };

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok) setCategories(data.categories ?? []);
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId || null,
        name,
        slug,
        is_active: isActive,
        description: "",
        ingredients: "",
        benefits: "",
        how_to_use: "",
      }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Save failed");
      return;
    }

    router.push(\`/admin/products/\${data.product.id}/edit\`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Product</h1>
          <p className="mt-1 text-sm text-black/70">Create the base product first. Add variants next.</p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
        >
          Back
        </Link>
      </div>

      {msg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-black/10 p-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">(No category)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
            placeholder="e.g. herbal-tea"
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

        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Create & Continue"}
        </button>
      </div>
    </div>
  );
}
`
);

/* -----------------------
   4) Edit product page (base fields only for now)
----------------------- */
writeFile(
  path.join(root, "app", "admin", "products", "[id]", "edit", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Category = { id: string; name: string };
type Variant = {
  id: string; label: string; price: string; discount_percent: string; stock_qty: number;
  sku: string | null; is_active: boolean;
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

  if (loading) return <div className="py-10 text-sm text-black/70">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="mt-1 text-sm text-black/70">
            Base info now. Next step: variants editor UI.
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

      <div className="space-y-4 rounded-xl border border-black/10 p-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">(No category)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Name</label>
          <input className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Slug</label>
          <input className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Ingredients</label>
          <textarea className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            rows={3} value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Benefits</label>
          <textarea className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            rows={3} value={benefits} onChange={(e) => setBenefits(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">How to use</label>
          <textarea className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            rows={3} value={howToUse} onChange={(e) => setHowToUse(e.target.value)} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>

        <div className="flex gap-2">
          <button onClick={saveBase} className="rounded-md bg-black px-4 py-2 text-white">
            Save
          </button>

          <button
            onClick={delProduct}
            className="rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <div className="font-semibold">Variants</div>
        <div className="mt-1 text-sm text-black/70">
          Variants found: <span className="font-medium text-black">{variants.length}</span>
        </div>
        <div className="mt-3 text-sm text-black/60">
          Next step: Add UI to add/edit/delete variants here.
        </div>
      </div>
    </div>
  );
}
`
);

console.log("\\nDone. Restart dev server: npm run dev");
"use client";

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

    router.push(`/admin/products/${data.product.id}/edit`);
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

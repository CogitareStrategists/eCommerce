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
   1) Admin Dashboard link
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
      </div>
    </div>
  );
}
`
);

/* -----------------------
   2) Categories list page
----------------------- */
writeFile(
  path.join(root, "app", "admin", "categories", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const res = await fetch("/api/admin/categories", { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load");
      return;
    }

    setRows(data.categories || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-black/70">
            Categories are used to organize products.
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
            href="/admin/categories/new"
            className="rounded-md bg-black px-3 py-2 text-sm text-white"
          >
            + New Category
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
          <div className="col-span-5">Slug</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Edit</div>
        </div>

        <div className="divide-y divide-black/10">
          {rows.map((c) => (
            <div key={c.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
              <div className="col-span-5 font-medium">{c.name}</div>
              <div className="col-span-5 text-black/70">{c.slug}</div>
              <div className="col-span-1">
                {c.is_active ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs">Active</span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">Inactive</span>
                )}
              </div>
              <div className="col-span-1 text-right">
                <Link className="underline" href={\`/admin/categories/\${c.id}/edit\`}>
                  Edit
                </Link>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="px-4 py-8 text-sm text-black/70">
              No categories yet. Click “New Category”.
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
   3) Categories new page
----------------------- */
writeFile(
  path.join(root, "app", "admin", "categories", "new", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCategory() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Save failed");
      return;
    }

    router.push("/admin/categories");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Category</h1>
          <p className="mt-1 text-sm text-black/70">Add a category.</p>
        </div>
        <Link
          href="/admin/categories"
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
            placeholder="e.g. wellness"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Create"}
        </button>
      </div>
    </div>
  );
}
`
);

console.log("\\nDone. Restart dev server if needed: npm run dev");
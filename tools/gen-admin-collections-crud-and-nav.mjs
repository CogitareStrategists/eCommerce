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

// -------------------------
// API: /api/admin/collections (list + create)
// -------------------------
writeFile(
  path.join(root, "app", "api", "admin", "collections", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      \`select id, name, slug, image_url, is_active
       from collections
       order by name asc\`
    );
    return NextResponse.json({ collections: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load collections", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = (body?.name ?? "").toString().trim();
    const slug = (body?.slug ?? "").toString().trim();
    const image_url = (body?.image_url ?? "").toString().trim();
    const is_active = body?.is_active !== false;

    if (!name || !slug || !image_url) {
      return NextResponse.json({ error: "name, slug, image_url are required" }, { status: 400 });
    }

    const res = await pool.query(
      \`insert into collections (name, slug, image_url, is_active)
       values ($1, $2, $3, $4)
       returning id, name, slug, image_url, is_active\`,
      [name, slug, image_url, is_active]
    );

    return NextResponse.json({ collection: res.rows[0] });
  } catch (err: any) {
    // common case: unique slug violation
    const msg = (err?.message ?? "").toString();
    if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
      return NextResponse.json({ error: "Slug already exists. Use a different slug." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create collection", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

// -------------------------
// API: /api/admin/collections/[id] (read + update + delete)
// -------------------------
writeFile(
  path.join(root, "app", "api", "admin", "collections", "[id]", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const res = await pool.query(
      \`select id, name, slug, image_url, is_active
       from collections
       where id = $1\`,
      [params.id]
    );

    const collection = res.rows[0];
    if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ collection });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load collection", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null);
    const name = (body?.name ?? "").toString().trim();
    const slug = (body?.slug ?? "").toString().trim();
    const image_url = (body?.image_url ?? "").toString().trim();
    const is_active = body?.is_active !== false;

    if (!name || !slug || !image_url) {
      return NextResponse.json({ error: "name, slug, image_url are required" }, { status: 400 });
    }

    const res = await pool.query(
      \`update collections
       set name = $1, slug = $2, image_url = $3, is_active = $4
       where id = $5
       returning id, name, slug, image_url, is_active\`,
      [name, slug, image_url, is_active, params.id]
    );

    const collection = res.rows[0];
    if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ collection });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString();
    if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
      return NextResponse.json({ error: "Slug already exists. Use a different slug." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update collection", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    // Safe delete behavior:
    // - If this collection is used in home_section_items, deletion will error unless we remove those rows.
    // We'll remove any home selections first, then delete.
    await pool.query("begin");

    await pool.query(\`delete from home_section_items where item_type='collection' and ref_id = $1\`, [params.id]);
    const res = await pool.query(\`delete from collections where id = $1 returning id\`, [params.id]);

    await pool.query("commit");

    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try { await pool.query("rollback"); } catch {}
    return NextResponse.json(
      { error: "Failed to delete collection", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

// -------------------------
// Admin UI: /admin/collections (list)
// -------------------------
writeFile(
  path.join(root, "app", "admin", "collections", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Collection = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  is_active: boolean;
};

export default function AdminCollectionsList() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/collections", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load");
      setLoading(false);
      return;
    }
    setRows(data.collections ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="mt-1 text-sm text-black/70">
            Create and manage collections used across the store and Home page.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/home"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Back to Home Manager
          </Link>
          <Link
            href="/admin/collections/new"
            className="rounded-md bg-black px-3 py-2 text-sm text-white"
          >
            + New Collection
          </Link>
        </div>
      </div>

      {msg && (
        <div className="rounded-md border border-black/10 bg-black/5 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-sm text-black/70">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10">
          <div className="grid grid-cols-12 bg-black/5 px-4 py-3 text-xs font-semibold uppercase text-black/70">
            <div className="col-span-5">Name</div>
            <div className="col-span-4">Slug</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Edit</div>
          </div>

          <div className="divide-y divide-black/10">
            {rows.map((c) => (
              <div key={c.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-5 flex items-center gap-3">
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="h-10 w-14 rounded-md object-cover"
                  />
                  <div className="font-medium">{c.name}</div>
                </div>
                <div className="col-span-4 text-black/70">{c.slug}</div>
                <div className="col-span-2">
                  {c.is_active ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs">Active</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">Inactive</span>
                  )}
                </div>
                <div className="col-span-1 text-right">
                  <Link className="underline" href={\`/admin/collections/\${c.id}/edit\`}>
                    Edit
                  </Link>
                </div>
              </div>
            ))}

            {rows.length === 0 && (
              <div className="px-4 py-8 text-sm text-black/70">
                No collections yet. Click “New Collection”.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`
);

// -------------------------
// Admin UI: /admin/collections/new (create)
// -------------------------
writeFile(
  path.join(root, "app", "admin", "collections", "new", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCollectionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug,
        image_url: imageUrl,
        is_active: isActive,
      }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Save failed");
      return;
    }

    router.push("/admin/collections");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Collection</h1>
          <p className="mt-1 text-sm text-black/70">Add a collection.</p>
        </div>
        <Link
          href="/admin/collections"
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
            placeholder="e.g. skin-care"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Image URL</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
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
          {saving ? "Saving..." : "Create"}
        </button>
      </div>
    </div>
  );
}
`
);

// -------------------------
// Admin UI: /admin/collections/[id]/edit (edit + delete)
// -------------------------
writeFile(
  path.join(root, "app", "admin", "collections", "[id]", "edit", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditCollectionPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(\`/api/admin/collections/\${id}\`, { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load");
      setLoading(false);
      return;
    }

    const c = data.collection;
    setName(c.name);
    setSlug(c.slug);
    setImageUrl(c.image_url);
    setIsActive(!!c.is_active);
    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    setSaving(true);
    setMsg(null);

    const res = await fetch(\`/api/admin/collections/\${id}\`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug,
        image_url: imageUrl,
        is_active: isActive,
      }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Save failed");
      return;
    }

    router.push("/admin/collections");
  }

  async function del() {
    const ok = confirm("Delete this collection? This will also remove it from Home selections.");
    if (!ok) return;

    const res = await fetch(\`/api/admin/collections/\${id}\`, { method: "DELETE" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.error ?? "Delete failed");
      return;
    }

    router.push("/admin/collections");
  }

  if (loading) return <div className="py-10 text-sm text-black/70">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Collection</h1>
          <p className="mt-1 text-sm text-black/70">Update or delete this collection.</p>
        </div>
        <Link
          href="/admin/collections"
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
          />
        </div>

        <div>
          <label className="text-sm font-medium">Image URL</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
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
            onClick={save}
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={del}
            className="rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
`
);

// -------------------------
// Update Admin Dashboard: add link to Collections
// -------------------------
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
      </div>
    </div>
  );
}
`
);

// -------------------------
// Add navigation links to Home → Collections manager page
// (overwrite with a version that includes Back links at the top)
// -------------------------
writeFile(
  path.join(root, "app", "admin", "home", "collections", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  selected: boolean;
  display_order: number;
};

export default function AdminHomeCollectionsPage() {
  const [sectionId, setSectionId] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/home/collections", { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load");
      setLoading(false);
      return;
    }

    setSectionId(data.sectionId);
    setRows(data.collections ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedCount = useMemo(
    () => rows.filter((r) => r.selected).length,
    [rows]
  );

  async function save() {
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/admin/home/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, items: rows }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Save failed");
      return;
    }

    setMsg(\`Saved. Selected: \${data.saved}\`);
  }

  if (loading) {
    return <div className="py-10 text-sm text-black/70">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home → Collections</h1>
          <p className="mt-1 text-sm text-black/70">
            Select which collections appear on the Home page and set their order.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/home"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Back to Home Manager
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/collections"
            className="rounded-md bg-black px-3 py-2 text-sm text-white"
          >
            Manage Collections
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4">
        <div className="text-sm text-black/70">
          Selected: <span className="font-semibold text-black">{selectedCount}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Refresh
          </button>
          <button
            disabled={saving}
            onClick={save}
            className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-md border border-black/10 bg-black/5 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="grid grid-cols-12 bg-black/5 px-4 py-3 text-xs font-semibold uppercase text-black/70">
          <div className="col-span-1">Show</div>
          <div className="col-span-5">Collection</div>
          <div className="col-span-4">Slug</div>
          <div className="col-span-2">Order</div>
        </div>

        <div className="divide-y divide-black/10">
          {rows.map((r, idx) => (
            <div key={r.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={r.selected}
                  onChange={(e) => {
                    const selected = e.target.checked;
                    setRows((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, selected } : x))
                    );
                  }}
                />
              </div>

              <div className="col-span-5 flex items-center gap-3">
                <img
                  src={r.image_url}
                  alt={r.name}
                  className="h-10 w-14 rounded-md object-cover"
                />
                <div className="font-medium">{r.name}</div>
              </div>

              <div className="col-span-4 text-black/70">{r.slug}</div>

              <div className="col-span-2">
                <input
                  type="number"
                  className="w-20 rounded-md border border-black/20 px-2 py-1"
                  value={r.display_order}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setRows((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, display_order: v } : x))
                    );
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-black/60">
        Tip: Use order 1,2,3... for the sequence you want on Home.
      </p>
    </div>
  );
}
`
);

console.log("\\nDone. Restart dev server: npm run dev");
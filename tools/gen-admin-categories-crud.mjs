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

/* =========================
   API: /api/admin/categories
========================= */

writeFile(
  path.join(root, "app", "api", "admin", "categories", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      \`select id, name, slug, is_active
       from categories
       order by name asc\`
    );
    return NextResponse.json({ categories: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load categories", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = (body?.name ?? "").toString().trim();
    const slug = (body?.slug ?? "").toString().trim();
    const is_active = body?.is_active !== false;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug required" }, { status: 400 });
    }

    const res = await pool.query(
      \`insert into categories (name, slug, is_active)
       values ($1, $2, $3)
       returning id, name, slug, is_active\`,
      [name, slug, is_active]
    );

    return NextResponse.json({ category: res.rows[0] });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create category", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

/* =========================
   API: /api/admin/categories/[id]
========================= */

writeFile(
  path.join(root, "app", "api", "admin", "categories", "[id]", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await pool.query(
    \`select id, name, slug, is_active
     from categories
     where id = $1::uuid\`,
    [id]
  );

  const category = res.rows[0];
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ category });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const name = (body?.name ?? "").toString().trim();
  const slug = (body?.slug ?? "").toString().trim();
  const is_active = body?.is_active !== false;

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }

  const res = await pool.query(
    \`update categories
     set name=$1, slug=$2, is_active=$3
     where id=$4::uuid
     returning id, name, slug, is_active\`,
    [name, slug, is_active, id]
  );

  const category = res.rows[0];
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ category });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await pool.query(
    \`update products
     set category_id = null
     where category_id = $1::uuid\`,
    [id]
  );

  const res = await pool.query(
    \`delete from categories
     where id=$1::uuid
     returning id\`,
    [id]
  );

  if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
`
);

/* =========================
   Admin UI: List page
========================= */

writeFile(
  path.join(root, "app", "admin", "categories", "page.tsx"),
  `"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const [rows, setRows] = useState([]);

  async function load() {
    const res = await fetch("/api/admin/categories", { cache: "no-store" });
    const data = await res.json();
    setRows(data.categories || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link href="/admin/categories/new" className="bg-black text-white px-4 py-2 rounded-md">
          + New
        </Link>
      </div>

      <div className="space-y-2">
        {rows.map((c: any) => (
          <div key={c.id} className="flex justify-between border p-3 rounded-md">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-black/60">{c.slug}</div>
            </div>
            <Link href={\`/admin/categories/\${c.id}/edit\`} className="underline">
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
`
);

/* =========================
   New Category Page
========================= */

writeFile(
  path.join(root, "app", "admin", "categories", "new", "page.tsx"),
  `"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCategory() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function save() {
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    router.push("/admin/categories");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Category</h1>

      <input
        placeholder="Name"
        className="border px-3 py-2 w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Slug"
        className="border px-3 py-2 w-full"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <button onClick={save} className="bg-black text-white px-4 py-2 rounded-md">
        Save
      </button>
    </div>
  );
}
`
);

console.log("Categories CRUD generated.");
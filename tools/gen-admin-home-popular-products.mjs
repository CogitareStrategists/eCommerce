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

writeFile(
  path.join(root, "app", "api", "admin", "home", "popular-products", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const SECTION_KEY = 'popular_products';
const ITEM_TYPE = 'product';

export async function GET() {
  try {
    const sectionRes = await pool.query(
      \`select id from home_sections where key = $1 limit 1\`,
      [SECTION_KEY]
    );
    const sectionId = sectionRes.rows?.[0]?.id;
    if (!sectionId) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const [allRes, selectedRes] = await Promise.all([
      pool.query(\`select id, name, slug, price from products where is_active = true order by name asc\`),
      pool.query(
        \`select ref_id, display_order
         from home_section_items
         where section_id = $1
         and item_type = $2
         and is_active = true\`,
        [sectionId, ITEM_TYPE]
      ),
    ]);

    const selectedMap = new Map();
    for (const row of selectedRes.rows)
      selectedMap.set(row.ref_id, row.display_order);

    const items = allRes.rows.map((p) => ({
      ...p,
      selected: selectedMap.has(p.id),
      display_order: selectedMap.get(p.id) ?? 0,
    }));

    return NextResponse.json({ sectionId, items });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sectionId, items } = body;

    await pool.query("begin");

    await pool.query(
      \`delete from home_section_items
        where section_id = $1
        and item_type = $2\`,
      [sectionId, ITEM_TYPE]
    );

    const selected = items
      .filter((i) => i.selected)
      .map((i) => ({
        ref_id: i.id,
        display_order: Number(i.display_order) || 0,
      }))
      .sort((a, b) => a.display_order - b.display_order);

    for (const s of selected) {
      await pool.query(
        \`insert into home_section_items
         (section_id, item_type, ref_id, display_order, is_active)
         values ($1, $2, $3, $4, true)\`,
        [sectionId, ITEM_TYPE, s.ref_id, s.display_order]
      );
    }

    await pool.query("commit");
    return NextResponse.json({ ok: true, saved: selected.length });
  } catch (err) {
    await pool.query("rollback");
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
`
);

writeFile(
  path.join(root, "app", "admin", "home", "popular-products", "page.tsx"),
  `"use client";

import { useEffect, useState } from "react";

export default function AdminPopularProductsPage() {
  const [sectionId, setSectionId] = useState("");
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/home/popular-products", {
      cache: "no-store",
    });
    const data = await res.json();
    setSectionId(data.sectionId);
    setRows(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/home/popular-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, items: rows }),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Home → Most Popular Products</h1>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-4 border p-3 rounded-md">
            <input
              type="checkbox"
              checked={r.selected}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((x, idx) =>
                    idx === i ? { ...x, selected: e.target.checked } : x
                  )
                )
              }
            />
            <div className="flex-1">
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-black/60">₹ {r.price}</div>
            </div>
            <input
              type="number"
              value={r.display_order}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((x, idx) =>
                    idx === i
                      ? { ...x, display_order: Number(e.target.value) }
                      : x
                  )
                )
              }
              className="w-20 border px-2 py-1 rounded-md"
            />
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-md bg-black px-4 py-2 text-white"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
`
);

console.log("Done.");
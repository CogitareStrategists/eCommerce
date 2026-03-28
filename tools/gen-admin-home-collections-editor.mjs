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

// API: get collections + current selected for section key
writeFile(
  path.join(root, "app", "api", "admin", "home", "collections", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const sectionRes = await pool.query(
      \`select id from home_sections where key = 'collections' limit 1\`
    );
    const sectionId = sectionRes.rows?.[0]?.id;
    if (!sectionId) {
      return NextResponse.json({ error: "Section 'collections' not found" }, { status: 404 });
    }

    const [allCollectionsRes, selectedRes] = await Promise.all([
      pool.query(\`select id, name, slug, image_url from collections where is_active = true order by name asc\`),
      pool.query(
        \`select ref_id, display_order
         from home_section_items
         where section_id = $1
         and item_type = 'collection'
         and is_active = true\`,
        [sectionId]
      ),
    ]);

    const selectedMap = new Map<string, number>();
    for (const row of selectedRes.rows) selectedMap.set(row.ref_id, row.display_order);

    const collections = allCollectionsRes.rows.map((c: any) => ({
      ...c,
      selected: selectedMap.has(c.id),
      display_order: selectedMap.get(c.id) ?? 0,
    }));

    return NextResponse.json({ sectionId, collections });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load collections editor data", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const sectionId = body?.sectionId;
    const items = body?.items;

    if (!sectionId || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Replace items for this section (simple + safe)
    await pool.query("begin");

    await pool.query(
      \`delete from home_section_items
        where section_id = $1
        and item_type = 'collection'\`,
      [sectionId]
    );

    // Insert selected items only
    const selected = items
      .filter((i: any) => i.selected === true)
      .map((i: any) => ({
        ref_id: i.id,
        display_order: Number(i.display_order) || 0,
      }))
      .sort((a: any, b: any) => a.display_order - b.display_order);

    for (const s of selected) {
      await pool.query(
        \`insert into home_section_items (section_id, item_type, ref_id, display_order, is_active)
          values ($1, 'collection', $2, $3, true)\`,
        [sectionId, s.ref_id, s.display_order]
      );
    }

    await pool.query("commit");
    return NextResponse.json({ ok: true, saved: selected.length });
  } catch (err: any) {
    try {
      await pool.query("rollback");
    } catch {}
    return NextResponse.json(
      { error: "Failed to save collections section", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

// Admin page UI
writeFile(
  path.join(root, "app", "admin", "home", "collections", "page.tsx"),
  `"use client";

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
      <div>
        <h1 className="text-2xl font-bold">Home → Collections</h1>
        <p className="mt-1 text-sm text-black/70">
          Select which collections appear on the Home page and set their order.
        </p>
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
                      prev.map((x, i) =>
                        i === idx ? { ...x, selected } : x
                      )
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
                      prev.map((x, i) =>
                        i === idx ? { ...x, display_order: v } : x
                      )
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

console.log("\\nDone. Restart dev server if needed: npm run dev");
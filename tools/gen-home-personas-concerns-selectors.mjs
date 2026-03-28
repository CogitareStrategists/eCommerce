import fs from "fs";
import path from "path";

const root = process.cwd();
const w = (p) => path.join(root, p);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Wrote:", path.relative(root, filePath));
}

/**
 * API route for selecting items into a home section using home_section_items.
 * - sectionKey: home_sections.key (e.g. for_who_you_are)
 * - table: source table (personas/concerns)
 * - itemType: item_type stored in home_section_items (persona/concern)
 */
function generateHomeSelectorApi({ sectionKey, table, itemType, apiPath }) {
  writeFile(
    w(`app/api/admin/home/${apiPath}/route.ts`),
    `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

async function getSectionId() {
  const s = await pool.query(
    \`select id from home_sections where key = $1 limit 1\`,
    ["${sectionKey}"]
  );
  return s.rows[0]?.id ?? null;
}

export async function GET() {
  try {
    const sectionId = await getSectionId();
    if (!sectionId) {
      return NextResponse.json({ error: "Home section not found: ${sectionKey}" }, { status: 404 });
    }

    const [allRes, selectedRes] = await Promise.all([
      pool.query(\`select * from ${table} where is_active = true order by title asc\`),
      pool.query(
        \`select ref_id, display_order
         from home_section_items
         where section_id = $1::uuid
           and item_type = $2
           and is_active = true
         order by display_order asc\`,
        [sectionId, "${itemType}"]
      ),
    ]);

    return NextResponse.json({
      sectionKey: "${sectionKey}",
      all: allRes.rows,
      selected: selectedRes.rows, // [{ref_id, display_order}]
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load selector data", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

// Update selection + order
// body.items: [{ id: uuid, display_order: number }]
export async function POST(req: Request) {
  try {
    const sectionId = await getSectionId();
    if (!sectionId) {
      return NextResponse.json({ error: "Home section not found: ${sectionKey}" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const items = Array.isArray(body?.items) ? body.items : [];

    await pool.query("begin");

    // deactivate existing items for this section+type
    await pool.query(
      \`update home_section_items
       set is_active = false
       where section_id = $1::uuid and item_type = $2\`,
      [sectionId, "${itemType}"]
    );

    // upsert selected items as active with order
    for (const it of items) {
      const ref_id = (it?.id ?? "").toString();
      const display_order = Number(it?.display_order ?? 0);

      if (!ref_id) continue;

      // Try update first
      const upd = await pool.query(
        \`update home_section_items
         set is_active = true, display_order = $1
         where section_id = $2::uuid
           and item_type = $3
           and ref_id = $4::uuid\`,
        [display_order, sectionId, "${itemType}", ref_id]
      );

      // If nothing updated, insert
      if (upd.rowCount === 0) {
        await pool.query(
          \`insert into home_section_items (section_id, item_type, ref_id, display_order, is_active)
           values ($1::uuid, $2, $3::uuid, $4, true)\`,
          [sectionId, "${itemType}", ref_id, display_order]
        );
      }
    }

    await pool.query("commit");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try { await pool.query("rollback"); } catch {}
    return NextResponse.json(
      { error: "Failed to save selection", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
  );
}

function generateHomeSelectorPage({ title, apiPath, editBaseHref, itemLabelKey = "title" }) {
  writeFile(
    w(`app/admin/home/${apiPath}/page.tsx`),
    `"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = any;

export default function Page() {
  const [all, setAll] = useState<Row[]>([]);
  const [selectedMap, setSelectedMap] = useState<Map<string, number>>(new Map());
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setMsg(null);
    const res = await fetch("/api/admin/home/${apiPath}", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load");
      return;
    }
    setAll(data.all ?? []);
    const map = new Map<string, number>();
    for (const s of (data.selected ?? [])) {
      map.set(s.ref_id, Number(s.display_order ?? 0));
    }
    setSelectedMap(map);
  }

  useEffect(() => { load(); }, []);

  const selectedIdsOrdered = useMemo(() => {
    return Array.from(selectedMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id);
  }, [selectedMap]);

  function toggle(id: string) {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, next.size + 1);
      return next;
    });
  }

  function setOrder(id: string, order: number) {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (!next.has(id)) return next;
      next.set(id, order);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);

    const items = selectedIdsOrdered.map((id, idx) => ({
      id,
      display_order: Number(selectedMap.get(id) ?? (idx + 1)),
    }));

    const res = await fetch("/api/admin/home/${apiPath}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Save failed");
      return;
    }

    setMsg("Saved.");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">${title}</h1>
          <p className="mt-1 text-sm text-black/70">
            Select items to show on Home and control order.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/home" className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5">
            Back
          </Link>
          <Link href="/admin" className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5">
            Dashboard
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            Save
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
          <div className="col-span-1">Use</div>
          <div className="col-span-7">Title</div>
          <div className="col-span-2">Order</div>
          <div className="col-span-2 text-right">Edit</div>
        </div>

        <div className="divide-y divide-black/10">
          {all.map((r: any) => {
            const checked = selectedMap.has(r.id);
            return (
              <div key={r.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-1">
                  <input type="checkbox" checked={checked} onChange={() => toggle(r.id)} />
                </div>

                <div className="col-span-7">
                  <div className="font-medium">{r["${itemLabelKey}"]}</div>
                  <div className="text-xs text-black/60">{r.filter_key}</div>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    className="w-full rounded-md border border-black/20 px-2 py-1"
                    value={checked ? (selectedMap.get(r.id) ?? 0) : 0}
                    disabled={!checked}
                    onChange={(e) => setOrder(r.id, Number(e.target.value))}
                  />
                </div>

                <div className="col-span-2 flex justify-end">
                  <Link className="underline" href={"${editBaseHref}/" + r.id + "/edit"}>Edit</Link>
                </div>
              </div>
            );
          })}

          {all.length === 0 && (
            <div className="px-4 py-8 text-sm text-black/70">No items found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
`
  );
}

// Generate APIs + pages
generateHomeSelectorApi({
  sectionKey: "for_who_you_are",
  table: "personas",
  itemType: "persona",
  apiPath: "for_who_you_are",
});

generateHomeSelectorApi({
  sectionKey: "cure_your_concerns",
  table: "concerns",
  itemType: "concern",
  apiPath: "cure_your_concerns",
});

generateHomeSelectorPage({
  title: "Home: For Who You Are",
  apiPath: "for_who_you_are",
  editBaseHref: "/admin/personas",
});

generateHomeSelectorPage({
  title: "Home: Cure Your Concerns",
  apiPath: "cure_your_concerns",
  editBaseHref: "/admin/concerns",
});

console.log("\\nGenerated home selectors for personas + concerns. Restart: npm run dev");
"use client";

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
    const res = await fetch("/api/admin/home/for_who_you_are", { cache: "no-store" });
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

    const res = await fetch("/api/admin/home/for_who_you_are", {
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
          <h1 className="text-2xl font-bold">Home: For Who You Are</h1>
          <p className="mt-1 text-sm text-black/70">
            Select items to show on Home and control order.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/personas/new"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            + New Persona
          </Link>

          <Link
            href="/admin/home"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Back
          </Link>

          <Link
            href="/admin"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
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
                  <div className="font-medium">{r["title"]}</div>
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
                  <Link className="underline" href={"/admin/personas/" + r.id + "/edit"}>Edit</Link>
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

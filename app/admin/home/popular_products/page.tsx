"use client";

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

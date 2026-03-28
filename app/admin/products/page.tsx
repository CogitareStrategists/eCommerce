"use client";

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
                <Link className="underline" href={`/admin/products/${p.id}/edit`}>
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

"use client";

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
                  <Link className="underline" href={`/admin/collections/${c.id}/edit`}>
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

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditCollectionPage() {
  const params = useParams();
  const raw = (params as any)?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
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
    const res = await fetch(`/api/admin/collections/${id}`, { cache: "no-store" });
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

    const res = await fetch(`/api/admin/collections/${id}`, {
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

    const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
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

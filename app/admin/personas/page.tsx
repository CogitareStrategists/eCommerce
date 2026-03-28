"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PersonaList() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/admin/personas", { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows ?? []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Persona</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/home/for_who_you_are"
            className="border px-3 py-2 rounded-md hover:bg-black/5"
          >
            ← Home Manager
          </Link>

          <Link
            href="/admin"
            className="border px-3 py-2 rounded-md hover:bg-black/5"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/personas/new"
            className="bg-black text-white px-3 py-2 rounded-md"
          >
            + New
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex justify-between border p-3 rounded-md">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-black/60">{r.filter_key}</div>
            </div>
            <Link href={"/admin/personas/" + r.id + "/edit"} className="underline">
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

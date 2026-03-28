"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewPersona() {
  const router = useRouter();
  const [title,setTitle] = useState("");
  const [image_url,setImage] = useState("");
  const [filter_key,setFilter] = useState("");
  const [is_active,setActive] = useState(true);

  async function save(){
    await fetch("/api/admin/personas",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title,image_url,filter_key,is_active})
    });
    router.push("/admin/personas");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">New Persona</h1>

        <div className="flex gap-2">
          <Link
            href="/admin/home/for_who_you_are"
            className="border px-3 py-2 rounded-md hover:bg-black/5"
          >
            ← Home Manager
          </Link>

          <Link
            href="/admin/personas"
            className="border px-3 py-2 rounded-md hover:bg-black/5"
          >
            Personas
          </Link>

          <Link
            href="/admin"
            className="border px-3 py-2 rounded-md hover:bg-black/5"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <input className="border p-2 w-full" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Image URL" value={image_url} onChange={e=>setImage(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Filter Key" value={filter_key} onChange={e=>setFilter(e.target.value)} />
        <label className="flex gap-2 items-center">
          <input type="checkbox" checked={is_active} onChange={e=>setActive(e.target.checked)} />
          Active
        </label>
        <button onClick={save} className="bg-black text-white px-4 py-2 rounded-md">Save</button>
      </div>
    </div>
  );
}

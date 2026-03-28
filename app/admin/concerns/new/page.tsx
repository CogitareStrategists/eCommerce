"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewConcern() {
  const router = useRouter();
  const [title,setTitle] = useState("");
  const [image_url,setImage] = useState("");
  const [filter_key,setFilter] = useState("");
  const [is_active,setActive] = useState(true);

  async function save(){
    await fetch("/api/admin/concerns",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title,image_url,filter_key,is_active})
    });
    router.push("/admin/concerns");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">New Concern</h1>
        <Link href="/admin/concerns" className="border px-3 py-2 rounded-md">Back</Link>
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

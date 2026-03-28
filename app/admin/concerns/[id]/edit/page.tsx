"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function EditConcern() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [title,setTitle] = useState("");
  const [image_url,setImage] = useState("");
  const [filter_key,setFilter] = useState("");
  const [is_active,setActive] = useState(true);

  useEffect(()=>{
    (async()=>{
      const res = await fetch("/api/admin/concerns/"+id);
      const data = await res.json();
      const r = data.row;
      setTitle(r.title);
      setImage(r.image_url);
      setFilter(r.filter_key);
      setActive(r.is_active);
    })();
  },[id]);

  async function save(){
    await fetch("/api/admin/concerns/"+id,{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title,image_url,filter_key,is_active})
    });
    router.push("/admin/concerns");
  }

  async function del(){
    if(!confirm("Delete?")) return;
    await fetch("/api/admin/concerns/"+id,{method:"DELETE"});
    router.push("/admin/concerns");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Edit Concern</h1>
        <Link href="/admin/concerns" className="border px-3 py-2 rounded-md">Back</Link>
      </div>

      <div className="space-y-3">
        <input className="border p-2 w-full" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="border p-2 w-full" value={image_url} onChange={e=>setImage(e.target.value)} />
        <input className="border p-2 w-full" value={filter_key} onChange={e=>setFilter(e.target.value)} />
        <label className="flex gap-2 items-center">
          <input type="checkbox" checked={is_active} onChange={e=>setActive(e.target.checked)} />
          Active
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="bg-black text-white px-4 py-2 rounded-md">Save</button>
          <button onClick={del} className="border border-red-500 text-red-600 px-4 py-2 rounded-md">Delete</button>
        </div>
      </div>
    </div>
  );
}

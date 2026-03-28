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

/* =====================================================
   GENERIC CRUD API GENERATOR
===================================================== */

function generateApi(entity, table) {
  // list + create
  writeFile(
    w(`app/api/admin/${entity}/route.ts`),
`import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const res = await pool.query(
    \`select * from ${table} order by created_at desc nulls last\`
  );
  return NextResponse.json({ rows: res.rows });
}

export async function POST(req: Request) {
  const body = await req.json();

  const res = await pool.query(
    \`insert into ${table}
     (title, image_url, filter_key, is_active)
     values ($1,$2,$3,$4)
     returning *\`,
    [body.title, body.image_url, body.filter_key, body.is_active !== false]
  );

  return NextResponse.json({ row: res.rows[0] });
}
`
  );

  // get/update/delete
  writeFile(
    w(`app/api/admin/${entity}/[id]/route.ts`),
`import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await pool.query(
    \`select * from ${table} where id=$1::uuid\`,
    [id]
  );
  if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ row: res.rows[0] });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const res = await pool.query(
    \`update ${table}
     set title=$1, image_url=$2, filter_key=$3, is_active=$4
     where id=$5::uuid
     returning *\`,
    [body.title, body.image_url, body.filter_key, body.is_active !== false, id]
  );

  if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ row: res.rows[0] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await pool.query(\`delete from ${table} where id=$1::uuid\`, [id]);
  return NextResponse.json({ ok: true });
}
`
  );
}

/* =====================================================
   GENERIC ADMIN UI
===================================================== */

function generateAdminPages(entity, label) {
  // list page
  writeFile(
    w(`app/admin/${entity}/page.tsx`),
`"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ${label}List() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/admin/${entity}", { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows ?? []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">${label}</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="border px-3 py-2 rounded-md">Dashboard</Link>
          <Link href="/admin/${entity}/new" className="bg-black text-white px-3 py-2 rounded-md">+ New</Link>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex justify-between border p-3 rounded-md">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-black/60">{r.filter_key}</div>
            </div>
            <Link href={"/admin/${entity}/" + r.id + "/edit"} className="underline">
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
`
  );

  // new page
  writeFile(
    w(`app/admin/${entity}/new/page.tsx`),
`"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function New${label}() {
  const router = useRouter();
  const [title,setTitle] = useState("");
  const [image_url,setImage] = useState("");
  const [filter_key,setFilter] = useState("");
  const [is_active,setActive] = useState(true);

  async function save(){
    await fetch("/api/admin/${entity}",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title,image_url,filter_key,is_active})
    });
    router.push("/admin/${entity}");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">New ${label}</h1>
        <Link href="/admin/${entity}" className="border px-3 py-2 rounded-md">Back</Link>
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
`
  );

  // edit page
  writeFile(
    w(`app/admin/${entity}/[id]/edit/page.tsx`),
`"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Edit${label}() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [title,setTitle] = useState("");
  const [image_url,setImage] = useState("");
  const [filter_key,setFilter] = useState("");
  const [is_active,setActive] = useState(true);

  useEffect(()=>{
    (async()=>{
      const res = await fetch("/api/admin/${entity}/"+id);
      const data = await res.json();
      const r = data.row;
      setTitle(r.title);
      setImage(r.image_url);
      setFilter(r.filter_key);
      setActive(r.is_active);
    })();
  },[id]);

  async function save(){
    await fetch("/api/admin/${entity}/"+id,{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title,image_url,filter_key,is_active})
    });
    router.push("/admin/${entity}");
  }

  async function del(){
    if(!confirm("Delete?")) return;
    await fetch("/api/admin/${entity}/"+id,{method:"DELETE"});
    router.push("/admin/${entity}");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Edit ${label}</h1>
        <Link href="/admin/${entity}" className="border px-3 py-2 rounded-md">Back</Link>
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
`
  );
}

/* =====================================================
   EXECUTE
===================================================== */

generateApi("personas", "personas");
generateApi("concerns", "concerns");

generateAdminPages("personas", "Persona");
generateAdminPages("concerns", "Concern");

console.log("Phase A generated.");
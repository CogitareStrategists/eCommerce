import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_token")?.value ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await pool.query(
      `select
        id,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
        created_at
       from user_addresses
       where user_id = $1::uuid
       order by is_default desc, created_at desc`,
      [userId]
    );

    return NextResponse.json({ addresses: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load addresses",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_token")?.value ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const full_name = (body?.full_name ?? "").toString().trim();
    const phone = (body?.phone ?? "").toString().trim();
    const address_line1 = (body?.address_line1 ?? "").toString().trim();
    const address_line2 = (body?.address_line2 ?? "").toString().trim();
    const city = (body?.city ?? "").toString().trim();
    const state = (body?.state ?? "").toString().trim();
    const postal_code = (body?.postal_code ?? "").toString().trim();
    const country = (body?.country ?? "India").toString().trim();
    const is_default = !!body?.is_default;

    if (!full_name || !address_line1 || !city || !state || !postal_code) {
      return NextResponse.json(
        { error: "Please fill all required address fields" },
        { status: 400 }
      );
    }

    await pool.query("begin");

    if (is_default) {
      await pool.query(
        `update user_addresses
         set is_default = false
         where user_id = $1::uuid`,
        [userId]
      );
    }

    const res = await pool.query(
      `insert into user_addresses (
        user_id,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      returning
        id,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
        created_at`,
      [
        userId,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
      ]
    );

    await pool.query("commit");

    return NextResponse.json({ address: res.rows[0] });
  } catch (err: any) {
    try {
      await pool.query("rollback");
    } catch {}
    return NextResponse.json(
      {
        error: "Failed to create address",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
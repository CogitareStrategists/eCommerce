import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      `update user_addresses
       set
         full_name = $1,
         phone = $2,
         address_line1 = $3,
         address_line2 = $4,
         city = $5,
         state = $6,
         postal_code = $7,
         country = $8,
         is_default = $9
       where id = $10::uuid
       and user_id = $11::uuid
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
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
        id,
        userId,
      ]
    );

    await pool.query("commit");

    const address = res.rows[0];
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (err: any) {
    try {
      await pool.query("rollback");
    } catch {}
    return NextResponse.json(
      {
        error: "Failed to update address",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const userId = cookieStore.get("user_token")?.value ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await pool.query(
      `delete from user_addresses
       where id = $1::uuid
       and user_id = $2::uuid
       returning id`,
      [id, userId]
    );

    if (!res.rows[0]) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to delete address",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
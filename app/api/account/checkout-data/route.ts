import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_token")?.value ?? null;

    if (!userId) {
      return NextResponse.json({
        user: null,
        addresses: [],
      });
    }

    const [userRes, addressesRes] = await Promise.all([
      pool.query(
        `select id, full_name, email
         from users
         where id = $1::uuid
         limit 1`,
        [userId]
      ),
      pool.query(
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
          is_default
         from user_addresses
         where user_id = $1::uuid
         order by is_default desc, created_at desc`,
        [userId]
      ),
    ]);

    return NextResponse.json({
      user: userRes.rows[0] ?? null,
      addresses: addressesRes.rows ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load checkout data",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

type ConcernRow = {
  id: string;
  title: string;
  is_active: boolean;
};

type PersonaRow = {
  id: string;
  title: string;
  is_active: boolean;
};

type SelectedConcernRow = {
  concern_id: string;
};

type SelectedPersonaRow = {
  persona_id: string;
};

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [concernsRes, personasRes, selectedConcernsRes, selectedPersonasRes] =
      await Promise.all([
        pool.query<ConcernRow>(
          `select id, title, is_active
           from concerns
           where is_active = true
           order by title asc`
        ),
        pool.query<PersonaRow>(
          `select id, title, is_active
           from personas
           where is_active = true
           order by title asc`
        ),
        pool.query<SelectedConcernRow>(
          `select concern_id
           from product_concerns
           where product_id = $1::uuid`,
          [id]
        ),
        pool.query<SelectedPersonaRow>(
          `select persona_id
           from product_personas
           where product_id = $1::uuid`,
          [id]
        ),
      ]);

    const selectedConcernIds = selectedConcernsRes.rows.map(
      (row: SelectedConcernRow) => row.concern_id
    );
    const selectedPersonaIds = selectedPersonasRes.rows.map(
      (row: SelectedPersonaRow) => row.persona_id
    );

    return NextResponse.json({
      concerns: concernsRes.rows,
      personas: personasRes.rows,
      selectedConcernIds,
      selectedPersonaIds,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load product mappings",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);

    const concernIds: string[] = Array.isArray(body?.concernIds)
      ? body.concernIds
      : [];
    const personaIds: string[] = Array.isArray(body?.personaIds)
      ? body.personaIds
      : [];

    await pool.query("begin");

    await pool.query(
      `delete from product_concerns
       where product_id = $1::uuid`,
      [id]
    );

    await pool.query(
      `delete from product_personas
       where product_id = $1::uuid`,
      [id]
    );

    for (const concernId of concernIds) {
      await pool.query(
        `insert into product_concerns (product_id, concern_id)
         values ($1::uuid, $2::uuid)`,
        [id, concernId]
      );
    }

    for (const personaId of personaIds) {
      await pool.query(
        `insert into product_personas (product_id, persona_id)
         values ($1::uuid, $2::uuid)`,
        [id, personaId]
      );
    }

    await pool.query("commit");

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try {
      await pool.query("rollback");
    } catch {}

    return NextResponse.json(
      {
        error: "Failed to save product mappings",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
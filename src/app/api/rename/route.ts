import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Rename an owned cutout. Changes the display `name` only — the slug and
 * storage path stay stable so the stored file never has to move. RLS scopes
 * the update to the caller's own rows.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: string; name?: string }
    | null;
  const name = body?.name?.trim();
  if (!body?.id || !name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }
  if (name.length > 120) {
    return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("items")
    .update({ name })
    .eq("id", body.id)
    .select("id, name")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, name: data.name });
}

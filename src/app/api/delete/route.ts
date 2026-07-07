import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // RLS scopes this select to the user's own rows, which proves ownership.
  const { data: item } = await supabase
    .from("items")
    .select("id, storage_path")
    .eq("id", body.id)
    .maybeSingle();
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabase.from("items").delete().eq("id", item.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const admin = createAdminClient();
  await admin.storage.from("cutouts").remove([item.storage_path]);

  return NextResponse.json({ ok: true });
}

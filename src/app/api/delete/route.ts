import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentQuotaMonth } from "@/lib/plans";

export const runtime = "nodejs";

/** "Try a different image" may refund quota, but only this soon after the add. */
const REFUND_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: string; refund?: boolean }
    | null;
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // RLS scopes this select to the user's own rows, which proves ownership.
  const { data: item } = await supabase
    .from("items")
    .select("id, storage_path, added_at")
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

  // Rejecting a just-made cutout gives the quota back. The window keeps this
  // an undo affordance rather than a way to farm free cutouts, and the SQL
  // function floors at zero so a refund can never go negative.
  const fresh = Date.now() - new Date(item.added_at).getTime() < REFUND_WINDOW_MS;
  if (body.refund && fresh) {
    await admin.rpc("refund_web_bg_quota", {
      p_user: user.id,
      p_month: currentQuotaMonth(),
    });
  }

  return NextResponse.json({ ok: true });
}

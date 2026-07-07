import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Permanently delete the signed-in user's account:
 * 1. Cancel any active Stripe subscription immediately.
 * 2. Remove all of the user's storage objects.
 * 3. Delete the auth user; items/profiles/bg_removals/stripe_subscriptions
 *    rows cascade via their FKs to auth.users.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Stripe: cancel now so a deleted account cannot keep getting charged.
  const { data: sub } = await admin
    .from("stripe_subscriptions")
    .select("stripe_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (
    sub?.stripe_subscription_id &&
    sub.status &&
    ["active", "trialing", "past_due"].includes(sub.status)
  ) {
    try {
      await getStripe().subscriptions.cancel(sub.stripe_subscription_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe cancel failed";
      return NextResponse.json(
        { error: `Could not cancel your subscription: ${message}. Account not deleted.` },
        { status: 500 },
      );
    }
  }

  // 2. Storage: paths are <user_id>/<category>/<slug>.png. Two-level walk.
  try {
    const { data: folders } = await admin.storage.from("cutouts").list(user.id);
    const paths: string[] = [];
    for (const folder of folders ?? []) {
      if (folder.id) {
        // A file directly under the user folder (unexpected but possible).
        paths.push(`${user.id}/${folder.name}`);
        continue;
      }
      const { data: files } = await admin.storage
        .from("cutouts")
        .list(`${user.id}/${folder.name}`, { limit: 1000 });
      for (const file of files ?? []) {
        paths.push(`${user.id}/${folder.name}/${file.name}`);
      }
    }
    if (paths.length > 0) {
      await admin.storage.from("cutouts").remove(paths);
    }
  } catch {
    // Orphaned objects are invisible (row cascade) and cheap; do not block deletion.
  }

  // 3. Auth user: cascades all database rows.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

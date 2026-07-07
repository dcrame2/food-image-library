import { NextResponse } from "next/server";
import { fetchAndRemoveBackground, BgEngine } from "@/lib/bg-removal";
import { slugify } from "@/lib/slugify";
import { UNSORTED } from "@/lib/collections";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWebPlan } from "@/lib/billing";
import { currentQuotaMonth } from "@/lib/plans";
import { fromOwnedRow } from "@/lib/items";

export const runtime = "nodejs";
export const maxDuration = 120;

interface AddBody {
  url: string;
  name: string;
  /** Optional free-text collection name; slugified server-side. */
  collection?: string;
  tags?: string[];
  engine?: BgEngine;
  source?: string;
}

const imglyEnabled = () => process.env.BG_ENGINE_IMGLY_ENABLED !== "false";

function resolveEngine(requested: BgEngine, planId: "free" | "pro"): BgEngine {
  if (requested === "skip") return "skip";
  if (planId === "free") {
    // Free tier never runs the paid remove.bg engine.
    return imglyEnabled() ? "imgly" : "auto";
  }
  if (requested === "imgly" && !imglyEnabled()) return "auto";
  return requested;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: AddBody;
  try {
    body = (await request.json()) as AddBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.url || !body.name) {
    return NextResponse.json(
      { error: "url and name are required" },
      { status: 400 },
    );
  }

  const collection = slugify(body.collection ?? "") || UNSORTED;

  const slug = slugify(body.name);
  if (!slug) {
    return NextResponse.json(
      { error: "Could not derive slug from name" },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("items")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .eq("category", collection)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: `"${body.name}" is already in your library` },
      { status: 409 },
    );
  }

  const admin = createAdminClient();
  const plan = await getWebPlan(user.id);
  const engine = resolveEngine(body.engine ?? "auto", plan.id);
  const month = currentQuotaMonth();
  let quotaConsumed = false;

  if (engine !== "skip") {
    const { data: quota, error: quotaError } = await admin.rpc(
      "consume_web_bg_quota",
      { p_user: user.id, p_month: month, p_limit: plan.cutoutsPerMonth },
    );
    if (quotaError) {
      return NextResponse.json({ error: quotaError.message }, { status: 500 });
    }
    const result = Array.isArray(quota) ? quota[0] : quota;
    if (!result?.allowed) {
      return NextResponse.json(
        {
          error: `You have used all ${plan.cutoutsPerMonth} cutouts on the ${plan.label} plan this month.`,
          quota: { used: result?.used ?? plan.cutoutsPerMonth, limit: plan.cutoutsPerMonth },
          upgrade: plan.id === "free",
        },
        { status: 429 },
      );
    }
    quotaConsumed = true;
  }

  const refund = async () => {
    if (!quotaConsumed) return;
    await admin.rpc("refund_web_bg_quota", { p_user: user.id, p_month: month });
  };

  const storagePath = `${user.id}/${collection}/${slug}.png`;

  try {
    const png = await fetchAndRemoveBackground(body.url, { engine });

    const { error: uploadError } = await admin.storage
      .from("cutouts")
      .upload(storagePath, png, { contentType: "image/png", upsert: false });
    if (uploadError) {
      await refund();
      const exists = /already exists|duplicate/i.test(uploadError.message);
      return NextResponse.json(
        { error: exists ? `"${body.name}" is already in your library` : uploadError.message },
        { status: exists ? 409 : 500 },
      );
    }

    const { data: row, error: insertError } = await supabase
      .from("items")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        slug,
        category: collection,
        tags: body.tags ?? [],
        storage_path: storagePath,
        source_url: body.source ?? body.url,
        bytes: png.byteLength,
      })
      .select()
      .single();
    if (insertError || !row) {
      await admin.storage.from("cutouts").remove([storagePath]);
      await refund();
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to save item" },
        { status: 500 },
      );
    }

    return NextResponse.json({ item: fromOwnedRow(row) });
  } catch (err) {
    await refund();
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

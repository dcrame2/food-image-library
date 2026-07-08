import { NextResponse } from "next/server";
import {
  fetchAndRemoveBackground,
  processBuffer,
  BgEngine,
} from "@/lib/bg-removal";
import { slugify } from "@/lib/slugify";
import { UNSORTED } from "@/lib/collections";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWebPlan } from "@/lib/billing";
import { currentQuotaMonth } from "@/lib/plans";
import { fromOwnedRow } from "@/lib/items";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

interface AddInput {
  name: string;
  collection?: string;
  tags?: string[];
  engine?: BgEngine;
  /** One of `url` or `file` must be present. */
  url?: string;
  source?: string;
  file?: Buffer;
}

const imglyEnabled = () => process.env.BG_ENGINE_IMGLY_ENABLED !== "false";

/**
 * Every plan runs the premium remove.bg engine by default ("auto" prefers
 * remove.bg and falls back to the local model only if its quota is hit).
 * The local engine stays available as an explicit opt-in where it can run.
 */
function resolveEngine(requested: BgEngine): BgEngine {
  if (requested === "skip") return "skip";
  if (requested === "imgly" && imglyEnabled()) return "imgly";
  return "auto";
}

async function parseInput(request: Request): Promise<AddInput | { error: string }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return { error: "No file uploaded" };
    if (!file.type.startsWith("image/")) return { error: "File must be an image" };
    if (file.size > MAX_UPLOAD_BYTES) return { error: "Image must be under 15MB" };

    const name = String(form.get("name") ?? "").trim();
    const rawTags = form.get("tags");
    let tags: string[] | undefined;
    if (typeof rawTags === "string" && rawTags) {
      try {
        tags = JSON.parse(rawTags);
      } catch {
        tags = undefined;
      }
    }

    return {
      name,
      collection: (form.get("collection") as string) ?? undefined,
      engine: (form.get("engine") as BgEngine) ?? undefined,
      tags,
      file: Buffer.from(await file.arrayBuffer()),
    };
  }

  try {
    return (await request.json()) as AddInput;
  } catch {
    return { error: "Invalid request body" };
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = await parseInput(request);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed;

  if (!body.name || (!body.url && !body.file)) {
    return NextResponse.json(
      { error: "name and an image (url or file) are required" },
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
  const engine = resolveEngine(body.engine ?? "auto");
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
    // Uploaded file: process bytes directly. URL: fetch server-side first.
    const png = body.file
      ? await processBuffer(body.file, { engine })
      : await fetchAndRemoveBackground(body.url!, { engine });

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
        source_url: body.file ? null : (body.source ?? body.url ?? null),
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

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { UNSORTED } from "@/lib/collections";
import { fromOwnedRow } from "@/lib/items";

export const runtime = "nodejs";

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

/**
 * Edit an owned cutout's name, collection, or tags. The slug and storage path
 * stay stable so the stored file never has to move — `category` is just a
 * column. RLS scopes the update to the caller's own rows.
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
    | { id?: string; name?: string; collection?: string; tags?: unknown }
    | null;
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const patch: { name?: string; category?: string; tags?: string[] } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    if (name.length > 120) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }
    patch.name = name;
  }

  if (body.collection !== undefined) {
    patch.category = slugify(body.collection) || UNSORTED;
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
      return NextResponse.json({ error: "tags must be a list of strings" }, { status: 400 });
    }
    const tags = [
      ...new Set(
        (body.tags as string[])
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0 && t.length <= MAX_TAG_LENGTH),
      ),
    ].slice(0, MAX_TAGS);
    patch.tags = tags;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("items")
    .update(patch)
    .eq("id", body.id)
    .select()
    .maybeSingle();

  if (error) {
    // Unique (user, slug, category) collision when moving collections.
    const duplicate = error.code === "23505";
    return NextResponse.json(
      {
        error: duplicate
          ? "You already have a cutout with this name in that collection."
          : error.message,
      },
      { status: duplicate ? 409 : 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ item: fromOwnedRow(data) });
}

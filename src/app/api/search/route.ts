import { NextResponse } from "next/server";
import { searchImages, ImageSearchConfigError } from "@/lib/serper";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q param" }, { status: 400 });
  }

  try {
    const results = await searchImages(q, { transparent: true, num: 8 });
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof ImageSearchConfigError) {
      return NextResponse.json(
        { error: err.message, code: "SEARCH_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { searchImages, CSEConfigError } from "@/lib/google-cse";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q param" }, { status: 400 });
  }

  try {
    const results = await searchImages(q, { transparent: true, num: 8 });
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof CSEConfigError) {
      return NextResponse.json({ error: err.message, code: "CSE_NOT_CONFIGURED" }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

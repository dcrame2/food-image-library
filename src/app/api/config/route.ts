import { NextResponse } from "next/server";
import { isRemoveBgConfigured } from "@/lib/remove-bg";
import { isImageSearchConfigured } from "@/lib/serper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    removeBgConfigured: isRemoveBgConfigured(),
    searchConfigured: isImageSearchConfigured(),
  });
}

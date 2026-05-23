import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readCatalog, writeCatalog } from "@/lib/catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const catalog = await readCatalog();
  const idx = catalog.items.findIndex((i) => i.id === body.id);
  if (idx < 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [removed] = catalog.items.splice(idx, 1);
  await writeCatalog(catalog);

  const absolute = path.join(process.cwd(), "public", removed.file.replace(/^\//, ""));
  await fs.unlink(absolute).catch(() => {});

  return NextResponse.json({ ok: true });
}

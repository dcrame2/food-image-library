import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { fetchAndRemoveBackground } from "@/lib/bg-removal";
import {
  foodFilePath,
  slugify,
  upsertItem,
  hasItem,
  FoodItem,
} from "@/lib/catalog";
import { isCategoryId } from "@/lib/categories";

export const runtime = "nodejs";
export const maxDuration = 120;

interface AddBody {
  url: string;
  name: string;
  category: string;
  tags?: string[];
  skipBgRemoval?: boolean;
  source?: string;
}

export async function POST(request: Request) {
  let body: AddBody;
  try {
    body = (await request.json()) as AddBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.url || !body.name || !body.category) {
    return NextResponse.json(
      { error: "url, name, and category are required" },
      { status: 400 },
    );
  }
  if (!isCategoryId(body.category)) {
    return NextResponse.json({ error: `Unknown category: ${body.category}` }, { status: 400 });
  }

  const slug = slugify(body.name);
  if (!slug) {
    return NextResponse.json({ error: "Could not derive slug from name" }, { status: 400 });
  }

  if (await hasItem(slug)) {
    return NextResponse.json(
      { error: `Item with id "${slug}" already exists` },
      { status: 409 },
    );
  }

  try {
    const png = await fetchAndRemoveBackground(body.url, { skip: body.skipBgRemoval });
    const { absolute, publicPath } = foodFilePath(body.category, slug);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, png);

    const item: FoodItem = {
      id: slug,
      name: body.name,
      category: body.category,
      tags: body.tags ?? [],
      file: publicPath,
      source: body.source ?? body.url,
      added: new Date().toISOString().slice(0, 10),
    };
    await upsertItem(item);
    return NextResponse.json({ item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import JSZip from "jszip";
import { Plus, Search, Download, CheckSquare, Square, X } from "lucide-react";
import clsx from "clsx";
import { FoodItem } from "@/lib/catalog";
import { CategoryId } from "@/lib/categories";
import { FoodGrid } from "@/components/food-grid";
import { CategorySidebar } from "@/components/category-sidebar";
import { AddFoodDialog } from "@/components/add-food-dialog";

export default function HomePage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCats, setSelectedCats] = useState<Set<CategoryId>>(new Set());
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const item of items) {
      out[item.category] = (out[item.category] ?? 0) + 1;
    }
    return out;
  }, [items]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) item.tags.forEach((t) => set.add(t));
    return [...set].sort();
  }, [items]);

  const tagCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const item of items) {
      for (const t of item.tags) out[t] = (out[t] ?? 0) + 1;
    }
    return out;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCats.size > 0 && !selectedCats.has(item.category)) return false;
      if (activeTags.size > 0 && ![...activeTags].every((t) => item.tags.includes(t))) return false;
      if (q) {
        const hay = `${item.name} ${item.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, selectedCats, activeTags]);

  function toggleCategory(id: CategoryId) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function downloadOne(item: FoodItem) {
    const a = document.createElement("a");
    a.href = item.file;
    a.download = `${item.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function downloadSelectedAsZip() {
    if (selectedIds.size === 0) return;
    const zip = new JSZip();
    const targets = items.filter((i) => selectedIds.has(i.id));
    await Promise.all(
      targets.map(async (item) => {
        const res = await fetch(item.file);
        const blob = await res.blob();
        zip.file(`${item.category}/${item.id}.png`, blob);
      }),
    );
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `food-images-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function deleteItem(item: FoodItem) {
    if (!confirm(`Delete "${item.name}" from the library?`)) return;
    const res = await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur">
        <h1 className="hidden text-base font-semibold sm:block">Food Library</h1>
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or tag…"
            className="w-full rounded-md border border-white/10 bg-card py-2 pr-3 pl-8 text-sm outline-none focus:border-primary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectMode((m) => !m);
              setSelectedIds(new Set());
            }}
            className={clsx(
              "flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors",
              selectMode
                ? "border-primary bg-primary/15 text-primary"
                : "border-white/10 text-muted-foreground hover:text-foreground",
            )}
          >
            {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            <span className="hidden sm:inline">{selectMode ? "Selecting" : "Select"}</span>
          </button>

          {selectMode && selectedIds.size > 0 && (
            <button
              type="button"
              onClick={downloadSelectedAsZip}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Zip ({selectedIds.size})
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Food</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden overflow-y-auto md:block">
          <CategorySidebar
            counts={counts}
            totalCount={items.length}
            selected={selectedCats}
            onToggle={toggleCategory}
            onClear={() => setSelectedCats(new Set())}
            activeTags={activeTags}
            availableTags={availableTags}
            tagCounts={tagCounts}
            onToggleTag={toggleTag}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              Loading…
            </div>
          ) : (
            <>
              <div className="mb-3 text-xs text-muted-foreground">
                {filteredItems.length} of {items.length}
              </div>
              <FoodGrid
                items={filteredItems}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onDownload={downloadOne}
                onDelete={deleteItem}
              />
            </>
          )}
        </main>
      </div>

      <AddFoodDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={(item) => {
          setItems((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
        }}
      />
    </div>
  );
}

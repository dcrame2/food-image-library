"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import clsx from "clsx";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { fromOwnedRow, fromPublicRow, type LibraryItem } from "@/lib/items";
import { UNSORTED, collectionLabel } from "@/lib/collections";
import { saveItem, copyItemToClipboard } from "@/lib/download";
import type { Me } from "@/lib/me";
import { AppHeader } from "@/components/app/app-header";
import { FilterPanel, type Source } from "@/components/app/filter-panel";
import { FilterDrawer } from "@/components/app/filter-drawer";
import { ItemGrid } from "@/components/app/item-grid";
import { ItemDetailSheet } from "@/components/app/item-detail-sheet";
import { AddItemDialog } from "@/components/app/add-item-dialog";
import { GridSkeleton, NoResults, EmptyPersonalLibrary } from "@/components/app/empty-state";

const FREE_ZIP_LIMIT = 10;

export default function LibraryPage() {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);

  const [source, setSource] = useState<Source>("all");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [starterCat, setStarterCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [detailItem, setDetailItem] = useState<LibraryItem | null>(null);

  const loadItems = useCallback(async () => {
    const [owned, starter] = await Promise.all([
      supabase.from("items").select("*").order("added_at", { ascending: false }),
      supabase.from("public_items").select("*").order("name"),
    ]);
    if (owned.error || starter.error) {
      toast.error(owned.error?.message ?? starter.error?.message ?? "Failed to load library");
    }
    setItems([
      ...(owned.data ?? []).map(fromOwnedRow),
      ...(starter.data ?? []).map(fromPublicRow),
    ]);
    setLoading(false);
  }, [supabase]);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.ok) setMe(await res.json());
    } catch {
      // Non-fatal: quota badge just stays empty.
    }
  }, []);

  useEffect(() => {
    // Initial data load: state updates land after the network round trip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
    loadMe();
  }, [loadItems, loadMe]);

  const ownedItems = useMemo(() => items.filter((i) => i.owned), [items]);
  const starterItems = useMemo(() => items.filter((i) => !i.owned), [items]);

  // The user's collections, derived from their own items.
  const collections = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of ownedItems) {
      if (item.category === UNSORTED) continue;
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }, [ownedItems]);

  // Starter pack categories, shown as chips only while browsing the starter pack.
  const starterCats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of starterItems) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count);
  }, [starterItems]);

  const scopedItems = useMemo(() => {
    if (activeCollection) {
      return ownedItems.filter((i) => i.category === activeCollection);
    }
    if (source === "mine") return ownedItems;
    if (source === "starter") {
      return starterCat
        ? starterItems.filter((i) => i.category === starterCat)
        : starterItems;
    }
    return items;
  }, [items, ownedItems, starterItems, source, activeCollection, starterCat]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scopedItems;
    return scopedItems.filter((item) =>
      `${item.name} ${item.tags.join(" ")}`.toLowerCase().includes(q),
    );
  }, [scopedItems, query]);

  const activeFilterCount = (activeCollection ? 1 : 0) + (starterCat ? 1 : 0);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setActiveCollection(null);
    setStarterCat(null);
  }

  async function handleSave(item: LibraryItem) {
    const result = await saveItem(item);
    if (result === "downloaded") toast.success("Downloading");
    else if (result === "shared") toast.success("Saved");
  }

  async function handleCopy(item: LibraryItem) {
    const ok = await copyItemToClipboard(item);
    if (ok) toast.success("Copied to clipboard");
    else toast.error("Could not copy on this browser");
  }

  async function doDelete(item: LibraryItem) {
    const res = await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`Deleted "${item.name}"`);
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Delete failed");
    }
  }

  function confirmDelete(item: LibraryItem) {
    toast(`Delete "${item.name}"?`, {
      action: { label: "Delete", onClick: () => doDelete(item) },
    });
  }

  async function downloadSelectedAsZip() {
    if (selectedIds.size === 0) return;
    if (me?.plan !== "pro" && selectedIds.size > FREE_ZIP_LIMIT) {
      toast.error(`Free plan zips up to ${FREE_ZIP_LIMIT} cutouts at a time. Pro is unlimited.`);
      return;
    }
    const targets = items.filter((i) => selectedIds.has(i.id));
    const zipToast = toast.loading(`Zipping ${targets.length} cutouts...`);
    try {
      const zip = new JSZip();
      await Promise.all(
        targets.map(async (item) => {
          const res = await fetch(item.publicUrl);
          const blob = await res.blob();
          zip.file(`${item.category}/${item.slug}.png`, blob);
        }),
      );
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cutouts-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Zip ready", { id: zipToast });
      setSelectMode(false);
      setSelectedIds(new Set());
    } catch {
      toast.error("Zip failed", { id: zipToast });
    }
  }

  const filterPanelProps = {
    source,
    onSourceChange: (s: Source) => {
      setSource(s);
      setStarterCat(null);
    },
    collections,
    activeCollection,
    onCollectionChange: setActiveCollection,
    totals: { all: items.length, starter: starterItems.length, mine: ownedItems.length },
  };

  const showStarterChips =
    !activeCollection && source === "starter" && starterCats.length > 1;

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader
        query={query}
        onQueryChange={setQuery}
        selectMode={selectMode}
        onToggleSelectMode={() => {
          setSelectMode((m) => !m);
          setSelectedIds(new Set());
        }}
        selectedCount={selectedIds.size}
        onZip={downloadSelectedAsZip}
        onAdd={() => setShowAdd(true)}
        onOpenFilters={() => setShowFilters(true)}
        activeFilterCount={activeFilterCount}
        me={me}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-card/50 md:block">
          <FilterPanel {...filterPanelProps} />
        </aside>

        <main className="flex-1 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            {/* Mobile source switcher; desktop uses the sidebar. */}
            <div className="flex rounded-lg border border-border p-0.5 md:hidden">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "starter", label: "Starter" },
                  { id: "mine", label: "Mine" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSource(s.id);
                    setActiveCollection(null);
                    setStarterCat(null);
                  }}
                  className={clsx(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    source === s.id && !activeCollection
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <span className="hidden text-sm font-medium md:block">
              {activeCollection
                ? collectionLabel(activeCollection)
                : source === "starter"
                  ? "Starter pack"
                  : source === "mine"
                    ? "My cutouts"
                    : "All cutouts"}
            </span>
            <span className="text-xs text-muted-foreground">
              {filteredItems.length} of {scopedItems.length}
            </span>
          </div>

          {showStarterChips && (
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              <button
                type="button"
                onClick={() => setStarterCat(null)}
                className={clsx(
                  "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
                  !starterCat
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                All
              </button>
              {starterCats.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setStarterCat(starterCat === c.slug ? null : c.slug)}
                  className={clsx(
                    "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
                    starterCat === c.slug
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {collectionLabel(c.slug)}
                  <span className="ml-1 opacity-60">{c.count}</span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <GridSkeleton />
          ) : (source === "mine" || activeCollection) && ownedItems.length === 0 ? (
            <EmptyPersonalLibrary onAdd={() => setShowAdd(true)} />
          ) : filteredItems.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <ItemGrid
              items={filteredItems}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onOpen={setDetailItem}
              onSave={handleSave}
              onDelete={confirmDelete}
            />
          )}
        </main>
      </div>

      <FilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        resultCount={filteredItems.length}
        {...filterPanelProps}
      />

      <ItemDetailSheet
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onSave={handleSave}
        onCopy={handleCopy}
        onDelete={doDelete}
      />

      {showAdd && (
        <AddItemDialog
          onClose={() => setShowAdd(false)}
          me={me}
          collections={collections.map((c) => c.slug)}
          onAdded={(item) => {
            setItems((prev) => [item, ...prev]);
            setSource("mine");
            setActiveCollection(null);
            setStarterCat(null);
            loadMe();
            toast.success(`Added "${item.name}"`);
          }}
        />
      )}
    </div>
  );
}

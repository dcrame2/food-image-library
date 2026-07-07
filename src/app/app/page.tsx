"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { fromOwnedRow, fromPublicRow, type LibraryItem } from "@/lib/items";
import { UNSORTED, collectionLabel } from "@/lib/collections";
import { saveItem, saveManyItems, copyItemToClipboard } from "@/lib/download";
import type { Me } from "@/lib/me";
import { AppHeader } from "@/components/app/app-header";
import { FilterPanel, type Source } from "@/components/app/filter-panel";
import { FilterDrawer } from "@/components/app/filter-drawer";
import { ItemGrid } from "@/components/app/item-grid";
import { ItemDetailSheet } from "@/components/app/item-detail-sheet";
import { AddItemDialog } from "@/components/app/add-item-dialog";
import { WelcomeToProDialog } from "@/components/app/welcome-to-pro-dialog";
import { UpgradePro } from "@/components/app/upgrade-pro";
import { UsageMeter } from "@/components/app/usage-meter";
import { GridSkeleton, NoResults, EmptyPersonalLibrary } from "@/components/app/empty-state";

const FREE_BULK_LIMIT = 10;

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
  const [showWelcomePro, setShowWelcomePro] = useState(false);
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

  // Post-checkout: Stripe redirects back with ?checkout=success. Show the
  // welcome modal, strip the param so it won't reappear on refresh, and
  // refresh the plan/quota (the webhook can land a beat after the redirect).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowWelcomePro(true);
    params.delete("checkout");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    const timers = [1000, 3000, 6000].map((ms) => setTimeout(loadMe, ms));
    return () => timers.forEach(clearTimeout);
  }, [loadMe]);

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
    else if (result === "retry") toast("Ready. Tap save again to open the share sheet.");
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

  async function handleRename(item: LibraryItem, name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === item.name) return;
    const res = await fetch("/api/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, name: trimmed }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name: trimmed } : i)));
      setDetailItem((prev) => (prev && prev.id === item.id ? { ...prev, name: trimmed } : prev));
      toast.success("Renamed");
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Rename failed");
    }
  }

  // Bulk save: mobile shares every PNG to Photos in one sheet, desktop zips.
  async function saveSelected() {
    if (selectedIds.size === 0) return;
    if (me?.plan !== "pro" && selectedIds.size > FREE_BULK_LIMIT) {
      toast.error(`Free plan saves up to ${FREE_BULK_LIMIT} cutouts at once. Pro is unlimited.`);
      return;
    }
    const targets = items.filter((i) => selectedIds.has(i.id));
    const saveToast = toast.loading(`Saving ${targets.length} cutouts...`);
    const result = await saveManyItems(targets);
    if (result === "cancelled") {
      toast.dismiss(saveToast);
      return;
    }
    if (result === "retry") {
      toast("Ready. Tap save again to open the share sheet.", { id: saveToast });
      return;
    }
    if (result === "failed") {
      toast.error("Save failed", { id: saveToast });
      return;
    }
    toast.success(result === "shared" ? "Saved" : "Zip ready", { id: saveToast });
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  // Bulk delete: only the user's own items can be removed.
  function deleteSelected() {
    const targets = items.filter((i) => selectedIds.has(i.id) && i.owned);
    if (targets.length === 0) {
      toast.error("Starter cutouts can't be deleted.");
      return;
    }
    toast(`Delete ${targets.length} cutout${targets.length > 1 ? "s" : ""}?`, {
      action: {
        label: "Delete",
        onClick: async () => {
          const delToast = toast.loading(`Deleting ${targets.length}...`);
          const results = await Promise.all(
            targets.map((item) =>
              fetch("/api/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id }),
              }).then((res) => ({ id: item.id, ok: res.ok })),
            ),
          );
          const deleted = new Set(results.filter((r) => r.ok).map((r) => r.id));
          setItems((prev) => prev.filter((i) => !deleted.has(i.id)));
          setSelectedIds(new Set());
          setSelectMode(false);
          const failed = results.length - deleted.size;
          if (failed > 0) {
            toast.error(`Deleted ${deleted.size}, ${failed} failed`, { id: delToast });
          } else {
            toast.success(`Deleted ${deleted.size} cutout${deleted.size > 1 ? "s" : ""}`, {
              id: delToast,
            });
          }
        },
      },
    });
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
        onSaveSelected={saveSelected}
        onDeleteSelected={deleteSelected}
        onAdd={() => setShowAdd(true)}
        onOpenFilters={() => setShowFilters(true)}
        activeFilterCount={activeFilterCount}
        me={me}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/50 md:flex">
          <div className="flex-1 overflow-y-auto">
            <FilterPanel {...filterPanelProps} />
          </div>
          {me && (
            <div className="space-y-3 border-t border-border p-3">
              <UsageMeter me={me} />
              {/* Hide the upsell while the welcome dialog is up: right after
                  checkout the webhook may not have flipped the plan yet. */}
              {me.plan !== "pro" && !showWelcomePro && (
                <UpgradePro me={me} variant="card" />
              )}
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          {me && (
            <div className="mb-3 rounded-lg border border-border bg-card/50 p-3 md:hidden">
              <UsageMeter me={me} />
            </div>
          )}

          {me && me.plan !== "pro" && !showWelcomePro && (
            <div className="mb-3 md:hidden">
              <UpgradePro me={me} variant="bar" />
            </div>
          )}

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
        onRename={handleRename}
      />

      {showWelcomePro && <WelcomeToProDialog onClose={() => setShowWelcomePro(false)} />}

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

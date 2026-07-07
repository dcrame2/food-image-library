"use client";

import { useState } from "react";
import Link from "next/link";
import type { LibraryItem } from "@/lib/items";
import type { Me } from "@/lib/me";
import { collectionLabel } from "@/lib/collections";
import { ImageSearchResult } from "@/lib/serper";
import {
  X,
  Search,
  Loader2,
  Link as LinkIcon,
  Check,
  Zap,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

interface AddItemDialogProps {
  onClose: () => void;
  onAdded: (item: LibraryItem) => void;
  me: Me | null;
  /** Existing collection slugs for the autocomplete. */
  collections: string[];
}

type Mode = "search" | "url";
type Engine = "auto" | "remove-bg" | "imgly" | "skip";

/**
 * Mount this only while open ({show && <AddItemDialog .../>}); state resets
 * naturally on unmount.
 */
export function AddItemDialog({ onClose, onAdded, me, collections }: AddItemDialogProps) {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaHit, setQuotaHit] = useState(false);

  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [pastedUrl, setPastedUrl] = useState("");
  const [name, setName] = useState("");
  const [collection, setCollection] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [engine, setEngine] = useState<Engine>(() =>
    me?.plan === "pro" ? "auto" : "imgly",
  );
  const [saving, setSaving] = useState(false);

  const remaining = me ? Math.max(me.limit - me.used, 0) : null;
  const activeUrl = mode === "search" ? selectedUrl : pastedUrl.trim() || null;

  async function doSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setResults([]);
    setSelectedUrl(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.code === "SEARCH_NOT_CONFIGURED"
            ? "Image search is not configured on this server. Use the Paste URL tab instead."
            : (data.error ?? "Search failed"),
        );
        return;
      }
      setResults(data.results);
      if (!name) setName(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function doSave() {
    if (!activeUrl || !name.trim()) return;
    setSaving(true);
    setError(null);
    setQuotaHit(false);
    try {
      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: activeUrl,
          name: name.trim(),
          collection: collection.trim() || undefined,
          engine,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.upgrade) setQuotaHit(true);
        setError(data.error ?? "Save failed");
        return;
      }
      onAdded(data.item as LibraryItem);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const engineName =
    engine === "skip"
      ? "No removal (already transparent)"
      : engine === "imgly"
        ? "Standard removal"
        : "Premium removal";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-card sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-xl sm:border sm:border-border">
        <div className="flex items-center justify-between border-b border-border p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <h2 className="text-lg font-semibold">Add a cutout</h2>
          <div className="flex items-center gap-3">
            {remaining !== null && (
              <span
                className={clsx(
                  "rounded-full border px-2.5 py-1 text-xs",
                  remaining === 0
                    ? "border-destructive/40 text-destructive"
                    : "border-border text-muted-foreground",
                )}
              >
                {remaining} left this month
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border px-4">
          {(
            [
              { id: "search", label: "Search the web", icon: Search },
              { id: "url", label: "Paste URL", icon: LinkIcon },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={clsx(
                "border-b-2 px-3 py-2.5 text-sm",
                mode === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="mr-1.5 inline h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
          <div className="border-border p-4 md:overflow-y-auto md:border-r">
            {mode === "search" ? (
              <>
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    placeholder="Search anything: shoes, snacks, logos..."
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={doSearch}
                    disabled={searching || !query.trim()}
                    className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </button>
                </div>

                {results.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {results.map((r) => {
                      const isSelected = selectedUrl === r.link;
                      return (
                        <button
                          key={r.link}
                          type="button"
                          onClick={() => setSelectedUrl(r.link)}
                          className={clsx(
                            "checkered-bg relative overflow-hidden rounded-md border-2 transition-all",
                            isSelected
                              ? "border-primary ring-2 ring-primary/40"
                              : "border-transparent hover:border-white/30",
                          )}
                          title={r.title}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.thumbnail}
                            alt={r.title}
                            className="aspect-square w-full object-contain p-1"
                          />
                          <span
                            className={clsx(
                              "absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-white/40 bg-black/40 text-transparent",
                            )}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Image URL
                </label>
                <input
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Long-press or right-click any image, copy its address, and paste it here.
                </p>
                {pastedUrl.trim() && (
                  <div className="checkered-bg mt-4 overflow-hidden rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pastedUrl}
                      alt="Preview"
                      className="aspect-square w-full object-contain p-3"
                    />
                  </div>
                )}
              </div>
            )}

            {error && !quotaHit && (
              <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {error}
              </div>
            )}
            {quotaHit && (
              <div className="mt-3 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium">
                  <Zap className="h-4 w-4 text-primary" />
                  You are out of cutouts this month
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pro gets you 300 cutouts a month plus premium edge quality.
                </p>
                <Link
                  href="/pricing"
                  className="mt-2 inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>

          <div className="p-4 md:overflow-y-auto">
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nike Pegasus 41"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Collection <span className="opacity-60">(optional)</span>
              </label>
              <input
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                list="collection-options"
                placeholder="e.g. Race day, Sneakers, Logos"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <datalist id="collection-options">
                {collections.map((slug) => (
                  <option key={slug} value={collectionLabel(slug)} />
                ))}
              </datalist>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Type a new name to create a collection, or pick an existing one.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={clsx("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")}
              />
              {engineName}
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-1.5 rounded-lg border border-border p-2.5">
                {(me?.plan === "pro"
                  ? ([
                      { id: "auto", label: "Premium", hint: "best edges, uses quota", icon: Sparkles },
                      { id: "imgly", label: "Standard", hint: "included, uses quota", icon: null },
                      { id: "skip", label: "No removal", hint: "image is already transparent, free", icon: null },
                    ] as const)
                  : ([
                      { id: "imgly", label: "Standard", hint: "included, uses quota", icon: null },
                      { id: "skip", label: "No removal", hint: "image is already transparent, free", icon: null },
                    ] as const)
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEngine(opt.id)}
                    className={clsx(
                      "flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                      engine === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-foreground/25",
                    )}
                  >
                    {opt.icon && <opt.icon className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-xs font-medium">{opt.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{opt.hint}</span>
                  </button>
                ))}
                {me?.plan !== "pro" && (
                  <p className="px-1 pt-1 text-[11px] text-muted-foreground">
                    Premium edge quality is a Pro feature.{" "}
                    <Link href="/pricing" className="text-primary hover:underline">
                      See plans
                    </Link>
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={doSave}
              disabled={!activeUrl || !name.trim() || saving}
              className="mt-4 mb-[max(0rem,env(safe-area-inset-bottom))] w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cutting it out...
                </span>
              ) : (
                "Save to library"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

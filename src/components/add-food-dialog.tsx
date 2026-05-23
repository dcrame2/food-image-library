"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, CategoryId, COMMON_TAGS } from "@/lib/categories";
import { FoodItem } from "@/lib/catalog";
import { ImageSearchResult } from "@/lib/serper";
import { X, Search, Loader2, Link as LinkIcon, Sparkles } from "lucide-react";
import clsx from "clsx";

interface AddFoodDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: (item: FoodItem) => void;
}

type Mode = "search" | "url";
type Engine = "auto" | "remove-bg" | "imgly" | "skip";

export function AddFoodDialog({ open, onClose, onAdded }: AddFoodDialogProps) {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [pastedUrl, setPastedUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>("branded");
  const [tags, setTags] = useState<string[]>([]);
  const [engine, setEngine] = useState<Engine>("auto");
  const [removeBgConfigured, setRemoveBgConfigured] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/config")
        .then((r) => r.json())
        .then((d) => setRemoveBgConfigured(Boolean(d.removeBgConfigured)))
        .catch(() => {});
    } else {
      setQuery("");
      setResults([]);
      setSelectedUrl(null);
      setPastedUrl("");
      setName("");
      setTags([]);
      setError(null);
      setMode("search");
      setEngine("auto");
    }
  }, [open]);

  if (!open) return null;

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
        if (data.code === "SEARCH_NOT_CONFIGURED") {
          setError(
            "Serper isn't set up. Add SERPER_API_KEY to .env.local (see README) and restart the dev server. Or use the 'Paste URL' tab.",
          );
        } else {
          setError(data.error ?? "Search failed");
        }
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
    try {
      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: activeUrl,
          name: name.trim(),
          category,
          tags,
          engine,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      onAdded(data.item as FoodItem);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-card">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold">Add Food Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-white/10 px-4">
          <button
            type="button"
            onClick={() => setMode("search")}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm",
              mode === "search"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Search className="mr-1.5 inline h-3.5 w-3.5" />
            Search Google
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm",
              mode === "url"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <LinkIcon className="mr-1.5 inline h-3.5 w-3.5" />
            Paste URL
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
          <div className="overflow-y-auto border-white/10 p-4 md:border-r">
            {mode === "search" ? (
              <>
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    placeholder='e.g. "oikos triple zero vanilla"'
                    className="flex-1 rounded-md border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={doSearch}
                    disabled={searching || !query.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </button>
                </div>

                {results.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {results.map((r) => (
                      <button
                        key={r.link}
                        type="button"
                        onClick={() => setSelectedUrl(r.link)}
                        className={clsx(
                          "checkered-bg overflow-hidden rounded-md border-2 transition-colors",
                          selectedUrl === r.link
                            ? "border-primary"
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
                      </button>
                    ))}
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
                  className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Right-click any image in your browser → &quot;Copy image address&quot; → paste
                  here.
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

            {error && (
              <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-4">
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oikos Triple Zero Vanilla"
                className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TAGS.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={clsx(
                        "rounded-full border px-2 py-0.5 text-xs",
                        on
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-white/10 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Background removal
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    { id: "auto", label: removeBgConfigured ? "Auto (remove.bg)" : "Auto (@imgly)", icon: Sparkles },
                    { id: "remove-bg", label: "remove.bg", icon: Sparkles, disabled: !removeBgConfigured },
                    { id: "imgly", label: "@imgly (free)", icon: null },
                    { id: "skip", label: "Skip (already transparent)", icon: null },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => "disabled" in opt && opt.disabled ? null : setEngine(opt.id as Engine)}
                    disabled={"disabled" in opt ? opt.disabled : false}
                    className={clsx(
                      "rounded-md border px-2 py-1.5 text-xs transition-colors",
                      engine === opt.id
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-white/10 text-muted-foreground hover:text-foreground",
                      "disabled" in opt && opt.disabled && "cursor-not-allowed opacity-40",
                    )}
                    title={
                      "disabled" in opt && opt.disabled
                        ? "REMOVE_BG_API_KEY not set — see README"
                        : undefined
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {!removeBgConfigured && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Best quality needs a remove.bg API key — see README.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={doSave}
              disabled={!activeUrl || !name.trim() || saving}
              className="mt-4 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing (this can take ~30s on first run)…
                </span>
              ) : (
                "Save to Library"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

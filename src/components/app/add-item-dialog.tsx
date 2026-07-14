"use client";

import { useEffect, useRef, useState } from "react";
import type { LibraryItem } from "@/lib/items";
import type { Me } from "@/lib/me";
import { UNSORTED, collectionLabel } from "@/lib/collections";
import { PLANS } from "@/lib/plans";
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
  Upload,
  ImageIcon,
  RotateCcw,
  Plus,
} from "lucide-react";
import clsx from "clsx";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Rough stage copy for the processing wait; timed, not measured. */
const SAVE_STAGES = ["Fetching image", "Removing background", "Refining edges", "Almost there"];
const SAVE_STAGE_TIMES = [1500, 4500, 10000];

function nameFromFile(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

interface AddItemDialogProps {
  onClose: () => void;
  /** Called when the user accepts a cutout (Done / Add another / close). */
  onAdded: (item: LibraryItem) => void;
  /** Opens the shared upgrade dialog (yearly/monthly picker) above this one. */
  onUpgrade: () => void;
  /** Quota changed server-side (cutout processed or refunded): refresh `me`. */
  onQuotaChange: () => void;
  me: Me | null;
  /** Existing collection slugs for the autocomplete. */
  collections: string[];
  /** Preload the upload tab (page-level paste or drag-drop). */
  initialFile?: File | null;
}

type Mode = "search" | "upload" | "url";
type Engine = "auto" | "remove-bg" | "imgly" | "skip";

interface PendingResult {
  item: LibraryItem;
  /** Whether this add consumed quota — rejecting it should refund. */
  quotaUsed: boolean;
}

/**
 * Mount this only while open ({show && <AddItemDialog .../>}); state resets
 * naturally on unmount.
 */
export function AddItemDialog({
  onClose,
  onAdded,
  onUpgrade,
  onQuotaChange,
  me,
  collections,
  initialFile,
}: AddItemDialogProps) {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaHit, setQuotaHit] = useState(false);

  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [pastedUrl, setPastedUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [collection, setCollection] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [engine, setEngine] = useState<Engine>("auto");
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState(0);
  const [result, setResult] = useState<PendingResult | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // If the dialog closes while a cutout is still processing, the item is
  // saved server-side anyway; deliver it to the grid instead of dropping it.
  const unmountedRef = useRef(false);
  useEffect(
    () => () => {
      unmountedRef.current = true;
    },
    [],
  );

  // Closing while a result is up means keeping it: the item is already saved,
  // so silently dropping it from the grid would look like data loss.
  function close() {
    if (result) onAdded(result.item);
    onClose();
  }
  const closeRef = useRef(close);
  closeRef.current = close;

  // Escape closes; lock body scroll while open (same pattern as the other
  // overlays). No backdrop-click close: a stray tap should not lose form state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  // Page-level paste/drop hands us a file to start from.
  useEffect(() => {
    if (initialFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("upload");
      onPickFile(initialFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cmd+V anywhere in the dialog: an image file lands in the upload tab, a
  // URL (outside a text field) lands in the paste-URL tab.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (saving || discarding || result) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (const entry of items) {
          if (entry.kind === "file" && entry.type.startsWith("image/")) {
            const picked = entry.getAsFile();
            if (picked) {
              e.preventDefault();
              setMode("upload");
              onPickFile(picked);
              return;
            }
          }
        }
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const text = e.clipboardData?.getData("text/plain").trim();
      if (text && /^https?:\/\/\S+$/i.test(text)) {
        e.preventDefault();
        setMode("url");
        setPastedUrl(text);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

  // Staged progress copy while the cutout processes (doSave resets stage 0).
  useEffect(() => {
    if (!saving) return;
    const timers = SAVE_STAGE_TIMES.map((ms, i) =>
      setTimeout(() => setSaveStage(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [saving]);

  const remaining = me ? Math.max(me.limit - me.used, 0) : null;
  const activeUrl = mode === "search" ? selectedUrl : pastedUrl.trim() || null;
  const hasSource = mode === "upload" ? Boolean(file) : Boolean(activeUrl);

  function clearFile() {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onPickFile(picked: File | undefined) {
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setError("That file is not an image.");
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      setError("Image must be under 15MB.");
      return;
    }
    setError(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(picked);
    setFilePreview(URL.createObjectURL(picked));
    if (!name.trim() && picked.name) setName(nameFromFile(picked.name));
  }

  async function doSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
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
      setSearched(true);
      if (!name) setName(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function doSave() {
    if (!hasSource || !name.trim()) return;
    setSaveStage(0);
    setSaving(true);
    setError(null);
    setQuotaHit(false);
    try {
      let res: Response;
      if (mode === "upload" && file) {
        const form = new FormData();
        form.append("file", file);
        form.append("name", name.trim());
        if (collection.trim()) form.append("collection", collection.trim());
        form.append("engine", engine);
        res = await fetch("/api/add", { method: "POST", body: form });
      } else {
        res = await fetch("/api/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: activeUrl,
            name: name.trim(),
            collection: collection.trim() || undefined,
            engine,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.upgrade) setQuotaHit(true);
        setError(data.error ?? "Save failed");
        return;
      }
      onQuotaChange();
      if (unmountedRef.current) {
        onAdded(data.item as LibraryItem);
        return;
      }
      setResult({ item: data.item as LibraryItem, quotaUsed: Boolean(data.quotaUsed) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /** Clear the picked source so the form is ready for the next image. */
  function resetSource() {
    setSelectedUrl(null);
    if (mode === "url") setPastedUrl("");
    if (mode === "upload") {
      clearFile();
      setName("");
    }
  }

  function acceptResult(closeAfter: boolean) {
    if (!result) return;
    onAdded(result.item);
    setResult(null);
    if (closeAfter) {
      onClose();
    } else {
      resetSource();
    }
  }

  async function tryDifferentImage() {
    if (!result) return;
    setDiscarding(true);
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: result.item.id, refund: result.quotaUsed }),
      });
      if (!res.ok) throw new Error();
      onQuotaChange();
      setResult(null);
      resetSource();
    } catch {
      // Discarding failed, so the item is still saved: surface it instead of
      // leaving it invisible in the library.
      setError("Could not discard that cutout, so it was kept in your library.");
      acceptResult(false);
    } finally {
      setDiscarding(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    if (saving || discarding || result) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) {
      setMode("upload");
      onPickFile(dropped);
    }
  }

  const engineName =
    engine === "skip"
      ? "No removal (already transparent)"
      : engine === "imgly"
        ? "Standard removal"
        : "Premium removal";

  const resultCollection =
    result && result.item.category !== UNSORTED
      ? collectionLabel(result.item.category)
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-card sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-xl sm:border sm:border-border"
        onDragEnter={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          dragDepth.current += 1;
          setDragOver(true);
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragOver(false);
        }}
        onDrop={onDrop}
      >
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/80">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Upload className="h-4 w-4 text-primary" />
              Drop image to cut it out
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-border p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <h2 className="text-lg font-semibold">
            {result ? "Your cutout" : "Add a cutout"}
          </h2>
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
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {result ? (
          <div className="flex flex-1 flex-col items-center overflow-y-auto p-4 sm:p-6">
            <div className="checkered-bg w-full max-w-sm overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.item.publicUrl}
                alt={result.item.name}
                className="aspect-square w-full object-contain p-4"
              />
            </div>
            <p className="mt-3 text-sm font-semibold">{result.item.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Saved to {resultCollection ?? "your library"}
            </p>

            {error && (
              <div className="mt-3 w-full max-w-sm rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="mt-5 flex w-full max-w-sm flex-col gap-2 pb-[max(0rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => acceptResult(true)}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Check className="h-4 w-4" />
                Done
              </button>
              <button
                type="button"
                onClick={() => acceptResult(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Add another
              </button>
              <button
                type="button"
                disabled={discarding}
                onClick={tryDifferentImage}
                className="flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
              >
                {discarding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Try a different image
                {result.quotaUsed && !discarding && (
                  <span className="text-xs opacity-70">(refunds the cutout)</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-1 border-b border-border px-4">
              {(
                [
                  { id: "search", label: "Search", icon: Search },
                  { id: "upload", label: "Upload", icon: Upload },
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

                    {searched && results.length === 0 && !error && (
                      <div className="mt-8 flex flex-col items-center text-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No images found for &ldquo;{query}&rdquo;. Try different
                          words, or paste an image URL instead.
                        </p>
                      </div>
                    )}

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
                ) : mode === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickFile(e.target.files?.[0])}
                    />
                    {file && filePreview ? (
                      <div>
                        <div className="checkered-bg relative overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={filePreview}
                            alt="Selected"
                            className="aspect-square w-full object-contain p-3"
                          />
                          <button
                            type="button"
                            onClick={clearFile}
                            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <ImageIcon className="h-6 w-6 text-primary" />
                        </span>
                        <span className="px-6 text-sm font-medium">
                          Tap to choose a photo
                        </span>
                        <span className="px-6 text-xs text-muted-foreground">
                          Or drag and drop, or paste an image. PNG or JPG, up to 15MB.
                        </span>
                      </button>
                    )}
                  </div>
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
                      Pro gets you {PLANS.pro.cutoutsPerMonth} cutouts a month.
                    </p>
                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Upgrade to Pro
                    </button>
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
                    {(
                      [
                        { id: "auto", label: "Premium", hint: "best edges, uses quota", icon: Sparkles },
                        { id: "imgly", label: "Standard", hint: "included, uses quota", icon: null },
                        { id: "skip", label: "No removal", hint: "image is already transparent, free", icon: null },
                      ] as const
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
                  </div>
                )}

                <button
                  type="button"
                  onClick={doSave}
                  disabled={!hasSource || !name.trim() || saving}
                  className="mt-4 mb-[max(0rem,env(safe-area-inset-bottom))] w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {SAVE_STAGES[saveStage]}...
                    </span>
                  ) : (
                    "Save to library"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

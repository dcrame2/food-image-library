"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Copy,
  Trash2,
  Loader2,
  Check,
  Pencil,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import type { LibraryItem } from "@/lib/items";
import { UNSORTED, collectionLabel } from "@/lib/collections";

export interface ItemPatch {
  name?: string;
  collection?: string;
  tags?: string[];
}

interface ItemDetailSheetProps {
  item: LibraryItem | null;
  /** Existing collection slugs for the move-to-collection autocomplete. */
  collections: string[];
  onClose: () => void;
  onSave: (item: LibraryItem) => Promise<void> | void;
  onCopy: (item: LibraryItem) => Promise<void> | void;
  onDelete: (item: LibraryItem) => Promise<void> | void;
  onUpdate: (item: LibraryItem, patch: ItemPatch) => Promise<void> | void;
  /** Step to the previous (-1) or next (1) item in the current grid order. */
  onNavigate: (dir: -1 | 1) => void;
}

function isIOS(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  );
}

/**
 * Bottom sheet on mobile, centered modal on desktop. The preview is a plain
 * <img> so iOS long-press "Save to Photos" works as a manual fallback.
 */
export function ItemDetailSheet({
  item,
  collections,
  onClose,
  onSave,
  onCopy,
  onDelete,
  onUpdate,
  onNavigate,
}: ItemDetailSheetProps) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Arrow keys step through the grid, but never while typing in a field.
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") onNavigate(-1);
      if (e.key === "ArrowRight") onNavigate(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />
          {/* Keyed by item so per-item state (confirm, saving) resets naturally. */}
          <SheetBody
            key={item.id}
            item={item}
            collections={collections}
            onClose={onClose}
            onSave={onSave}
            onCopy={onCopy}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

function SheetBody({
  item,
  collections,
  onClose,
  onSave,
  onCopy,
  onDelete,
  onUpdate,
  onNavigate,
}: {
  item: LibraryItem;
  collections: string[];
  onClose: () => void;
  onSave: (item: LibraryItem) => Promise<void> | void;
  onCopy: (item: LibraryItem) => Promise<void> | void;
  onDelete: (item: LibraryItem) => Promise<void> | void;
  onUpdate: (item: LibraryItem, patch: ItemPatch) => Promise<void> | void;
  onNavigate: (dir: -1 | 1) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(item.name);
  const [renaming, setRenaming] = useState(false);
  const [editingCollection, setEditingCollection] = useState(false);
  const [collectionDraft, setCollectionDraft] = useState("");
  const [movingCollection, setMovingCollection] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [savingTags, setSavingTags] = useState(false);

  const categoryLabel =
    item.category === UNSORTED ? null : collectionLabel(item.category);

  async function commitRename() {
    const next = nameDraft.trim();
    if (!next || next === item.name) {
      setEditingName(false);
      setNameDraft(item.name);
      return;
    }
    setRenaming(true);
    try {
      await onUpdate(item, { name: next });
      setEditingName(false);
    } finally {
      setRenaming(false);
    }
  }

  async function commitCollection() {
    const next = collectionDraft.trim();
    if (next === (categoryLabel ?? "")) {
      setEditingCollection(false);
      return;
    }
    setMovingCollection(true);
    try {
      await onUpdate(item, { collection: next });
      setEditingCollection(false);
    } finally {
      setMovingCollection(false);
    }
  }

  async function saveTags(tags: string[]) {
    setSavingTags(true);
    try {
      await onUpdate(item, { tags });
    } finally {
      setSavingTags(false);
    }
  }

  function addTag() {
    const tag = tagDraft.trim().toLowerCase();
    setTagDraft("");
    if (!tag || item.tags.includes(tag)) return;
    saveTags([...item.tags, tag]);
  }

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0.8 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
      className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:rounded-2xl"
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" />
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {/* Desktop: step through the grid without closing the sheet. */}
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          className="hidden h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white sm:flex"
          aria-label="Previous cutout"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate(1)}
          className="hidden h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white sm:flex"
          aria-label="Next cutout"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="overflow-y-auto overscroll-contain">
        <div className="checkered-bg m-4 mb-0 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.publicUrl}
            alt={item.name}
            className="mx-auto aspect-square w-full max-w-sm object-contain p-6"
          />
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameDraft}
                    maxLength={120}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameDraft(item.name);
                      }
                    }}
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-lg font-semibold outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={commitRename}
                    disabled={renaming}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    aria-label="Save name"
                  >
                    {renaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-lg font-semibold leading-tight">{item.name}</h2>
                  {item.owned && (
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(item.name);
                        setEditingName(true);
                      }}
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {item.owned ? (
                editingCollection ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      autoFocus
                      value={collectionDraft}
                      list="detail-collection-options"
                      placeholder="Collection (empty = Unsorted)"
                      onChange={(e) => setCollectionDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitCollection();
                        if (e.key === "Escape") setEditingCollection(false);
                      }}
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                    />
                    <datalist id="detail-collection-options">
                      {collections.map((slug) => (
                        <option key={slug} value={collectionLabel(slug)} />
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={commitCollection}
                      disabled={movingCollection}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                      aria-label="Save collection"
                    >
                      {movingCollection ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCollectionDraft(categoryLabel ?? "");
                      setEditingCollection(true);
                    }}
                    className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    title="Move to a collection"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    {categoryLabel ?? "Add to a collection"}
                    <Pencil className="h-3 w-3 opacity-60" />
                  </button>
                )
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {categoryLabel && (
                    <>
                      {categoryLabel}
                      <span className="mx-1.5 opacity-40">/</span>
                    </>
                  )}
                  Starter pack
                </p>
              )}
            </div>
          </div>

          {item.owned ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {t}
                  <button
                    type="button"
                    disabled={savingTags}
                    onClick={() => saveTags(item.tags.filter((x) => x !== t))}
                    className="rounded-full p-0.5 hover:text-foreground disabled:opacity-50"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5">
                {savingTags ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : (
                  <Plus className="h-3 w-3 text-muted-foreground" />
                )}
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder="Add tag"
                  className="w-16 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 focus:w-24"
                />
              </div>
            </div>
          ) : (
            item.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(item);
                } finally {
                  setSaving(false);
                }
              }}
              className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Save image
            </button>
            <button
              type="button"
              onClick={() => onCopy(item)}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
            {item.owned ? (
              <button
                type="button"
                onClick={async () => {
                  if (!confirmingDelete) {
                    setConfirmingDelete(true);
                    return;
                  }
                  await onDelete(item);
                  onClose();
                }}
                className={clsx(
                  "flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                  confirmingDelete
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : "border-border text-destructive hover:bg-destructive/10",
                )}
              >
                {confirmingDelete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {confirmingDelete ? "Confirm" : "Delete"}
              </button>
            ) : (
              <div className="flex h-11 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                Included free
              </div>
            )}
          </div>

          {isIOS() && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Tip: long-press the image to save straight to Photos.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Trash2, Loader2, Check } from "lucide-react";
import clsx from "clsx";
import type { LibraryItem } from "@/lib/items";
import { UNSORTED, collectionLabel } from "@/lib/collections";

interface ItemDetailSheetProps {
  item: LibraryItem | null;
  onClose: () => void;
  onSave: (item: LibraryItem) => Promise<void> | void;
  onCopy: (item: LibraryItem) => Promise<void> | void;
  onDelete: (item: LibraryItem) => Promise<void> | void;
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
  onClose,
  onSave,
  onCopy,
  onDelete,
}: ItemDetailSheetProps) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

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
            onClose={onClose}
            onSave={onSave}
            onCopy={onCopy}
            onDelete={onDelete}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

function SheetBody({
  item,
  onClose,
  onSave,
  onCopy,
  onDelete,
}: {
  item: LibraryItem;
  onClose: () => void;
  onSave: (item: LibraryItem) => Promise<void> | void;
  onCopy: (item: LibraryItem) => Promise<void> | void;
  onDelete: (item: LibraryItem) => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const categoryLabel =
    item.category === UNSORTED ? null : collectionLabel(item.category);

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0.8 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
      className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:rounded-2xl"
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white"
        aria-label="Close"
      >
        <X className="h-4.5 w-4.5" />
      </button>

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
            <div>
              <h2 className="text-lg font-semibold leading-tight">{item.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {categoryLabel && (
                  <>
                    {categoryLabel}
                    <span className="mx-1.5 opacity-40">/</span>
                  </>
                )}
                {item.owned ? "Your library" : "Starter pack"}
              </p>
            </div>
          </div>

          {item.tags.length > 0 && (
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

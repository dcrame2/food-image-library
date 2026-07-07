"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Check, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { LibraryItem } from "@/lib/items";

interface ItemGridProps {
  items: LibraryItem[];
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (item: LibraryItem) => void;
  onSave: (item: LibraryItem) => void;
  onDelete: (item: LibraryItem) => void;
}

export function ItemGrid({
  items,
  selectMode,
  selectedIds,
  onToggleSelect,
  onOpen,
  onSave,
  onDelete,
}: ItemGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          selectMode={selectMode}
          selected={selectedIds.has(item.id)}
          onToggleSelect={onToggleSelect}
          onOpen={onOpen}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ItemCard({
  item,
  selectMode,
  selected,
  onToggleSelect,
  onOpen,
  onSave,
  onDelete,
}: {
  item: LibraryItem;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (item: LibraryItem) => void;
  onSave: (item: LibraryItem) => void;
  onDelete: (item: LibraryItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        "group relative overflow-hidden rounded-lg border transition-colors",
        selected ? "border-primary" : "border-border hover:border-white/30",
      )}
    >
      <button
        type="button"
        onClick={() => (selectMode ? onToggleSelect(item.id) : onOpen(item))}
        className="checkered-bg block aspect-square w-full cursor-pointer"
        title={selectMode ? "Toggle select" : item.name}
      >
        {!loaded && <div className="absolute inset-0 animate-pulse bg-muted/60" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.publicUrl}
          alt={item.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={clsx(
            "h-full w-full object-contain p-3 transition-all duration-200 group-hover:scale-[1.03]",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      </button>

      {!item.owned && !selectMode && (
        <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/80 backdrop-blur-sm">
          Starter
        </span>
      )}

      {selectMode && (
        <div
          className={clsx(
            "pointer-events-none absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white/30 bg-black/40",
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </div>
      )}

      {!selectMode && (
        <>
          {/* Hover quick actions: desktop-only sugar; tap opens the detail sheet. */}
          <div className="pointer-events-none absolute right-2 bottom-2 hidden gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
            {item.owned && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white hover:bg-destructive"
                title="Delete from library"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSave(item);
              }}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 hidden truncate bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
            {item.name}
          </div>

          {/* Mobile: always-visible quick save (touch has no hover). */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave(item);
            }}
            className="absolute right-1.5 bottom-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:bg-black md:hidden"
            aria-label={`Save ${item.name}`}
            title="Save to device"
          >
            <Download className="h-4 w-4" />
          </button>
        </>
      )}
    </motion.div>
  );
}

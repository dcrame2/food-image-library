"use client";

import { FoodItem } from "@/lib/catalog";
import { Download, Check, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface FoodGridProps {
  items: FoodItem[];
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDownload: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
}

export function FoodGrid({
  items,
  selectMode,
  selectedIds,
  onToggleSelect,
  onDownload,
  onDelete,
}: FoodGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-lg">No food images yet.</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Run <code className="bg-secondary rounded px-1.5 py-0.5">npm run migrate</code> to import
          your existing PNGs, or click <span className="text-foreground">+ Add Food</span> to
          search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => {
        const selected = selectedIds.has(item.id);
        return (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "group relative overflow-hidden rounded-lg border transition-colors",
              selected ? "border-primary" : "border-white/10 hover:border-white/30",
            )}
          >
            <button
              type="button"
              onClick={() => (selectMode ? onToggleSelect(item.id) : onDownload(item))}
              className="checkered-bg block aspect-square w-full cursor-pointer"
              title={selectMode ? "Toggle select" : "Download"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.file}
                alt={item.name}
                className="h-full w-full object-contain p-3 transition-transform group-hover:scale-[1.03]"
              />
            </button>

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
                <div className="pointer-events-none absolute right-2 bottom-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(item);
                    }}
                    className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="pointer-events-none absolute right-0 bottom-0 left-0 truncate bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {item.name}
                </div>
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

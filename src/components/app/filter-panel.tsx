"use client";

import { Layers, Sparkles, User, FolderOpen } from "lucide-react";
import clsx from "clsx";
import { collectionLabel } from "@/lib/collections";

export type Source = "all" | "starter" | "mine";

export interface FilterPanelProps {
  source: Source;
  onSourceChange: (s: Source) => void;
  /** User's own collections (slug -> item count), already excluding unsorted. */
  collections: { slug: string; count: number }[];
  activeCollection: string | null;
  onCollectionChange: (slug: string | null) => void;
  totals: { all: number; starter: number; mine: number };
}

/**
 * Simple library navigation: three sources plus the user's own collections.
 * Rendered in the desktop <aside> and the mobile filter drawer.
 */
export function FilterPanel({
  source,
  onSourceChange,
  collections,
  activeCollection,
  onCollectionChange,
  totals,
}: FilterPanelProps) {
  const sources = [
    { id: "all" as const, label: "All cutouts", icon: Layers, count: totals.all },
    { id: "starter" as const, label: "Starter pack", icon: Sparkles, count: totals.starter },
    { id: "mine" as const, label: "My cutouts", icon: User, count: totals.mine },
  ];

  return (
    <div className="p-4">
      <div className="space-y-0.5">
        {sources.map((s) => {
          const active = source === s.id && !activeCollection;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onCollectionChange(null);
                onSourceChange(s.id);
              }}
              className={clsx(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{s.label}</span>
              <span className="text-xs opacity-60">{s.count}</span>
            </button>
          );
        })}
      </div>

      {collections.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 px-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Collections
          </h2>
          <div className="space-y-0.5">
            {collections.map((c) => {
              const active = activeCollection === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => onCollectionChange(active ? null : c.slug)}
                  className={clsx(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="flex-1 truncate text-left">{collectionLabel(c.slug)}</span>
                  <span className="text-xs opacity-60">{c.count}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {collections.length === 0 && (
        <p className="mt-6 px-2.5 text-xs leading-relaxed text-muted-foreground/70">
          Add a cutout to a collection and it will show up here.
        </p>
      )}
    </div>
  );
}

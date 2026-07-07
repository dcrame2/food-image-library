"use client";

import { CATEGORY_GROUPS, CategoryId } from "@/lib/categories";
import clsx from "clsx";

interface CategorySidebarProps {
  counts: Record<string, number>;
  totalCount: number;
  selected: Set<CategoryId>;
  onToggle: (id: CategoryId) => void;
  onClear: () => void;
  activeTags: Set<string>;
  availableTags: string[];
  tagCounts: Record<string, number>;
  onToggleTag: (tag: string) => void;
}

export function CategorySidebar({
  counts,
  totalCount,
  selected,
  onToggle,
  onClear,
  activeTags,
  availableTags,
  tagCounts,
  onToggleTag,
}: CategorySidebarProps) {
  return (
    <aside className="w-60 shrink-0 border-r border-white/10 bg-card/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Categories
        </h2>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        className={clsx(
          "mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
          selected.size === 0
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        <span>All</span>
        <span className="text-xs opacity-60">{totalCount}</span>
      </button>

      <div className="space-y-3">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.id}>
            <h3 className="mb-1 px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.categories.map((c) => {
                const isOn = selected.has(c.id);
                const n = counts[c.id] ?? 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggle(c.id)}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      isOn
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      n === 0 && !isOn && "opacity-50",
                    )}
                  >
                    <span>{c.label}</span>
                    <span className="text-xs opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {availableTags.length > 0 && (
        <>
          <h2 className="mt-6 mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Tags
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isOn = activeTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={clsx(
                    "rounded-full border px-2 py-0.5 text-xs transition-colors",
                    isOn
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground",
                  )}
                >
                  {tag}
                  <span className="ml-1 opacity-60">{tagCounts[tag] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
}

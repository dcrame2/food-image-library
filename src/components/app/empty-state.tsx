"use client";

import { ImageOff, Plus, SearchX } from "lucide-react";

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-lg border border-border bg-muted/60"
        />
      ))}
    </div>
  );
}

export function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <SearchX className="h-8 w-8 text-muted-foreground/50" />
      <p className="mt-3 text-muted-foreground">Nothing matches those filters.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 text-sm font-medium text-primary hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}

export function EmptyPersonalLibrary({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ImageOff className="h-8 w-8 text-muted-foreground/50" />
      <p className="mt-3 text-lg font-medium">Your library is empty</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Search for anything and get a clean transparent cutout in seconds.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Add your first cutout
      </button>
    </div>
  );
}

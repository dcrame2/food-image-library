"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Download,
  Trash2,
  CheckSquare,
  Square,
  X,
  SlidersHorizontal,
  User,
  LogOut,
  Zap,
  CreditCard,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import type { Me } from "@/lib/me";
import { openBillingPortal } from "@/lib/billing-client";
import { Logo } from "@/components/logo";

interface AppHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  selectedCount: number;
  onSaveSelected: () => void;
  onDeleteSelected: () => void;
  onAdd: () => void;
  onOpenFilters: () => void;
  /** Opens the shared upgrade dialog (yearly/monthly picker). */
  onUpgrade: () => void;
  activeFilterCount: number;
  me: Me | null;
  /** Attached to the desktop search input so "/" can focus it. */
  searchRef?: React.RefObject<HTMLInputElement | null>;
}

export function AppHeader({
  query,
  onQueryChange,
  selectMode,
  onToggleSelectMode,
  selectedCount,
  onSaveSelected,
  onDeleteSelected,
  onAdd,
  onOpenFilters,
  onUpgrade,
  activeFilterCount,
  me,
  searchRef,
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Two-tap bulk delete: armed at a specific selection size, so changing the
  // selection naturally disarms it; a timeout relaxes it too.
  const [deleteArmedAt, setDeleteArmedAt] = useState<number | null>(null);
  const confirmingDelete =
    selectMode && selectedCount > 0 && deleteArmedAt === selectedCount;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setDeleteArmedAt(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const nearLimit = me && me.limit > 0 && me.used / me.limit >= 0.8;

  const searchField = (withRef: boolean) => (
    <>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={withRef ? searchRef : undefined}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search cutouts"
        className="w-full rounded-md border border-border bg-card py-2 pr-8 pl-8 text-sm outline-none focus:border-primary"
      />
      {query && (
        <button
          type="button"
          onClick={() => onQueryChange("")}
          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>

        <Link href="/" className="flex shrink-0 items-center" aria-label="Cutout Aura">
          <Logo className="text-base" markClassName="h-7 w-7" />
        </Link>

        {/* Search: inline on desktop, moves to its own row on mobile. */}
        <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
          {searchField(true)}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSelectMode}
          className={clsx(
            "flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
            selectMode
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          <span className="hidden sm:inline">{selectMode ? "Selecting" : "Select"}</span>
        </button>

        {selectMode && selectedCount > 0 && (
          <>
            <button
              type="button"
              onClick={onSaveSelected}
              className="flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Save </span>({selectedCount})
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmingDelete) {
                  setDeleteArmedAt(selectedCount);
                  return;
                }
                setDeleteArmedAt(null);
                onDeleteSelected();
              }}
              className={clsx(
                "flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
                confirmingDelete
                  ? "border-destructive bg-destructive text-destructive-foreground"
                  : "border-destructive/60 text-destructive hover:bg-destructive hover:text-destructive-foreground",
              )}
              aria-label={
                confirmingDelete
                  ? "Tap again to delete selected"
                  : `Delete ${selectedCount} selected`
              }
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {confirmingDelete ? "Sure?" : "Delete"}
              </span>
              {confirmingDelete && <span className="sm:hidden">Sure?</span>}
            </button>
          </>
        )}

        {!(selectMode && selectedCount > 0) && (
          <button
            type="button"
            onClick={onAdd}
            className="flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
              menuOpen
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            aria-label="Account menu"
          >
            <User className="h-4.5 w-4.5" />
          </button>

          {menuOpen && (
            <div className="absolute top-12 right-0 z-50 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="border-b border-border p-3.5">
                <p className="truncate text-sm font-medium">{me?.email ?? "Signed in"}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      me?.plan === "pro"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {me?.plan === "pro" ? "Pro" : "Free"}
                  </span>
                  {me && (
                    <span
                      className={clsx(
                        "text-xs",
                        nearLimit ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {me.used}/{me.limit} cutouts used
                    </span>
                  )}
                </div>
                {me && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={clsx(
                        "h-full rounded-full transition-all",
                        nearLimit ? "bg-destructive" : "bg-primary",
                      )}
                      style={{
                        width: `${Math.min((me.used / Math.max(me.limit, 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {me?.plan === "pro" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openBillingPortal();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <CreditCard className="h-4 w-4" />
                  Manage billing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onUpgrade();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-primary hover:bg-muted"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade to Pro
                </button>
              )}

              <Link
                href="/app/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>

              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Mobile-only search row, sits below the top row. */}
      <div className="relative mt-2.5 sm:hidden">{searchField(false)}</div>
    </header>
  );
}

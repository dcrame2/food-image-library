"use client";

import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { PlanPicker } from "@/components/app/upgrade-pro";

interface UpgradeDialogProps {
  onClose: () => void;
}

/**
 * The one upgrade surface every Pro entry point opens (account menu, mobile
 * bar, quota banner), so the yearly/monthly choice is always presented the
 * same way. z-60: must stack above the Add dialog when opened from its quota
 * banner.
 */
export function UpgradeDialog({ onClose }: UpgradeDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-5 w-5 text-primary" />
        </span>

        <h2 className="mt-3 text-lg font-semibold">Upgrade to Pro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {PLANS.pro.cutoutsPerMonth} cutouts a month, unlimited bulk saves, and zip
          exports without limits.
        </p>

        <PlanPicker className="mt-4" />
      </div>
    </div>
  );
}

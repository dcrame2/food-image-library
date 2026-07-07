"use client";

import clsx from "clsx";
import type { Me } from "@/lib/me";

/**
 * Compact monthly cutout usage bar. Persistent, always-visible counterpart to
 * the used/limit line buried in the account menu. Turns red near/at the limit.
 */
export function UsageMeter({ me, className }: { me: Me | null; className?: string }) {
  if (!me) return null;

  const { used, limit } = me;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const remaining = Math.max(limit - used, 0);
  const nearLimit = limit > 0 && used / limit >= 0.8;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Cutouts this month
        </span>
        <span className={clsx("text-xs font-semibold", nearLimit ? "text-destructive" : "text-foreground")}>
          {used}
          <span className="text-muted-foreground">/{limit}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            nearLimit ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {remaining} left this month
      </p>
    </div>
  );
}

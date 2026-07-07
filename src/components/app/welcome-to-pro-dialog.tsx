"use client";

import { Sparkles, Check, X } from "lucide-react";
import { PLANS } from "@/lib/plans";

interface WelcomeToProDialogProps {
  onClose: () => void;
}

/**
 * Shown once after a successful Stripe checkout (?checkout=success on /app).
 * The caller strips the query param so it does not reappear on refresh.
 */
export function WelcomeToProDialog({ onClose }: WelcomeToProDialogProps) {
  const pro = PLANS.pro;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-xl sm:p-8"
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

        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-7 w-7 text-primary" />
        </span>

        <h2 className="text-xl font-semibold">Welcome to Pro</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You are all set. Your plan is active and your new limits are ready to use.
        </p>

        <ul className="mt-5 space-y-2.5 text-left">
          {[
            `${pro.cutoutsPerMonth} cutouts every month`,
            "Premium background removal for the cleanest edges",
            "Unlimited bulk saves",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Start creating
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Check, X } from "lucide-react";
import { PLANS } from "@/lib/plans";

interface WelcomeToProDialogProps {
  onClose: () => void;
}

const CONFETTI_COLORS = ["#8b5cf6", "#c4b5fd", "#f0abfc", "#fde68a", "#ffffff"];

/**
 * Shown once after a successful Stripe checkout (?checkout=success on /app).
 * The caller strips the query param so it does not reappear on refresh.
 */
export function WelcomeToProDialog({ onClose }: WelcomeToProDialogProps) {
  const pro = PLANS.pro;

  // Escape closes; lock body scroll while open (same pattern as the other overlays).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Celebrate the upgrade with a confetti burst on mount.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let running = true;
    const end = Date.now() + 1500;

    // Opening pop from just below center.
    confetti({
      particleCount: 140,
      spread: 100,
      startVelocity: 45,
      origin: { y: 0.6 },
      colors: CONFETTI_COLORS,
      zIndex: 9999,
    });

    // Steady side cannons for a beat.
    (function frame() {
      if (!running) return;
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: CONFETTI_COLORS,
        zIndex: 9999,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: CONFETTI_COLORS,
        zIndex: 9999,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    return () => {
      running = false;
    };
  }, []);

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

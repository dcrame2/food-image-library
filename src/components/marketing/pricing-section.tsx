"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PLANS } from "@/lib/plans";

const FREE_POINTS = [
  `${PLANS.free.cutoutsPerMonth} cutouts a month`,
  "Curated starter library included",
  "Standard background removal",
  "Categories, tags, and search",
  "Save to phone and zip up to 10",
];

const PRO_POINTS = [
  `${PLANS.pro.cutoutsPerMonth} cutouts a month`,
  "Premium removal engine for tricky edges",
  "Unlimited zip exports",
  "Everything in Free",
  "Cancel anytime, keep what you cut",
];

type Viewer = "loading" | "signedOut" | "free" | "pro";

export function PricingSection() {
  const [busy, setBusy] = useState(false);
  // Who is looking at the page? Drives both cards' CTAs.
  const [viewer, setViewer] = useState<Viewer>("loading");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return setViewer("signedOut");
        if (!res.ok) return setViewer("signedOut");
        const me = await res.json();
        setViewer(me.plan === "pro" ? "pro" : "free");
      })
      .catch(() => setViewer("signedOut"));
  }, []);

  async function handleProCta() {
    if (viewer === "pro") {
      window.location.href = "/app";
      return;
    }
    // Signed out: sign up and land in the app, where the library is ready and
    // the in-app Go Pro buttons are one click away. New users should try the
    // product before being pushed into checkout.
    if (viewer !== "free") {
      window.location.href = "/login?mode=signup";
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login?mode=signup";
        return;
      }
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      window.location.href = "/app";
    } finally {
      setBusy(false);
    }
  }

  const proLabel =
    viewer === "loading"
      ? null
      : viewer === "signedOut"
        ? "Sign up"
        : viewer === "free"
          ? "Go Pro"
          : "You are on Pro. Open the app";

  return (
    <section id="pricing" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple pricing, sharp edges
        </h2>
        <p className="mt-3 text-muted-foreground">
          Start free. Upgrade when your library starts working as hard as you do.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/60 p-7">
          <h3 className="font-semibold">Free</h3>
          <p className="mt-3 text-4xl font-bold">
            $0
            <span className="text-sm font-normal text-muted-foreground"> forever</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to start a library.
          </p>
          <ul className="mt-6 space-y-2.5">
            {FREE_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
          <a
            href={viewer === "free" || viewer === "pro" ? "/app" : "/login?mode=signup"}
            className="mt-7 block rounded-lg border border-border py-2.5 text-center text-sm font-medium hover:bg-muted"
          >
            {viewer === "free" || viewer === "pro" ? "Open the app" : "Get started"}
          </a>
        </div>

        <div className="relative rounded-2xl border border-primary/40 bg-card p-7 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.4)]">
          <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
            Most popular
          </span>
          <h3 className="font-semibold text-primary">Pro</h3>
          <p className="mt-3 text-4xl font-bold">
            ${PLANS.pro.priceMonthly}
            <span className="text-sm font-normal text-muted-foreground"> per month</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            For anyone cutting out images all day. Creators, sellers, and busy teams.
          </p>
          <ul className="mt-6 space-y-2.5">
            {PRO_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleProCta}
            disabled={busy || viewer === "loading"}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {(busy || viewer === "loading") && <Loader2 className="h-4 w-4 animate-spin" />}
            {proLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

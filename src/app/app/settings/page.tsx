"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CreditCard,
  FileText,
  Loader2,
  LogOut,
  Palette,
  ShieldCheck,
  Trash2,
  User,
  Zap,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import type { Me } from "@/lib/me";
import {
  ACCENTS,
  getAccent,
  setAccent,
  getMode,
  setMode,
  type ThemeMode,
} from "@/lib/theme";
import { openBillingPortal, startCheckout } from "@/lib/billing-client";
import { PLANS } from "@/lib/plans";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [accent, setAccentState] = useState("red");
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    // localStorage is client-only; reading it during render would mismatch SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccentState(getAccent());
    setModeState(getMode());
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d))
      .catch(() => {});
  }, []);

  function pickAccent(id: string) {
    setAccent(id);
    setAccentState(id);
  }

  function pickMode(m: ThemeMode) {
    setMode(m);
    setModeState(m);
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Could not delete your account");
        return;
      }
      window.location.href = "/";
    } finally {
      setDeleting(false);
    }
  }

  const usagePct = me ? Math.min((me.used / Math.max(me.limit, 1)) * 100, 100) : 0;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link
            href="/app"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Back to library"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <h1 className="text-base font-semibold">Settings</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Section icon={User} title="Account">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{me?.email ?? "..."}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {me?.plan === "pro" ? "Pro plan" : "Free plan"}
              </p>
            </div>
            <span
              className={clsx(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                me?.plan === "pro"
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {me?.plan === "pro" ? "Pro" : "Free"}
            </span>
          </div>
          {me && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cutouts this month</span>
                <span>
                  {me.used} of {me.limit}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
          )}
        </Section>

        <Section icon={Palette} title="Appearance">
          <p className="text-xs text-muted-foreground">
            Choose light, dark, or match your device. Saved on this device.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Monitor },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pickMode(m.id)}
                className={clsx(
                  "flex flex-col items-center gap-1.5 rounded-lg border py-3 text-xs font-medium transition-colors",
                  mode === m.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs text-muted-foreground">Accent color</p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => pickAccent(a.id)}
                title={a.label}
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-105",
                  accent === a.id ? "ring-foreground" : "ring-transparent",
                )}
                style={{ backgroundColor: `hsl(${a.hsl})` }}
                aria-label={`${a.label} accent`}
              >
                {accent === a.id && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={CreditCard} title="Billing">
          {me?.plan === "pro" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Manage your payment method, download invoices, or cancel your
                subscription. Cancelling keeps Pro until the end of the billing
                period.
              </p>
              <button
                type="button"
                disabled={billingBusy}
                onClick={async () => {
                  setBillingBusy(true);
                  await openBillingPortal();
                  setBillingBusy(false);
                }}
                className="mt-3 flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
              >
                {billingBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Manage billing
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You are on the Free plan: {me?.limit ?? PLANS.free.cutoutsPerMonth}{" "}
                cutouts a month with the standard engine. Pro gets{" "}
                {PLANS.pro.cutoutsPerMonth} a month plus premium edge quality for $
                {PLANS.pro.priceMonthly} per month.
              </p>
              <button
                type="button"
                disabled={billingBusy}
                onClick={async () => {
                  setBillingBusy(true);
                  await startCheckout();
                  setBillingBusy(false);
                }}
                className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {billingBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Upgrade to Pro
              </button>
            </>
          )}
        </Section>

        <Section icon={ShieldCheck} title="Legal">
          <div className="flex flex-col gap-1">
            <Link
              href="/terms"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
              Terms of service
            </Link>
            <Link
              href="/privacy"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
              Privacy policy
            </Link>
          </div>
        </Section>

        <Section icon={LogOut} title="Session">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </Section>

        <section className="rounded-2xl border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 border-b border-destructive/20 px-5 py-3.5">
            <Trash2 className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground">
              Deleting your account removes your cutouts, cancels any subscription
              immediately, and cannot be undone. The starter library stays public,
              but everything that is yours goes.
            </p>
            <label className="mt-4 block text-xs font-medium text-muted-foreground">
              Type <span className="font-mono text-destructive">DELETE</span> to confirm
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-destructive sm:w-48"
              />
              <button
                type="button"
                disabled={confirmText !== "DELETE" || deleting}
                onClick={deleteAccount}
                className="flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete my account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

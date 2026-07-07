import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Cutout Aura: clean cutouts of anything",
  description:
    "Search anything, get a crisp transparent PNG in seconds, and build a library you can pull from forever. Starter cutouts included on day one.",
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="text-base">
            <Logo />
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <Link href="/#features" className="hover:text-foreground">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/#faq" className="hover:text-foreground">
              FAQ
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-4px_hsl(var(--primary)/0.5)] hover:opacity-90"
            >
              Open the app
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo className="text-sm" markClassName="h-5 w-5" />
            <p className="mt-1 text-xs text-muted-foreground">
              Clean cutouts of anything. Built for creators.
            </p>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} Cutout Aura
          </p>
        </div>
      </footer>
    </div>
  );
}

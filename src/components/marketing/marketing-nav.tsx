"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const PRIMARY_CLS =
  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-4px_hsl(var(--primary)/0.5)] hover:opacity-90";

export function MarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  // null while we don't yet know: default to the signed-out CTAs (most visitors).
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="text-base" onClick={() => setMenuOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth actions */}
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          {authed ? (
            <Link href="/app" className={PRIMARY_CLS}>
              Open the app
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
              <Link href="/login?mode=signup" className={PRIMARY_CLS}>
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground sm:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 sm:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
            {authed ? (
              <Link
                href="/app"
                onClick={() => setMenuOpen(false)}
                className={`${PRIMARY_CLS} text-center`}
              >
                Open the app
              </Link>
            ) : (
              <>
                <Link
                  href="/login?mode=signup"
                  onClick={() => setMenuOpen(false)}
                  className={`${PRIMARY_CLS} text-center`}
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CtaFooter() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  return (
    <section className="checkered-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)]" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Your next post is missing a cutout
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          {authed
            ? "Your library is ready. Search, cut, and save your next image in under a minute."
            : "Sign up free, open a library stocked with ready-to-use cutouts, and cut your first one in under a minute."}
        </p>
        <Link
          href={authed ? "/app" : "/login?mode=signup"}
          className="mt-8 flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.6)] transition-transform hover:scale-[1.02]"
        >
          {authed ? "Open the app" : "Start cutting, free"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

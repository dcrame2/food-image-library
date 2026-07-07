"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function HeroCta() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  const primaryHref = authed ? "/app" : "/login?mode=signup";
  const primaryLabel = authed ? "Open the app" : "Start cutting, free";

  return (
    <>
      <div className="mt-8 flex justify-center">
        <Link
          href={primaryHref}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.6)] transition-transform hover:scale-[1.02]"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {!authed && (
        <p className="mt-4 text-xs text-muted-foreground">
          Free plan included. No card required.
        </p>
      )}
    </>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaFooter() {
  return (
    <section className="checkered-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)]" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Your next post is missing a cutout
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Sign up free, open a library stocked with ready-to-use cutouts, and cut
          your first one in under a minute.
        </p>
        <Link
          href="/login"
          className="mt-8 flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.6)] transition-transform hover:scale-[1.02]"
        >
          Start cutting, free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

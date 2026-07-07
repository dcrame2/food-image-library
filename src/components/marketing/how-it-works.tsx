import { Search, Download, Copy, Archive, Check } from "lucide-react";
import clsx from "clsx";

const CUT = "/marketing/cutouts";

function StepBadge({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {n}
      </span>
      <h3 className="text-lg font-semibold">{label}</h3>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Search it. Cut it. Ship it.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three steps. About twenty seconds. Zero design software.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {/* Step 1: Search */}
          <div className="rounded-2xl border border-border bg-background/60 p-5">
            <div className="flex h-44 flex-col justify-center gap-3 rounded-xl border border-border bg-card/60 p-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">hoka clifton</span>
                <span className="ml-0.5 h-3.5 w-px animate-pulse bg-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { img: "hoka-clifton-10s", bg: "from-slate-200 to-slate-400" },
                  { img: "nike-hoodie", bg: "from-zinc-300 to-zinc-500" },
                  { img: "hoka-clifton-10s", bg: "from-stone-200 to-stone-400" },
                ].map((tile, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "relative aspect-square overflow-hidden rounded-md bg-gradient-to-br",
                      tile.bg,
                      i === 0 ? "ring-2 ring-primary" : "opacity-60",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${CUT}/${tile.img}.png`}
                      alt=""
                      aria-hidden
                      className="h-full w-full object-contain p-1.5 mix-blend-multiply"
                    />
                    {i === 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <StepBadge n="1" label="Search it" />
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Type the thing. Shoes, snacks, supplements, whatever. Pick your
                favorite from the results.
              </p>
            </div>
          </div>

          {/* Step 2: Cut */}
          <div className="rounded-2xl border border-border bg-background/60 p-5">
            <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-xl border border-border">
              {/* Left half: original photo backdrop. Right half: clean transparent. */}
              <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-br from-orange-900/40 to-rose-900/30" />
              <div className="checkered-bg absolute inset-y-0 right-0 w-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-primary/70 shadow-[0_0_12px_hsl(var(--primary))]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${CUT}/hoka-clifton-10s.png`}
                alt=""
                aria-hidden
                className="relative h-28 w-28 object-contain drop-shadow-2xl"
              />
              <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
                PNG
              </span>
            </div>
            <div className="mt-4">
              <StepBadge n="2" label="Cut it" />
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The background disappears in seconds. Clean edges, transparent
                PNG, saved to your library.
              </p>
            </div>
          </div>

          {/* Step 3: Ship */}
          <div className="rounded-2xl border border-border bg-background/60 p-5">
            <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/60 p-4">
              <div className="checkered-bg flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${CUT}/hoka-clifton-10s.png`}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
              <div className="flex w-full flex-col gap-1.5">
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">
                  <Download className="h-3.5 w-3.5" />
                  Save to Photos
                </div>
                <div className="flex gap-1.5">
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-muted-foreground">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </div>
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-muted-foreground">
                    <Archive className="h-3.5 w-3.5" />
                    Zip
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <StepBadge n="3" label="Ship it" />
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Save to your phone, copy to clipboard, or zip a whole batch. Your
                content, out the door.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

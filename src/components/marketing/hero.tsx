import { HeroCta } from "@/components/marketing/hero-cta";

// Real cutouts from the starter library, bundled locally so the landing page
// never depends on storage being reachable.
const MARQUEE = [
  "coca-cola",
  "chocolate-chip-cookie",
  "monster-energy",
  "avocado",
  "gu-gel",
  "mcdonald-s-french-fries",
  "nerds-clusers",
  "latte",
  "cheetos",
  "taco-bell-doritos-locos-taco",
  "greek-yogurt-with-fruit",
  "reese-s-peanut-butter-cups",
];

export function Hero() {
  return (
    <section className="checkered-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_78%)]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 pb-14 text-center sm:pt-36 sm:pb-20">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Starter cutouts ready on day one
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Cut out anything.
          <br />
          <span className="text-primary">Keep it forever.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Search anything on the web and get a crisp, transparent PNG in seconds.
          No manual erasing, no green screen, no Photoshop degree. Just clean
          cutouts, organized and ready whenever you are.
        </p>
        <HeroCta />
      </div>

      <div className="relative overflow-hidden pb-10 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="animate-marquee flex w-max gap-6 sm:gap-10">
          {[...MARQUEE, ...MARQUEE].map((name, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${name}-${i}`}
              src={`/marketing/cutouts/${name}.png`}
              alt=""
              aria-hidden
              className="h-16 w-16 select-none object-contain drop-shadow-xl sm:h-24 sm:w-24"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

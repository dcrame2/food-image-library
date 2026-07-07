import { Search, Scissors, FolderOpen, Share2, Library, Archive } from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Search, do not screenshot",
    body: "Type what you want. We search the web, you pick the shot, and the background is gone before you can say clipping mask.",
  },
  {
    icon: Scissors,
    title: "Edges that do not embarrass you",
    body: "Pro runs a premium removal engine tuned for hair, steam, straws, and every other edge case that ruins a cutout.",
  },
  {
    icon: Library,
    title: "A running start",
    body: "Every account opens with a curated starter library of cutouts. Day one, you are already stocked.",
  },
  {
    icon: FolderOpen,
    title: "Organized like you mean it",
    body: "Categories, tags, and instant search. The cutout you need is three keystrokes away, not thirty scrolls deep.",
  },
  {
    icon: Share2,
    title: "Straight to your phone",
    body: "One tap opens the share sheet and drops the PNG into Photos. Post it while the idea is still hot.",
  },
  {
    icon: Archive,
    title: "Export by the armload",
    body: "Select a batch, hit zip, and get a tidy folder-per-category archive. Your editor will think you have an assistant.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything between the idea and the post
        </h2>
        <p className="mt-3 text-muted-foreground">
          Cutout Aura handles the boring middle so your content keeps moving.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

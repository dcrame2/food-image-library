import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What exactly is a cutout?",
    a: "An image with the background removed, saved as a transparent PNG. Drop it on any video, story, thumbnail, or slide and it just sits there looking professional.",
  },
  {
    q: "What do I get for free?",
    a: "A curated starter library of cutouts, plus 10 of your own every month with the standard removal engine. No card required.",
  },
  {
    q: "What makes Pro removal premium?",
    a: "Pro runs a commercial-grade engine that handles the hard stuff: hair, fur, glass, thin straps, busy backgrounds. Standard is solid; premium is noticeably cleaner on tricky images.",
  },
  {
    q: "How does the monthly limit work?",
    a: "Each background removal counts as one cutout. Adding an image that is already transparent is free and unlimited. Limits reset on the first of every month.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, from your account menu in two clicks. You keep Pro until the end of the billing period, and everything you cut stays in your library.",
  },
  {
    q: "Whose images are these?",
    a: "You find images on the public web and cut them for your own content. Like any sourcing workflow, you are responsible for having the right to use what you publish.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Questions, answered
        </h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border bg-background/60 px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold marker:hidden">
                {f.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

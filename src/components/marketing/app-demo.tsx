"use client";

import { motion } from "framer-motion";
import { Search, Download, Plus, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

const DEMO_TILES = [
  { src: "/marketing/cutouts/coca-cola.png", name: "Coca Cola" },
  { src: "/marketing/cutouts/glazed-donut.png", name: "Glazed Donut" },
  { src: "/marketing/cutouts/monster-energy.png", name: "Monster Energy" },
  { src: "/marketing/cutouts/avocado.png", name: "Avocado" },
  { src: "/marketing/cutouts/gu-gel.png", name: "GU Gel" },
  { src: "/marketing/cutouts/mcdonald-s-french-fries.png", name: "French Fries" },
  { src: "/marketing/cutouts/latte.png", name: "Latte" },
  { src: "/marketing/cutouts/cheetos.png", name: "Cheetos" },
  { src: "/marketing/cutouts/hoka-clifton-10s.png", name: "Hoka Clifton 10" },
  { src: "/marketing/cutouts/greek-yogurt-with-fruit.png", name: "Greek Yogurt" },
  { src: "/marketing/cutouts/reese-s-peanut-butter-cups.png", name: "Reese's Cups" },
  { src: "/marketing/cutouts/taco-bell-doritos-locos-taco.png", name: "Doritos Taco" },
];

// Illustrative numbers; keep "All" equal to the category sum.
const DEMO_CATEGORIES = [
  { label: "All", count: 115, active: true },
  { label: "Branded", count: 58 },
  { label: "Drinks", count: 17 },
  { label: "Snacks", count: 17 },
  { label: "Fast Food", count: 16 },
  { label: "Desserts", count: 7 },
];

export function AppDemo() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-4 pb-20 sm:px-6 sm:pb-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your library, always loaded
        </h2>
        <p className="mt-3 text-muted-foreground">
          This is the actual app. Search, filter, tap, done.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative mt-10"
      >
        <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-primary/10 blur-3xl" />

        <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Browser chrome */}
          <div className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
            </div>
            <div className="mx-auto flex h-7 w-full max-w-xs items-center justify-center rounded-md bg-background/80 text-[11px] text-muted-foreground">
              cutoutaura.com/app
            </div>
            <div className="w-10" />
          </div>

          {/* App header mock */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Logo className="hidden text-sm sm:inline-flex" markClassName="h-5 w-5" />
            <div className="flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 sm:max-w-xs">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                protein<span className="animate-pulse text-foreground">|</span>
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
                <Sparkles className="h-3 w-3 text-primary" />
                287 left
              </span>
              <span className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
                <Plus className="h-3.5 w-3.5" />
                Add
              </span>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar mock */}
            <div className="hidden w-44 shrink-0 border-r border-border bg-card/40 p-3 sm:block">
              <p className="px-2 pb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Categories
              </p>
              <div className="space-y-0.5">
                {DEMO_CATEGORIES.map((c) => (
                  <div
                    key={c.label}
                    className={
                      c.active
                        ? "flex items-center justify-between rounded-md bg-primary/15 px-2 py-1.5 text-xs text-primary"
                        : "flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-muted-foreground"
                    }
                  >
                    <span>{c.label}</span>
                    <span className="opacity-60">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid mock */}
            <div className="grid flex-1 grid-cols-3 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-6">
              {DEMO_TILES.map((tile, i) => (
                <motion.div
                  key={tile.src}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                  className="group checkered-bg relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tile.src}
                    alt={tile.name}
                    loading="lazy"
                    className="h-full w-full object-contain p-2.5 transition-transform group-hover:scale-105"
                  />
                  <span className="absolute right-1.5 bottom-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Download className="h-3 w-3" />
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

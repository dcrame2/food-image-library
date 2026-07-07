import clsx from "clsx";

/**
 * Cutout Aura mark: the brand tile with its top-right corner cut away to reveal
 * the transparency checkerboard beneath — the thing the product actually makes.
 * Tile gradient follows the active accent (--primary). Reads down to a favicon.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Cutout Aura"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ca-tile" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          {/* Follows the active accent (--primary). */}
          <stop stopColor="color-mix(in srgb, hsl(var(--primary)) 78%, white)" />
          <stop offset="1" stopColor="color-mix(in srgb, hsl(var(--primary)) 78%, black)" />
        </linearGradient>
        <pattern id="ca-checker" width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#EFF0F3" />
          <rect width="3.5" height="3.5" fill="#C3C3CE" />
          <rect x="3.5" y="3.5" width="3.5" height="3.5" fill="#C3C3CE" />
        </pattern>
      </defs>

      {/* Transparency check, revealed in the cut corner */}
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#ca-checker)" />

      {/* Brand tile with its top-right corner cut off */}
      <path
        d="M15,2 L29,2 L46,19 L46,33 Q46,46 33,46 L15,46 Q2,46 2,33 L2,15 Q2,2 15,2 Z"
        fill="url(#ca-tile)"
      />

      {/* Crisp highlight along the cut edge */}
      <path d="M29,2 L46,19" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.3" />
    </svg>
  );
}

/** Full wordmark: mark plus "Cutout Aura" text. */
export function Logo({
  className,
  markClassName,
  showText = true,
}: {
  className?: string;
  markClassName?: string;
  showText?: boolean;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      {/* markClassName fully replaces the default so the two size utilities
          never conflict (Tailwind picks by source order, not class order). */}
      <LogoMark className={markClassName ?? "h-6 w-6"} />
      {showText && (
        <span className="font-semibold tracking-tight">
          Cutout <span className="text-primary">Aura</span>
        </span>
      )}
    </span>
  );
}

import clsx from "clsx";

/**
 * Cutout Aura mark: a solid "subject" shape (the cutout) haloed by concentric
 * aura rings, on the brand gradient tile. Reads at any size down to a favicon.
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
        <linearGradient id="ca-tile" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          {/* Follows the active accent (--primary). */}
          <stop stopColor="color-mix(in srgb, hsl(var(--primary)) 78%, white)" />
          <stop offset="1" stopColor="color-mix(in srgb, hsl(var(--primary)) 78%, black)" />
        </linearGradient>
        <radialGradient id="ca-aura" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tile */}
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#ca-tile)" />

      {/* Aura glow */}
      <circle cx="24" cy="24" r="16" fill="url(#ca-aura)" />

      {/* Aura rings */}
      <rect
        x="10.5"
        y="10.5"
        width="27"
        height="27"
        rx="9"
        stroke="#FFFFFF"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <rect
        x="15.5"
        y="15.5"
        width="17"
        height="17"
        rx="6"
        stroke="#FFFFFF"
        strokeOpacity="0.65"
        strokeWidth="2"
      />

      {/* Subject (the cutout) */}
      <rect x="20" y="20" width="8" height="8" rx="3" fill="#FFFFFF" />
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
      <LogoMark className={clsx("h-6 w-6", markClassName)} />
      {showText && (
        <span className="font-semibold tracking-tight">
          Cutout<span className="text-primary">Aura</span>
        </span>
      )}
    </span>
  );
}

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Cutout Aura: Clean Cutouts of Anything";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The brand mark (Corner Reveal), inlined so the image is fully self-contained.
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="t" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FB6E6E"/><stop offset="1" stop-color="#DC2626"/>
    </linearGradient>
    <pattern id="c" width="7" height="7" patternUnits="userSpaceOnUse">
      <rect width="7" height="7" fill="#EFF0F3"/>
      <rect width="3.5" height="3.5" fill="#C3C3CE"/>
      <rect x="3.5" y="3.5" width="3.5" height="3.5" fill="#C3C3CE"/>
    </pattern>
  </defs>
  <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#c)"/>
  <path d="M15,2 L29,2 L46,19 L46,33 Q46,46 33,46 L15,46 Q2,46 2,33 L2,15 Q2,2 15,2 Z" fill="url(#t)"/>
  <path d="M29,2 L46,19" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.3" fill="none"/>
</svg>`;

// Pull a real weight of Inter at render time so the wordmark is properly heavy.
async function loadInter(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const [bold, regular] = await Promise.all([loadInter(800), loadInter(400)]);
  const mark = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString("base64")}`;

  const fonts = [
    bold && { name: "Inter", data: bold, weight: 800 as const, style: "normal" as const },
    regular && { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
  ].filter(Boolean) as {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 800;
    style: "normal";
  }[];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0c",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* Hairline vignette frame for a premium edge. */}
        <div
          style={{
            position: "absolute",
            inset: 28,
            display: "flex",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img src={mark} width={288} height={288} alt="" />

          <div
            style={{
              marginTop: 40,
              fontSize: 108,
              fontWeight: 800,
              letterSpacing: -4,
              color: "#f04747",
              display: "flex",
            }}
          >
            Cutout Aura
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 33,
              fontWeight: 400,
              letterSpacing: -0.5,
              color: "#9a9aa4",
              display: "flex",
            }}
          >
            Clean cutouts of anything
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}

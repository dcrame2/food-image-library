import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeSync } from "@/components/theme-sync";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.cutoutaura.com",
  ),
  title: {
    default: "Cutout Aura",
    template: "%s | Cutout Aura",
  },
  description:
    "Clean, transparent cutouts of anything. Search it, cut it, ship it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeSync />
        {children}
        <Toaster theme="system" position="bottom-center" richColors />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cutout Library",
  description: "Personal library of transparent-background cutouts for reels",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

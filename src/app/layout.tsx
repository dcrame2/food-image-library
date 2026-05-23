import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food Image Library",
  description: "Personal library of transparent-background food images for reels",
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

import type { Metadata, Viewport } from "next";
import { Unbounded, Manrope, Inter, JetBrains_Mono } from "next/font/google";
import { OfflineReady } from "@/deck/OfflineReady";
import "./globals.css";

// Cyrillic subsets are mandatory — half the deck renders in Uzbek Cyrillic.
// The Latin subset carries U+02BB/02BC, the ʻ in "oʻzbek" and "gʻisht".
//
// Both Cyrillic subsets, not just the first: Google's `cyrillic` range stops at
// U+045F, which covers ў but not ғ U+0493, қ U+049B or ҳ U+04B3 — three letters
// Uzbek cannot do without. They live in `cyrillic-ext`.
//
// Inter is loaded purely as the glyph safety net: it carries ʻ ғ ҳ қ Ғ Ҳ Қ ў in
// every weight, so it sits second in each font stack (see globals.css) and
// answers for anything the primary face lacks before any local fallback can.

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "block",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "block",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "block",
});

const tech = JetBrains_Mono({
  variable: "--font-tech",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "700"],
  display: "block",
});

export const metadata: Metadata = {
  title: "IMARAT Development — 9-avgust webinar",
  description: "Sifat taklif emas, majburiyat.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#04120C",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uz"
      className={`${unbounded.variable} ${manrope.variable} ${inter.variable} ${tech.variable} h-full`}
    >
      <body className="h-full antialiased">
        {children}
        <OfflineReady />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Playfair, Playfair_Display, Inter, JetBrains_Mono, Caveat } from "next/font/google";
import { OfflineReady } from "@/deck/OfflineReady";
import "./globals.css";

// Cyrillic subsets are mandatory — half the deck renders in Uzbek Cyrillic.
// The Latin subset carries U+02BB/02BC, the ʻ in "oʻzbek" and "gʻisht".
//
// Both Cyrillic subsets, not just the first: Google's `cyrillic` range stops at
// U+045F (plus Ґґ and Ұұ), which covers ў but not ғ U+0493, қ U+049B or ҳ U+04B3
// — three letters Uzbek cannot do without. They live in `cyrillic-ext`, and
// without it /preflight reports them as tofu in JetBrains Mono.
//
// Playfair Display is the exception, and not by choice: Google ships it as
// cyrillic | latin | latin-ext | vietnamese only. `npx tsx scripts/glyph-audit.mts`
// counts what that costs — 12 of the 42 titles need ғ Қ қ ҳ, the cover
// ("Оёғимиз остидаги замин") and the closing "Раҳмат!" among them — and at
// 92 px a fallback serif inside a Playfair word is not subtle.
//
// So the four glyphs come from Playfair, the variable sibling by the same
// designer, sitting behind Playfair Display in --font-display. Ordering is what
// keeps it to four: Playfair Display is asked first and covers every other
// letter, so Playfair is only ever reached for cyrillic-ext. Naming that one
// subset does not narrow the @font-face unicode-ranges — Google returns all
// five either way — it narrows what gets preloaded, which is the file we want.
// The opsz axis (5–1200) then lets font-optical-sizing pick display cuts at
// Title sizes on its own, which is what keeps the two faces in step.
//
// The ordering that makes this work lives in globals.css, not here:
// adjustFontFallback: false is accepted by the types but does not reach the
// emitted CSS under Turbopack, so --font-display spells the stack out instead.

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "block",
});

const playfairExt = Playfair({
  variable: "--font-playfair-ext",
  subsets: ["cyrillic-ext"],
  axes: ["opsz"],
  style: ["normal", "italic"],
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

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "600", "700"],
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
  themeColor: "#17161a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uz"
      className={`${playfair.variable} ${playfairExt.variable} ${inter.variable} ${tech.variable} ${caveat.variable} h-full`}
    >
      <body className="h-full antialiased">
        {children}
        <OfflineReady />
      </body>
    </html>
  );
}

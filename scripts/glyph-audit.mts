/**
 * Which display-face strings need glyphs Playfair Display does not ship?
 *
 * Playfair has no `cyrillic-ext`, so ғ Ғ қ Қ ҳ Ҳ (U+0492..U+04B3) fall through
 * to whatever serif the OS offers. Everything rendered with `font-display`
 * is at 36–92 px, so a substitution is not subtle.
 */

import { DECK } from "../src/deck/registry";
import { S } from "../src/content/strings";
import { t } from "../src/content/i18n";

const MISSING = /[ҒғҚқҲҳ]/;

const hits = (s: string) => Array.from(new Set(s.match(new RegExp(MISSING, "g")) ?? []));

// Slide labels: drawn by the overview grid and the error boundary in font-display.
const labels = DECK.map((s) => ({ id: s.id, cyrl: t(s.label, "cyrl") })).filter((r) =>
  MISSING.test(r.cyrl),
);

// Every `title` in the string tree — these are the <Title> elements.
const titles: { path: string; cyrl: string }[] = [];
const walk = (node: unknown, path: string) => {
  if (node == null) return;
  if (typeof node === "string") {
    if (/\.(title|rule)$/.test(path)) {
      const c = t(node, "cyrl");
      if (MISSING.test(c)) titles.push({ path, cyrl: c });
    }
    return;
  }
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.latn === "string" && typeof o.cyrl === "string") {
      if (/\.(title|rule)$/.test(path) && MISSING.test(o.cyrl)) {
        titles.push({ path, cyrl: o.cyrl });
      }
      return;
    }
    for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
  }
};
walk(S, "S");

const all = [...labels.map((l) => l.cyrl), ...titles.map((x) => x.cyrl)];
const glyphs = Array.from(new Set(all.flatMap(hits))).sort();

console.log(`slide labels affected: ${labels.length} / ${DECK.length}`);
for (const l of labels) console.log(`  ${l.id.padEnd(18)} ${l.cyrl}`);
console.log(`\ntitles affected: ${titles.length}`);
for (const x of titles) console.log(`  ${x.path.padEnd(30)} ${x.cyrl}`);
console.log(`\nglyphs needed: ${glyphs.join(" ")}`);

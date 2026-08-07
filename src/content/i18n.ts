import { toCyrl } from "./translit";

export type Lang = "latn" | "cyrl";

/**
 * A localisable string. Plain strings are authored in Latin and derived into
 * Cyrillic; the object form is an explicit override for the cases where the
 * transliteration rules are wrong.
 */
export type L = string | { latn: string; cyrl: string };

export const t = (v: L, lang: Lang): string =>
  typeof v === "string" ? (lang === "latn" ? v : toCyrl(v)) : v[lang];

/** Narrow no-break space — keeps "38 000 000" from wrapping mid-number. */
const NNBSP = " ";

export const num = (n: number): string =>
  new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, NNBSP);

/**
 * Postfix, like `soum` below and like the client's own copy ("9 700 $ dan
 * boshlanadigan"). Prefixed, Playfair's double-bar dollar overshoots the
 * figures top and bottom and its right terminal runs into the first digit at
 * the 116–150 px sizes this deck sets it in.
 */
export const usd = (n: number): string => `${num(n)}${NNBSP}$`;

export const soum = (n: number, lang: Lang): string =>
  `${num(n)}${NNBSP}${lang === "latn" ? "soʻm" : "сўм"}`;

/** 220_000_000_000 → "220 mlrd" / "220 млрд" */
export const billions = (n: number, lang: Lang): string =>
  `${num(Math.round(n / 1e9))}${NNBSP}${lang === "latn" ? "mlrd" : "млрд"}`;

export const million = (n: number, lang: Lang): string =>
  `${num(Math.round(n / 1e6))}${NNBSP}${lang === "latn" ? "mln" : "млн"}`;

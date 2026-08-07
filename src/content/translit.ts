// Uzbek Latin → Uzbek Cyrillic.
//
// The deck carries ~600 lines of copy. Authoring both alphabets by hand doubles
// the work and doubles the places a last-minute price edit can go stale, so we
// author Latin and derive Cyrillic. Anything the rules get wrong is corrected
// per-string via `{ latn, cyrl }` in strings.ts — see /audit for the side-by-side.

/** Every apostrophe glyph a human or a Word autocorrect might produce. */
const APOS = "ʻʼ‘’'`´";
const A = `[${APOS}]`;

/**
 * Matched before transliteration; the replacement is spliced back in verbatim.
 * Covers brand names that stay Latin and words whose Cyrillic spelling is fixed
 * by convention rather than by the letter rules.
 */
const OVERRIDES: Array<[RegExp, string]> = [
  [/IMARAT Development/g, "IMARAT Development"],
  [/\bIMARAT\b/g, "IMARAT"],
  [/Sergeli City/g, "Сергели Сити"],
  [/\bEscrow\b/gi, "Эскроу"],
  [/\bEskrou\b/gi, "Эскроу"],
  [/\bVIP Club\b/g, "VIP Club"],
  [/\bVIP\b/g, "VIP"],
  [/\bTelegram\b/gi, "Телеграм"],
  [/\bTrade-?in\b/gi, "Трейд-ин"],
  [/\bZoom\b/g, "Zoom"],
  [/\bGOST\b/g, "ГОСТ"],
  [/\bMSK\b/g, "МСК"],
  [/\bTashkent\b/g, "Тошкент"],
  // "ye" → е loses the hard sign the Cyrillic spelling keeps. Suffixes ride
  // along, since only the matched stem is stashed.
  [/\bObyekt/g, "Объект"],
  [/\bobyekt/g, "объект"],
  // "ts" → ц is right inside borrowings (vibratsiya, konditsioner) but wrong
  // when the t ends a stem and the s opens a suffix: navbat + siz.
  [/\bNavbatsiz/g, "Навбатсиз"],
  [/\bnavbatsiz/g, "навбатсиз"],
];

/** Runs kept exactly as written: urls, handles, engineering codes, units. */
const PROTECT: RegExp[] = [
  /https?:\/\/\S+/g,
  /@[A-Za-z0-9_]+/g,
  /\b[a-z][a-z0-9-]*\.(?:uz|com|me|org|net)\b/gi,
  /\b[A-Z]{1,2}\d{2,4}[A-Z]?\b/g, // A500S, M400, A1
  /\b\d+(?:[.,]\d+)?\s?(?:m²|m2|km|kg|Hz|CRF)\b/gi,
];

/** Placeholders live in the Private Use Area so nothing else can produce them. */
const PH_OPEN = "";
const PH_CLOSE = "";

const DIGRAPHS: Array<[string, string]> = [
  [`o${A}`, "ў"],
  [`g${A}`, "ғ"],
  // Longest first: "yo" would otherwise eat the y and the o of "yoʻl", leaving a
  // bare apostrophe to become a tutuq belgisi — ёъл instead of йўл. The word is
  // "yoʻq" and every deck sentence about a missing guarantee contains it.
  [`yo${A}`, "йў"],
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
  ["yi", "йи"],
  ["sh", "ш"],
  ["ch", "ч"],
  ["ts", "ц"],
];

const SINGLES: Record<string, string> = {
  a: "а", b: "б", c: "к", d: "д", e: "е", f: "ф", g: "г", h: "ҳ",
  i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п",
  q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", x: "х",
  y: "й", z: "з",
};

const isLatinLetter = (ch: string | undefined) => !!ch && /[a-zA-Z]/.test(ch);

/** Mirror the source run's casing onto the produced Cyrillic. */
function matchCase(src: string, out: string): string {
  const letters = src.replace(new RegExp(A, "g"), "");
  if (letters.length > 1 && letters === letters.toUpperCase() && /[A-Z]/.test(letters)) {
    return out.toUpperCase();
  }
  if (/[A-Z]/.test(src[0])) return out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

const DIGRAPH_RE = DIGRAPHS.map(
  ([p, cyr]) => [new RegExp(`^(?:${p})`, "i"), cyr] as const,
);

function transliterate(input: string): string {
  let out = "";
  let i = 0;

  while (i < input.length) {
    // Placeholders pass through untouched.
    if (input[i] === PH_OPEN) {
      const end = input.indexOf(PH_CLOSE, i);
      out += input.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    const rest = input.slice(i);
    let matched = false;
    for (const [re, cyr] of DIGRAPH_RE) {
      const m = rest.match(re);
      if (m) {
        out += matchCase(m[0], cyr);
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = input[i];
    const lower = ch.toLowerCase();

    // Word-initial "e" is э in Uzbek Cyrillic (eski → эски); medial stays е.
    if (lower === "e" && !isLatinLetter(input[i - 1])) {
      out += matchCase(ch, "э");
      i++;
      continue;
    }

    // An apostrophe surrounded by letters is the tutuq belgisi; otherwise it is
    // punctuation that has already served its purpose in the digraph pass.
    if (APOS.includes(ch)) {
      out += isLatinLetter(input[i - 1]) && isLatinLetter(input[i + 1]) ? "ъ" : "";
      i++;
      continue;
    }

    if (lower in SINGLES) {
      out += matchCase(ch, SINGLES[lower]);
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

const cache = new Map<string, string>();

export function toCyrl(input: string): string {
  const hit = cache.get(input);
  if (hit !== undefined) return hit;

  const kept: string[] = [];
  const stash = (value: string) => {
    kept.push(value);
    return `${PH_OPEN}${kept.length - 1}${PH_CLOSE}`;
  };

  let work = input;
  for (const [re, to] of OVERRIDES) work = work.replace(re, () => stash(to));
  for (const re of PROTECT) work = work.replace(re, (m) => stash(m));

  const result = transliterate(work).replace(
    new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, "g"),
    (_, n: string) => kept[Number(n)],
  );

  cache.set(input, result);
  return result;
}

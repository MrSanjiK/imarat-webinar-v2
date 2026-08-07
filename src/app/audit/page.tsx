"use client";

import { useMemo, useState } from "react";
import { S } from "@/content/strings";
import { toCyrl } from "@/content/translit";

/**
 * Both alphabets, side by side, for the client to read before air.
 *
 * Cyrillic is derived from the Latin by rule (see translit.ts), and rules are
 * wrong on brand names, borrowings and the odd digraph. This page exists so a
 * native reader can find those in one pass instead of the presenter finding
 * them on stage. Anything wrong here is fixed by pinning that one string to
 * `{ latn, cyrl }` in strings.ts — the path is printed next to every row.
 */

type Row = { path: string; latn: string; cyrl: string; pinned: boolean };

/** Walks the whole string table, flattening to leaves and keeping the path. */
function collect(node: unknown, path: string, out: Row[]) {
  if (typeof node === "string") {
    out.push({ path, latn: node, cyrl: toCyrl(node), pinned: false });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collect(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    // An explicit override: show what the client will actually see, and mark it
    // so a reviewer knows this row is already hand-set and not rule output.
    if (typeof o.latn === "string" && typeof o.cyrl === "string") {
      out.push({ path, latn: o.latn, cyrl: o.cyrl, pinned: true });
      return;
    }
    for (const [k, v] of Object.entries(o)) collect(v, path ? `${path}.${k}` : k, out);
  }
}

/**
 * Rows where a rule had to make a judgement rather than swap one letter for
 * another. `ъ` means an apostrophe was read as a tutuq belgisi, `э` means an
 * "e" was read as word-initial, `ц` means "ts" was read as a borrowing rather
 * than a stem meeting a suffix, and a Latin letter surviving into the Cyrillic
 * means an override deliberately kept it. Everything else — ў ғ ҳ қ ч ш —
 * is a fixed one-to-one mapping and cannot be wrong on its own.
 */
const RISKY = /[ъэц]|[A-Za-z]/;

export default function Audit() {
  const [q, setQ] = useState("");
  const [onlyRisky, setOnlyRisky] = useState(false);

  const rows = useMemo(() => {
    const out: Row[] = [];
    collect(S, "", out);
    return out;
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyRisky && (r.pinned || !RISKY.test(r.cyrl))) return false;
      if (!needle) return true;
      return (
        r.path.toLowerCase().includes(needle) ||
        r.latn.toLowerCase().includes(needle) ||
        r.cyrl.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, onlyRisky]);

  const pinned = rows.filter((r) => r.pinned).length;

  return (
    <main
      className="min-h-full font-sans"
      style={{ background: "#F4F1EA", color: "#2B2A28", padding: "48px 56px 120px" }}
    >
      <header style={{ display: "flex", alignItems: "baseline", gap: 20, flexWrap: "wrap" }}>
        <h1 className="font-display" style={{ fontSize: 44 }}>
          Matn tekshiruvi
        </h1>
        <span
          className="font-mono"
          style={{ fontSize: 14, color: "#8B867E", letterSpacing: "0.1em" }}
        >
          LOTIN → KIRILL
        </span>
        <span style={{ marginLeft: "auto", fontSize: 16, color: "#8B867E" }}>
          {`${rows.length} ta satr · ${pinned} tasi qoʻlda belgilangan`}
        </span>
      </header>

      <p style={{ marginTop: 18, fontSize: 19, maxWidth: 980, lineHeight: 1.5, color: "#4A4844" }}>
        Kirill ustuni qoida asosida avtomatik hosil qilinadi. Xato satrni topsangiz, oʻng tarafdagi
        yoʻlni menga ayting — oʻsha satr qoʻlda toʻgʻrilanadi.
      </p>

      <div style={{ marginTop: 28, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Qidirish…"
          className="font-mono"
          style={{
            fontSize: 16,
            padding: "12px 18px",
            width: 380,
            border: "1.5px solid rgba(43,42,40,0.25)",
            borderRadius: 4,
            background: "transparent",
            color: "#2B2A28",
            outline: "none",
          }}
        />
        <button
          onClick={() => setOnlyRisky((v) => !v)}
          className="font-mono"
          style={{
            fontSize: 14,
            letterSpacing: "0.1em",
            padding: "12px 20px",
            border: "1.5px solid #2B2A28",
            borderRadius: 4,
            background: onlyRisky ? "#2B2A28" : "transparent",
            color: onlyRisky ? "#F4F1EA" : "#2B2A28",
            cursor: "pointer",
          }}
        >
          FAQAT SHUBHALI HARFLAR
        </button>
        <span style={{ fontSize: 16, color: "#8B867E" }}>{`${shown.length} ta koʻrsatilmoqda`}</span>
      </div>

      <div style={{ marginTop: 32, display: "grid", gap: 0 }}>
        {shown.map((r, i) => (
          <div
            key={`${r.path}-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 320px",
              gap: 28,
              alignItems: "start",
              padding: "16px 0",
              borderBottom: "1px solid rgba(43,42,40,0.1)",
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1.45 }}>{r.latn}</span>
            <span style={{ fontSize: 20, lineHeight: 1.45, color: r.pinned ? "#0E5C43" : "#2B2A28" }}>
              {r.cyrl}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 13, color: "#8B867E", wordBreak: "break-all", lineHeight: 1.5 }}
            >
              {r.path}
              {r.pinned && <span style={{ color: "#0E5C43" }}> · qoʻlda</span>}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}

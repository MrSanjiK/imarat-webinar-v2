"use client";

import { useEffect, useState } from "react";
import { intentFor } from "@/deck/keys";

type Hit = {
  n: number;
  key: string;
  code: string;
  keyCode: number;
  repeat: boolean;
  dt: number;
  intent: string;
};

/**
 * Plug the actual clicker in on the morning of the webinar, press every button
 * once, and read what it sends. If a button reports `—` under intent, add its
 * key to the sets in deck/keys.ts. This is thirty seconds of work that removes
 * the single largest unknown in the whole run.
 */
export default function KeysPage() {
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    let n = 0;
    let prev = performance.now();

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      const now = performance.now();
      const hit: Hit = {
        n: ++n,
        key: e.key === " " ? "Space" : e.key,
        code: e.code,
        keyCode: e.keyCode,
        repeat: e.repeat,
        dt: Math.round(now - prev),
        intent: intentFor(e) ?? "—",
      };
      prev = now;
      setHits((h) => [hit, ...h].slice(0, 40));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main
      className="min-h-full p-14 font-mono"
      style={{ background: "#F4F1EA", color: "#2B2A28" }}
    >
      <h1 style={{ fontSize: 30, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Pult tekshiruvi
      </h1>
      <p style={{ marginTop: 12, fontSize: 17, color: "#8B867E", maxWidth: 760 }}>
        Pultning har bir tugmasini bir martadan bosing. “intent” ustunida “—” chiqsa,
        oʻsha tugma hali biriktirilmagan — <code>src/deck/keys.ts</code> ga qoʻshiladi.
        <br />
        <span style={{ color: "#0E5C43" }}>dt</span> — oldingi bosishdan keyingi vaqt:
        160&nbsp;ms dan kichik juftliklar pultning ikki marta yuborishi.
      </p>

      {hits.length === 0 && (
        <div style={{ marginTop: 60, fontSize: 22, color: "#8B867E" }}>
          Tugmani kuting…
        </div>
      )}

      <table style={{ marginTop: 40, borderCollapse: "collapse", fontSize: 17 }}>
        <tbody>
          {hits.map((h) => (
            <tr key={h.n} style={{ borderTop: "1px solid rgba(43,42,40,0.14)" }}>
              <Cell w={54} dim>{`#${h.n}`}</Cell>
              <Cell w={190} strong>{h.key}</Cell>
              <Cell w={190}>{h.code}</Cell>
              <Cell w={90} dim>{String(h.keyCode)}</Cell>
              <Cell w={110} dim={!h.repeat}>{h.repeat ? "repeat" : "—"}</Cell>
              <Cell w={110} color={h.dt < 160 ? "#B3441E" : "#8B867E"}>{`${h.dt} ms`}</Cell>
              <Cell w={140} color={h.intent === "—" ? "#B3441E" : "#0E5C43"} strong>
                {h.intent}
              </Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function Cell({
  children,
  w,
  dim,
  strong,
  color,
}: {
  children: React.ReactNode;
  w: number;
  dim?: boolean;
  strong?: boolean;
  color?: string;
}) {
  return (
    <td
      style={{
        width: w,
        padding: "12px 16px 12px 0",
        color: color ?? (dim ? "#8B867E" : "#2B2A28"),
        fontWeight: strong ? 700 : 400,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

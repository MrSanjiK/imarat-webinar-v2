"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { num, t, type Lang } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { CountUp, V } from "@/ui/vivid";

/**
 * InstallmentVariants — chapter 6, slide `o-installments`. Slot is exactly
 * 1600 × 620 stage pixels, authored 1:1 so every figure is real text at a real
 * size rather than a scaled SVG glyph and `.tnum` actually applies.
 *
 * v2 "IMARAT Vivid": two payment tracks, one per row, each read left to right
 * as a sentence — what you put down, how many months you then pay, and what one
 * of those months costs. Variant 2 is the gold one; it ends in a discount chip
 * and a discounted total. Gold is money, emerald is structure.
 *
 * Step map (slide `o-installments` has 4 steps, 0…3)
 *   0 — the empty rails: a dashed down-payment outline per track and two grids
 *       of unlit month cells. The shape of the deal before any number is in it.
 *   1 — VARIANT 1. Its down-payment block wipes in left-to-right (clip-path),
 *       its month cells tick on with a dense i*0.012 stagger — forty cells fill
 *       in ~0.48 s, which reads as a bar filling rather than forty events — and
 *       the down payment and monthly figures land on CountUp.
 *   2 — VARIANT 2, same choreography in gold: a bigger down payment, the same
 *       forty months, a visibly smaller monthly figure.
 *   3 — the −10% chip DROPS onto variant 2 with a scale pop (1.5 → 1), the gold
 *       rule draws across the foot, and the discounted total counts up.
 *
 * Every figure is read from `N.plans` — including the cell counts, which are
 * the term lengths themselves, and the discount percentage. Only transform,
 * opacity and clip-path animate.
 */

const W = 1600;
const H = 640;

// two tracks
const ROW_H = 240;
const ROW_Y = [0, 268] as const;

// left column — the down payment
const A_W = 380;
const BLOCK_Y = 54;
const BLOCK_H = 132;

// middle — the months
const G_X = 430;
const G_Y = 54;
const G_COLS = 10;
const CELL_W = 70;
const CELL_H = 32;
const CELL_GAP = 8;

// right — the monthly figure
const C_X = 1250;
const C_W = 350;

// foot — the discounted total
const FOOT_RULE_Y = 536;
const FOOT_Y = 560;

const GHOST_CELL = "rgba(10,31,20,0.07)";
const GHOST_LINE = "rgba(10,31,20,0.16)";

type Track = {
  key: string;
  tag: string;
  down: number;
  months: number;
  monthly: number;
  altMonths: number;
  altMonthly: number;
  gold: boolean;
  at: number;
};

/** One payment track: down-payment block, month grid, monthly figure. */
function Row({
  track,
  step,
  lang,
  chip,
}: {
  track: Track;
  step: number;
  lang: Lang;
  chip?: React.ReactNode;
}) {
  const o = S.offer.installments;
  const on = step >= track.at;
  const gold = track.gold;
  const accent = gold ? V.gold : V.emerald;
  const soumLabel = lang === "latn" ? "soʻm" : "сўм";

  const rows = Math.ceil(track.months / G_COLS);
  const gridH = rows * CELL_H + (rows - 1) * CELL_GAP;

  return (
    <>
      {/* ── tag ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 900,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <motion.div
          className="font-mono"
          initial={false}
          animate={{ opacity: on ? 1 : 0.3, x: on ? 0 : -10 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{
            fontSize: 22,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: on ? accent : V.ash,
          }}
        >
          {track.tag}
        </motion.div>
        {chip}
      </div>

      {/* ── down-payment block ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: BLOCK_Y,
          width: A_W,
          height: BLOCK_H,
          borderRadius: 26,
          border: `1.5px dashed ${GHOST_LINE}`,
        }}
      />
      <motion.div
        initial={false}
        animate={{
          clipPath: on ? "inset(0% 0% 0% 0% round 26px)" : "inset(0% 100% 0% 0% round 26px)",
        }}
        transition={{ duration: 0.62, ease: EASE }}
        style={{
          position: "absolute",
          left: 0,
          top: BLOCK_Y,
          width: A_W,
          height: BLOCK_H,
          borderRadius: 26,
          background: gold ? V.gold : V.paper,
          border: `2px solid ${accent}`,
          boxShadow: "0 18px 46px rgba(10,31,20,0.10)",
          padding: "0 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: 18,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: gold ? "rgba(10,31,20,0.66)" : V.ash,
          }}
        >
          {t(o.downLabel, lang)}
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 9 }}>
          <span
            className="tnum"
            style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", color: V.ink }}
          >
            <CountUp to={track.down} on={on} duration={0.9} delay={0.2} format={(v) => num(v)} />
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 20, color: gold ? "rgba(10,31,20,0.72)" : V.ash }}
          >
            {soumLabel}
          </span>
        </div>
      </motion.div>

      {/* ── month cells ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: G_X,
          top: G_Y,
          width: G_COLS * CELL_W + (G_COLS - 1) * CELL_GAP,
          height: gridH,
        }}
      >
        {Array.from({ length: track.months }, (_, i) => {
          const col = i % G_COLS;
          const row = Math.floor(i / G_COLS);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: col * (CELL_W + CELL_GAP),
                top: row * (CELL_H + CELL_GAP),
                width: CELL_W,
                height: CELL_H,
              }}
            >
              <div
                style={{ position: "absolute", inset: 0, borderRadius: 8, background: GHOST_CELL }}
              />
              <motion.div
                initial={false}
                animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.6 }}
                transition={{ duration: 0.3, ease: EASE, delay: on ? 0.22 + i * 0.012 : 0 }}
                style={{ position: "absolute", inset: 0, borderRadius: 8, background: accent }}
              />
            </div>
          );
        })}
      </div>

      {/* the other term, spelled out under its own grid */}
      <motion.div
        className="font-mono"
        initial={false}
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : 8 }}
        transition={{ duration: 0.36, ease: EASE, delay: on ? 0.76 : 0 }}
        style={{
          position: "absolute",
          left: G_X,
          top: G_Y + gridH + 18,
          width: 800,
          fontSize: 19,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: V.ash,
          whiteSpace: "nowrap",
        }}
      >
        {`${t(o.or, lang)} ${track.altMonths} ${t(o.monthsLabel, lang)} — ${num(
          track.altMonthly,
        )} ${soumLabel}`}
      </motion.div>

      {/* ── the month you actually pay ─────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{ opacity: on ? 1 : 0, x: on ? 0 : -16 }}
        transition={{ duration: 0.44, ease: EASE, delay: on ? 0.44 : 0 }}
        style={{ position: "absolute", left: C_X, top: G_Y - 4, width: C_W }}
      >
        <div
          className="tnum"
          style={{
            fontSize: 58,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: gold ? V.gold : V.ink,
          }}
        >
          <CountUp to={track.monthly} on={on} duration={1.05} delay={0.5} format={(v) => num(v)} />
        </div>
        <div
          className="font-mono"
          style={{
            marginTop: 14,
            fontSize: 20,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: V.ash,
            whiteSpace: "nowrap",
          }}
        >
          {`${soumLabel} / ${t(o.monthlyLabel, lang)}`}
        </div>
        <div
          className="tnum font-mono"
          style={{
            marginTop: 10,
            fontSize: 20,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: accent,
            whiteSpace: "nowrap",
          }}
        >
          {`${track.months} ${t(o.monthsLabel, lang)}`}
        </div>
      </motion.div>
    </>
  );
}

export function InstallmentVariants({ step }: { step: number }) {
  const lang = useLang();
  const o = S.offer.installments;

  const a = N.plans.a;
  const b = N.plans.b;
  const settled = step >= 3;

  const tracks: Track[] = [
    {
      key: "a",
      tag: t(o.v1, lang),
      down: a.down,
      months: a.terms[0].months,
      monthly: a.terms[0].monthly,
      altMonths: a.terms[1].months,
      altMonthly: a.terms[1].monthly,
      gold: false,
      at: 1,
    },
    {
      key: "b",
      tag: t(o.v2, lang),
      down: b.down,
      months: b.terms[0].months,
      monthly: b.terms[0].monthly,
      altMonths: b.terms[1].months,
      altMonthly: b.terms[1].monthly,
      gold: true,
      at: 2,
    },
  ];

  const discount = `−${Math.round(b.discount * 100)}% ${t(o.discountLabel, lang)}`;

  return (
    <div style={{ position: "relative", width: W, height: H }}>
      {tracks.map((track, i) => (
        <div
          key={track.key}
          style={{ position: "absolute", left: 0, top: ROW_Y[i], width: W, height: ROW_H }}
        >
          <Row
            track={track}
            step={step}
            lang={lang}
            chip={
              track.gold ? (
                <motion.span
                  className="font-mono"
                  initial={false}
                  animate={{
                    opacity: settled ? 1 : 0,
                    scale: settled ? 1 : 1.5,
                    y: settled ? 0 : -24,
                  }}
                  transition={{ duration: 0.46, ease: EASE }}
                  style={{
                    display: "inline-block",
                    padding: "9px 20px 8px",
                    borderRadius: 999,
                    background: V.gold,
                    color: V.ink,
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {discount}
                </motion.span>
              ) : undefined
            }
          />
        </div>
      ))}

      {/* ── discounted total ──────────────────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{ scaleX: settled ? 1 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{
          position: "absolute",
          left: 0,
          top: FOOT_RULE_Y,
          width: W,
          height: 3,
          borderRadius: 3,
          background: V.gold,
          transformOrigin: "left center",
        }}
      />
      <motion.div
        initial={false}
        animate={{ opacity: settled ? 1 : 0, y: settled ? 0 : 16 }}
        transition={{ duration: 0.44, ease: EASE, delay: settled ? 0.16 : 0 }}
        style={{
          position: "absolute",
          left: 0,
          top: FOOT_Y,
          width: W,
          display: "flex",
          alignItems: "baseline",
          gap: 26,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: 22,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: V.ash,
          }}
        >
          {t(o.totalLabel, lang)}
        </span>
        <span
          className="tnum"
          style={{
            fontSize: 62,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: V.gold,
          }}
        >
          <CountUp to={b.total} on={settled} duration={1.2} delay={0.2} format={(v) => num(v)} />
        </span>
        <span className="font-mono" style={{ fontSize: 24, color: V.ash }}>
          {lang === "latn" ? "soʻm" : "сўм"}
        </span>
      </motion.div>
    </div>
  );
}

"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t, usd } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { CountUp, V } from "@/ui/vivid";

/**
 * FloorPriceLadder — chapter 6, slide `o-ladder`. Slot is exactly 1000 × 780
 * stage pixels, authored 1:1 (no scaling), so the price rows can be HTML —
 * `CountUp` is a <span> and tabular numerals must not live in an <svg>.
 *
 * v2 "IMARAT Vivid": flat vector. A sixteen-storey cross-section on the left,
 * four price bands lighting into it, four price rows on the right. One idea:
 * the higher you go, the cheaper it gets — so the bands light TOP-DOWN and the
 * eye lands on the $9 700 tier before it has read any other number.
 *
 * Step map (slide `o-ladder` has 5 steps, 0…4)
 *   0 — empty paper.
 *   1 — the section builds BOTTOM-UP: grade line and its earth ticks, then the
 *       shell outline drawn from the ground up the left wall, over the roof and
 *       back down, then fifteen floor slabs stacking upward one at a time.
 *   2 — THE HERO. Floors 13–16 take a solid gold fill wiped in from the top, a
 *       6 px gold over-draw, and a scale pop (1.14 → 1) about the band's own
 *       centre. Its leader draws out to the right and the $9 700 lands on a
 *       CountUp.
 *   3 — floors 9–12 light in emerald; price row + CountUp.
 *   4 — floors 4–8 and then 2–3 light, fainter and trailing, with their rows.
 *
 * Every figure is read from `N.studio` — floors, prices and the band geometry
 * all derive from the same tier objects, so a price edit the morning of the
 * webinar moves the drawing with it. Only transform / opacity / clip-path /
 * strokeDashoffset animate.
 */

// ── geometry ─────────────────────────────────────────────────────────────────

const W = 1000;
const H = 780;

const FLOORS = 16;
const FLOOR_H = 40;
const BASE_Y = 724;
const TOP_Y = BASE_Y - FLOORS * FLOOR_H; // 84
const X = 30;
const BW = 250;

/** Top edge of floor `n`, counting 1 as the ground floor. */
const yOf = (n: number) => BASE_Y - n * FLOOR_H;

/** "13–16" → [13, 16]; the range comes from figures.ts, never retyped. */
const parseFloors = (s: string): [number, number] => {
  const [lo, hi] = s.split(/\D+/).filter(Boolean).map(Number);
  return [lo, hi ?? lo];
};

/** Top-down: index 0 is the hero band, so it lights first. */
const BAND_STEP = [2, 3, 4, 4] as const;
/** 4–8 and 2–3 share step 4; the lower one trails so they cascade. */
const BAND_LEAD = [0, 0, 0, 0.18] as const;

const BAND_FILL = [V.gold, "rgba(0,168,104,0.34)", "rgba(0,168,104,0.20)", "rgba(0,168,104,0.12)"] as const;
const BAND_EDGE = [V.gold, V.emerald, V.emerald, V.emerald] as const;

const INK_LINE = "rgba(10,31,20,0.9)";
const SLAB_LINE = "rgba(10,31,20,0.28)";

const BANDS = N.studio.tiers.map((tier, i) => {
  const [lo, hi] = parseFloors(tier.floors);
  const y = yOf(hi);
  const h = yOf(lo - 1) - y;
  return { i, floors: tier.floors, usd: tier.usd, y, h, cy: y + h / 2 };
});

/** Fifteen interior slabs; the sixteenth line is the roof, part of the shell. */
const SLABS = Array.from({ length: FLOORS - 1 }, (_, k) => yOf(k + 1));

const SHELL = `M ${X} ${BASE_Y} V ${TOP_Y} H ${X + BW} V ${BASE_Y}`;
const GRADE = `M 0 ${BASE_Y} H 340`;
const EARTH = (() => {
  const parts: string[] = [];
  for (let x = 14; x <= 336; x += 26) parts.push(`M ${x} ${BASE_Y} L ${x - 11} ${BASE_Y + 13}`);
  return parts.join(" ");
})();

const LEAD_X0 = X + BW + 10; // 290
const LEAD_X1 = 352;
const ROW_X = 372;
const ROW_W = W - ROW_X;

// ── kit ──────────────────────────────────────────────────────────────────────

/** A stroke that draws itself. pathLength + strokeDashoffset, never a width. */
function Draw({
  d,
  on,
  stroke,
  w = 3,
  delay = 0,
  dur = 0.6,
  opacity = 1,
}: {
  d: string;
  on: boolean;
  stroke: string;
  w?: number;
  delay?: number;
  dur?: number;
  opacity?: number;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      initial={false}
      animate={{ strokeDashoffset: on ? 0 : 1, opacity: on ? opacity : 0 }}
      transition={{
        strokeDashoffset: { duration: dur, ease: EASE, delay: on ? delay : 0 },
        opacity: { duration: 0.18, delay: on ? delay : 0 },
      }}
    />
  );
}

/** Saturated band fill arriving by a clip rect translated downward. */
function FillDown({
  on,
  x,
  y,
  w,
  h,
  fill,
  delay = 0,
  dur = 0.7,
}: {
  on: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  delay?: number;
  dur?: number;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <clipPath id={`fpl-${uid}`}>
          <motion.rect
            x={x - 1}
            y={y - 1}
            width={w + 2}
            height={h + 2}
            initial={false}
            animate={{ y: on ? 0 : -h - 2 }}
            transition={{ duration: dur, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={fill} clipPath={`url(#fpl-${uid})`} />
    </g>
  );
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function FloorPriceLadder({ step }: { step: number }) {
  const lang = useLang();
  const floorsLabel = t(S.offer.ladder.floorsLabel, lang);
  const built = step >= 1;

  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* grade */}
        <Draw d={GRADE} on={built} stroke={INK_LINE} w={5} dur={0.7} opacity={0.55} />
        <Draw d={EARTH} on={built} stroke={INK_LINE} w={2} opacity={0.24} delay={0.34} dur={0.5} />

        {/* band fills sit under the slabs so the storeys stay legible */}
        {BANDS.map((b) => {
          const on = step >= BAND_STEP[b.i];
          const lead = BAND_LEAD[b.i];
          if (b.i === 0) {
            return (
              <motion.g
                key={b.floors}
                initial={false}
                animate={{ scale: on ? 1 : 1.14, opacity: on ? 1 : 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                style={{ transformOrigin: `${X + BW / 2}px ${b.cy}px` }}
              >
                <FillDown on={on} x={X} y={b.y} w={BW} h={b.h} fill={BAND_FILL[0]} dur={0.72} />
              </motion.g>
            );
          }
          return (
            <FillDown
              key={b.floors}
              on={on}
              x={X}
              y={b.y}
              w={BW}
              h={b.h}
              fill={BAND_FILL[b.i]}
              delay={lead}
              dur={0.6}
            />
          );
        })}

        {/* fifteen slabs, stacking upward */}
        {SLABS.map((y, k) => (
          <Draw
            key={y}
            d={`M ${X} ${y} H ${X + BW}`}
            on={built}
            stroke={SLAB_LINE}
            w={2}
            delay={0.3 + k * 0.035}
            dur={0.34}
          />
        ))}

        {/* shell — up the left wall, over the roof, back down */}
        <Draw d={SHELL} on={built} stroke={INK_LINE} w={6} delay={0.1} dur={1.05} />

        {/* hero over-draw: the gold band gets its own outline */}
        <Draw
          d={`M ${X} ${BANDS[0].y} H ${X + BW} V ${BANDS[0].y + BANDS[0].h} H ${X} Z`}
          on={step >= 2}
          stroke={V.gold}
          w={6}
          delay={0.24}
          dur={0.65}
        />

        {/* leaders out to the price rows */}
        {BANDS.map((b) => (
          <Draw
            key={b.floors}
            d={`M ${LEAD_X0} ${b.cy} H ${LEAD_X1}`}
            on={step >= BAND_STEP[b.i]}
            stroke={BAND_EDGE[b.i]}
            w={b.i === 0 ? 4 : 2.5}
            opacity={b.i === 0 ? 1 : 0.7}
            delay={BAND_LEAD[b.i] + (b.i === 0 ? 0.44 : 0.2)}
            dur={0.3}
          />
        ))}
      </svg>

      {/* ── price rows ─────────────────────────────────────────────────────── */}
      {BANDS.map((b) => {
        const hero = b.i === 0;
        const on = step >= BAND_STEP[b.i];
        const delay = BAND_LEAD[b.i] + (hero ? 0.56 : 0.3);
        const rowH = hero ? 142 : 92;

        return (
          <motion.div
            key={b.floors}
            initial={false}
            animate={{ opacity: on ? 1 : 0, x: on ? 0 : -18 }}
            transition={{ duration: 0.44, ease: EASE, delay: on ? delay : 0 }}
            style={{
              position: "absolute",
              left: ROW_X,
              top: b.cy - rowH / 2,
              width: ROW_W,
              height: rowH,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: hero ? 24 : 20,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: hero ? V.gold : V.ash,
              }}
            >
              {`${b.floors} ${floorsLabel}`}
            </div>
            <div
              className="font-display"
              style={{
                marginTop: hero ? 12 : 8,
                fontSize: hero ? 88 : 54,
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: hero ? V.gold : V.ink,
              }}
            >
              <CountUp
                to={b.usd}
                on={on}
                duration={hero ? 1.15 : 0.8}
                delay={hero ? 0.12 : 0}
                format={(v) => usd(v)}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

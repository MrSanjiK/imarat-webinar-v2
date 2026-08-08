"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { num, t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * TurkeyTimeline — chapter 1 (dark), slide 08. Slot 620 × 340.
 *
 * The argument: 2023 was not only a magnitude. In 2018 an amnesty legalised
 * millions of buildings nobody had inspected, and five years later they came
 * down — and the concrete they were made of was already rotting from inside.
 *
 * v2 "IMARAT Vivid": flat vector, gold amnesty band wiped in under a clip rect,
 * the stock drawn as a dense 10 × 10 grid on a 0.012 stagger.
 *
 * Step map — the slot sits inside `<Reveal at={3}>` in 01-quake.tsx, so the
 * diagram is at opacity 0 before step 3 and nothing may animate earlier: a
 * draw-on spent behind an invisible parent is simply lost. Slide has 5 steps.
 *   0–2 — empty. The slide is still on its three text beats.
 *   3   — the rule draws left to right; 1999 lands as an ash tick, then 2018,
 *         then the GOLD AMNESTY BAND wipes across the span between the amnesty
 *         and the quake, a drop line falls to the stock, and the 10 × 10 grid
 *         (≙ 7 000 000+ legalised buildings) fills on a 0.012 stagger with the
 *         count written above it.
 *   4   — 2023.02.06 M7.8 lands in ember, the grid is struck out, the death
 *         toll counts up, and the CORROSION beat runs: sea-sand chlorides
 *         migrate inward as dots and the rust ring grows around the rebar
 *         section — the reason the stock was never going to hold.
 *
 * Pure function of `step`: every gate is `step >= n`, so 4 → 3 renders exactly
 * what 3 → 4 rendered. Only transform / opacity / strokeDashoffset / clip-path.
 */

// ── beats. Named so re-wiring the slot's <Reveal at={…}> is a one-line change ─

const AT_AMNESTY = 3;
const AT_QUAKE = 4;

const BASE = "rgba(244,251,244,0.9)";
const DIM = "rgba(244,251,244,0.35)";
const MID = "rgba(244,251,244,0.6)";

// ── the rule ─────────────────────────────────────────────────────────────────
// Spacing is strictly proportional to elapsed years: the point is that the
// amnesty landed only five years before the quake, and an evenly spaced
// timeline would hide exactly that.

const AXIS_Y = 78;
const LABEL_Y = AXIS_Y - 36;

/** "2023.02.06" → 2023. The date in `N` is the single source for the scale. */
const QUAKE_YEAR = Number(N.turkey.date.slice(0, 4));

const X_PREV = 62;
const X_QUAKE = 476;
const PER_YEAR = (X_QUAKE - X_PREV) / (QUAKE_YEAR - N.turkey.prevQuakeYear);
const atYear = (y: number) => X_PREV + (y - N.turkey.prevQuakeYear) * PER_YEAR;
const X_AMNESTY = atYear(N.turkey.amnestyYear);

const AXIS = `M 32 ${AXIS_Y} H 588`;
const tick = (x: number, reach: number) => `M ${x} ${AXIS_Y - reach} V ${AXIS_Y + reach}`;

/** The amnesty window, marked on the rule rather than beside it. */
const BAND_X = X_AMNESTY;
const BAND_W = X_QUAKE - X_AMNESTY;
const BAND_Y = AXIS_Y - 10;
const BAND_H = 20;

// ── the stock: 10 × 10 blocks standing in for seven million buildings ────────

const COLS = 10;
const ROWS = 10;
const PITCH_X = 23;
const PITCH_Y = 16;
const BLOCK_W = 15;
const BLOCK_H = 11;
const GRID_X = 352;
const GRID_Y = 152;
const GRID_W = (COLS - 1) * PITCH_X + BLOCK_W;
const GRID_H = (ROWS - 1) * PITCH_Y + BLOCK_H;

/** Jitter is baked once at module load, never re-rolled per frame. */
const BLOCKS = (() => {
  let s = (N.turkey.amnestyBuildings % 9_999_991) >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out: Array<{ x: number; y: number; w: number; h: number; i: number }> = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      out.push({
        x: Math.round((GRID_X + col * PITCH_X + (r() - 0.5) * 2) * 10) / 10,
        y: Math.round((GRID_Y + row * PITCH_Y + (r() - 0.5) * 1.6) * 10) / 10,
        w: Math.round((BLOCK_W + (r() - 0.5) * 2.4) * 10) / 10,
        h: Math.round((BLOCK_H + (r() - 0.5) * 2.2) * 10) / 10,
        // Column-major-ish index so the fill sweeps diagonally, not row by row.
        i: row + col,
      });
    }
  }
  return out;
})();

const STRIKE_A = `M ${GRID_X - 12} ${GRID_Y - 10} L ${GRID_X + GRID_W + 12} ${GRID_Y + GRID_H + 10}`;
const STRIKE_B = `M ${GRID_X + GRID_W + 12} ${GRID_Y - 10} L ${GRID_X - 12} ${GRID_Y + GRID_H + 10}`;

const DROP = `M ${BAND_X + BAND_W / 2} ${AXIS_Y + 14} V ${GRID_Y - 42}`;

// ── the corrosion beat ───────────────────────────────────────────────────────
// A rebar section in emerald; chlorides arriving from outside; a rust ring
// growing around the steel. Ember, because this is damage.

const REBAR = { cx: 92, cy: 268, r: 22 };

/** Chloride paths: eight short runs converging on the bar. Dense stagger 0.012. */
const CHLORIDES = (() => {
  const out: Array<{ d: string; i: number }> = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r0 = 76;
    const r1 = 40;
    out.push({
      d: `M ${Math.round(REBAR.cx + Math.cos(a) * r0)} ${Math.round(
        REBAR.cy + Math.sin(a) * r0,
      )} L ${Math.round(REBAR.cx + Math.cos(a) * r1)} ${Math.round(REBAR.cy + Math.sin(a) * r1)}`,
      i,
    });
  }
  return out;
})();

// ── kit ──────────────────────────────────────────────────────────────────────

function Draw({
  d,
  on,
  stroke,
  w = 3,
  delay = 0,
  dur = 0.6,
  opacity = 1,
  cap = "round",
}: {
  d: string;
  on: boolean;
  stroke: string;
  w?: number;
  delay?: number;
  dur?: number;
  opacity?: number;
  cap?: "round" | "butt";
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={w}
      strokeLinecap={cap}
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      initial={false}
      animate={{ strokeDashoffset: on ? 0 : 1, opacity: on ? opacity : 0 }}
      transition={{
        strokeDashoffset: { duration: dur, ease: EASE, delay: on ? delay : 0 },
        opacity: { duration: 0.2, delay: on ? delay : 0 },
      }}
    />
  );
}

/** rAF ticker; mounting already-on snaps, so reverse nav never replays. */
function useCount(to: number, on: boolean, duration: number, delay: number) {
  const [v, setV] = useState(() => (on ? to : 0));
  const was = useRef(on);
  const raf = useRef(0);
  useEffect(() => {
    if (on === was.current) return;
    was.current = on;
    cancelAnimationFrame(raf.current);
    // Nothing to reset: `v` is read through the `on` gate below, and the tick
    // recomputes it from `to × eased(p)` rather than accumulating.
    if (!on) return;
    const t0 = performance.now() + delay * 1000;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / (duration * 1000)));
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [on, to, duration, delay]);
  return on ? v : 0;
}

function YearTick({
  x,
  reach,
  label,
  on,
  color,
  size = 22,
  delay = 0,
  weight = 600,
}: {
  x: number;
  reach: number;
  label: string;
  on: boolean;
  color: string;
  size?: number;
  delay?: number;
  weight?: number;
}) {
  return (
    <g>
      <Draw d={tick(x, reach)} on={on} stroke={color} w={reach > 16 ? 4 : 3} delay={delay} dur={0.25} />
      <motion.g
        initial={false}
        animate={{ scale: on ? 1 : 1.25, opacity: on ? 1 : 0 }}
        transition={{ duration: 0.36, ease: EASE, delay: on ? delay + 0.08 : 0 }}
      >
        {/* One middle-anchored <text>: the default fill-box centre is already
            the glyph centre, and a px origin would only be re-based against
            that same bbox. */}
        <text
          x={x}
          y={LABEL_Y}
          fill={color}
          fontSize={size}
          textAnchor="middle"
          className="font-display tnum"
          style={{ fontWeight: weight }}
        >
          {label}
        </text>
      </motion.g>
    </g>
  );
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function TurkeyTimeline({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.turkey;

  const on = step >= AT_AMNESTY;
  const hit = step >= AT_QUAKE;

  const deaths = useCount(N.turkey.deaths, hit, 1.3, 0.55);

  const quakeChip = useMemo(() => `M${N.turkey.magnitude}`, []);

  return (
    <svg viewBox="0 0 620 340" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* ══ the rule ════════════════════════════════════════════════════════ */}
      <Draw d={AXIS} on={on} stroke={DIM} w={3} dur={0.85} />

      {/* the amnesty window, wiped along the rule */}
      <motion.rect
        x={BAND_X}
        y={BAND_Y}
        width={BAND_W}
        height={BAND_H}
        fill={V.gold}
        rx={4}
        initial={false}
        animate={{ scaleX: on ? 1 : 0, opacity: on ? 0.85 : 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: on ? 0.78 : 0 }}
        // Wipes open from the band's LEFT edge (the amnesty's start year), so
        // the origin has to be stated as a percentage: motion's
        // `transform-box: fill-box` re-bases px origins against this rect's
        // own box, where x=0 is already BAND_X.
        style={{ transformOrigin: "0% 50%" }}
      />

      <YearTick
        x={X_PREV}
        reach={14}
        label={String(N.turkey.prevQuakeYear)}
        on={on}
        color={MID}
        delay={0.34}
      />
      <YearTick
        x={X_AMNESTY}
        reach={14}
        label={String(N.turkey.amnestyYear)}
        on={on}
        color={V.gold}
        delay={0.58}
      />

      {/* the label rides on the band's own vertical, clear of the rule */}
      <motion.text
        x={BAND_X + BAND_W / 2}
        y={AXIS_Y + 38}
        fill={V.gold}
        fontSize={17}
        textAnchor="middle"
        className="font-mono"
        style={{ letterSpacing: "0.1em", fontWeight: 600 }}
        initial={false}
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : -8 }}
        transition={{ duration: 0.35, ease: EASE, delay: on ? 0.92 : 0 }}
      >
        {t(q.amnestyTick, lang)}
      </motion.text>

      {/* ══ what the amnesty legalised ══════════════════════════════════════ */}
      <Draw d={DROP} on={on} stroke={V.gold} w={2} opacity={0.6} delay={1.0} dur={0.3} />

      <motion.g
        initial={false}
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : 8 }}
        transition={{ duration: 0.4, ease: EASE, delay: on ? 1.05 : 0 }}
      >
        <text
          x={GRID_X + GRID_W / 2}
          y={GRID_Y - 24}
          fill={BASE}
          fontSize={34}
          textAnchor="middle"
          className="font-display tnum"
          style={{ fontWeight: 600 }}
        >
          {`${num(N.turkey.amnestyBuildings)}+`}
        </text>
        <text
          x={GRID_X + GRID_W / 2}
          y={GRID_Y - 6}
          fill={MID}
          fontSize={14}
          textAnchor="middle"
          className="font-mono"
          style={{ letterSpacing: "0.08em" }}
        >
          {t(q.gridUnit, lang)}
        </text>
      </motion.g>

      {/* The stock. 100 blocks on a 0.012 stagger — opacity only, so the sweep
          stays on the compositor even at a hundred elements. */}
      <motion.g
        initial={false}
        animate={{ opacity: hit ? 0.4 : 1 }}
        transition={{ duration: 0.4, ease: EASE, delay: hit ? 0.42 : 0 }}
      >
        {BLOCKS.map((b, k) => (
          <motion.rect
            key={k}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill="rgba(244,251,244,0.85)"
            initial={false}
            animate={{ opacity: on ? 1 : 0 }}
            transition={{ duration: 0.28, ease: EASE, delay: on ? 1.15 + b.i * 0.012 : 0 }}
          />
        ))}
      </motion.g>

      <Draw d={STRIKE_A} on={hit} stroke={V.ember} w={4.5} delay={0.42} dur={0.4} />
      <Draw d={STRIKE_B} on={hit} stroke={V.ember} w={4.5} delay={0.52} dur={0.4} />

      {/* ══ 2023 ════════════════════════════════════════════════════════════ */}
      <YearTick
        x={X_QUAKE}
        reach={18}
        label={String(QUAKE_YEAR)}
        on={hit}
        color={V.ember}
        size={26}
        delay={0.05}
        weight={700}
      />
      <motion.g
        initial={false}
        animate={{ scale: hit ? 1 : 1.25, opacity: hit ? 1 : 0, rotate: hit ? -3 : 2 }}
        transition={{ duration: 0.42, ease: EASE, delay: hit ? 0.2 : 0 }}
      >
        {/* The pill and its centred label share a centre, so the fill-box
            default is the pivot the stamp wants. */}
        <rect x={X_QUAKE + 12} y={AXIS_Y - 15} width={68} height={30} rx={15} fill={V.ember} />
        <text
          x={X_QUAKE + 46}
          y={AXIS_Y + 7}
          fill={V.night}
          fontSize={19}
          textAnchor="middle"
          className="font-mono tnum"
          style={{ fontWeight: 800, letterSpacing: "0.04em" }}
        >
          {quakeChip}
        </text>
      </motion.g>

      {/* ══ the toll ════════════════════════════════════════════════════════ */}
      <motion.g
        initial={false}
        animate={{ opacity: hit ? 1 : 0, y: hit ? 0 : 12 }}
        transition={{ duration: 0.45, ease: EASE, delay: hit ? 0.45 : 0 }}
      >
        <text
          x={24}
          y={172}
          fill={V.ember}
          fontSize={48}
          className="font-display tnum"
          style={{ fontWeight: 700 }}
        >
          {`~${num(deaths)}`}
        </text>
        <text
          x={24}
          y={196}
          fill={MID}
          fontSize={15}
          className="font-mono"
          style={{ letterSpacing: "0.08em" }}
        >
          {t(q.deathsLabel, lang)}
        </text>
      </motion.g>

      {/* ══ the lesson: sea sand → chlorides → rust ═════════════════════════ */}
      <g>
        {/* chlorides arriving from the sand, dense stagger */}
        {CHLORIDES.map((c) => (
          <Draw
            key={c.i}
            d={c.d}
            on={hit}
            stroke={V.gold}
            w={1.8}
            opacity={0.55}
            delay={0.8 + c.i * 0.012}
            dur={0.4}
          />
        ))}

        {/* The rust ring growing around the bar. All three circles below are
            concentric on REBAR, so each one's own fill-box centre — which is
            what motion's `transform-box: fill-box` makes a px origin relative
            to anyway — is already the pivot. */}
        <motion.circle
          cx={REBAR.cx}
          cy={REBAR.cy}
          r={REBAR.r + 13}
          fill="none"
          stroke={V.ember}
          strokeWidth={14}
          initial={false}
          animate={{ scale: hit ? 1 : 0.6, opacity: hit ? 0.45 : 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: hit ? 1.05 : 0 }}
        />
        <motion.circle
          cx={REBAR.cx}
          cy={REBAR.cy}
          r={REBAR.r + 6}
          fill="none"
          stroke={V.ember}
          strokeWidth={4}
          initial={false}
          animate={{ scale: hit ? 1 : 0.7, opacity: hit ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: hit ? 1.15 : 0 }}
        />

        {/* the bar itself: sound steel, being eaten from outside in */}
        <motion.circle
          cx={REBAR.cx}
          cy={REBAR.cy}
          r={REBAR.r}
          fill="rgba(0,168,104,0.35)"
          stroke={V.emerald}
          strokeWidth={4}
          initial={false}
          animate={{ scale: hit ? 1 : 1.25, opacity: hit ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: hit ? 0.7 : 0 }}
        />

        {/* Only the sea-sand caption. The bar in the ring is *their* steel, so
            no grade goes on it: A500S is ours, and ours is not the thing
            rusting. Colour code stays honest. */}
        <motion.text
          x={186}
          y={274}
          fill={V.gold}
          fontSize={19}
          className="font-sans"
          style={{ fontWeight: 700 }}
          initial={false}
          animate={{ opacity: hit ? 1 : 0, x: hit ? 0 : -10 }}
          transition={{ duration: 0.4, ease: EASE, delay: hit ? 1.3 : 0 }}
        >
          {t(q.seaSandTitle, lang)}
        </motion.text>
      </g>
    </svg>
  );
}

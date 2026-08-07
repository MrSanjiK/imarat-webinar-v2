"use client";

import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { num, t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  Annotation,
  C,
  SketchArrow,
  SketchPath,
  hatch,
  rng,
  wobbleLine,
  wobbleRect,
} from "@/ui/sketch";

/**
 * Turkey timeline — chapter 1 ("Zilzila"), dark theme, slot 620×340.
 *
 * The argument: 2023 was not only a magnitude. In 2018 an amnesty legalised
 * millions of buildings nobody had inspected, and five years later they came
 * down. So the diagram is a rule with three ticks, and the amnesty span is the
 * only part of it that carries weight — a gold hatch on the timeline itself,
 * with the whole stock of legalised buildings hanging off it as a grid.
 *
 * Step choreography — the slot sits inside `<Reveal at={3}>` in 01-quake.tsx,
 * so the diagram is at opacity 0 before step 3 and nothing may animate earlier:
 * a draw-on spent behind an invisible parent would simply be lost.
 *   0–2 — empty (the slide is still on the three text beats).
 *   3   — the rule draws left to right; 1999 lands as a tick, then 2018, then
 *         the gold amnesty span between 2018 and the quake, then the 10×10 grid
 *         fills row by row and the count is written beside it.
 *   4   — 2023 lands in ember and the grid is struck out.
 *
 * Pure function of `step`: every gate is `step >= n`, so 4 → 3 renders exactly
 * what 3 → 4 rendered. Only transform / opacity / strokeDashoffset animate.
 */

// ── Beats ────────────────────────────────────────────────────────────────────
// Named so that re-wiring the slot's <Reveal at={...}> is a one-line change.

const AT_AMNESTY = 3;
const AT_QUAKE = 4;

// ── Palette on dark ──────────────────────────────────────────────────────────

const PAPER = "rgba(244,241,234,0.86)";
const PAPER_DIM = "rgba(244,241,234,0.44)";

// ── The rule ─────────────────────────────────────────────────────────────────
// Spacing is strictly proportional to elapsed years: the point of the diagram is
// that the amnesty landed only five years before the quake, and an evenly spaced
// timeline would hide exactly that.

const AXIS_Y = 92;
/** Year captions ride above the rule; the amnesty tag sits between them. */
const LABEL_Y = AXIS_Y - 44;

/** "2023.02.06" → 2023. The date in `N` is the single source for the scale. */
const QUAKE_YEAR = Number(N.turkey.date.slice(0, 4));

const X_PREV = 68;
const X_QUAKE = 484;
const PER_YEAR = (X_QUAKE - X_PREV) / (QUAKE_YEAR - N.turkey.prevQuakeYear);
const atYear = (y: number) => X_PREV + (y - N.turkey.prevQuakeYear) * PER_YEAR;
const X_AMNESTY = atYear(N.turkey.amnestyYear);

const AXIS = wobbleLine(40, AXIS_Y, 584, AXIS_Y, 21, 1.5);

const tick = (x: number, reach: number, seed: number) =>
  wobbleLine(x, AXIS_Y - reach, x, AXIS_Y + reach, seed, 0.8);

const TICK_PREV = tick(X_PREV, 15, 31);
const TICK_AMNESTY = tick(X_AMNESTY, 15, 32);
const TICK_QUAKE = tick(X_QUAKE, 18, 33);

/** The amnesty window, marked on the rule rather than beside it. */
const BAND_X = X_AMNESTY;
const BAND_W = X_QUAKE - X_AMNESTY;
const BAND_Y = AXIS_Y - 9;
const BAND_H = 18;

// ── The stock: 10 × 10 blocks standing in for seven million buildings ────────

const COLS = 10;
const ROWS = 10;
const PITCH_X = 22;
const PITCH_Y = 17;
const BLOCK_W = 14;
const BLOCK_H = 12;
const GRID_X = 368;
const GRID_Y = 154;
const GRID_W = (COLS - 1) * PITCH_X + BLOCK_W;
const GRID_H = (ROWS - 1) * PITCH_Y + BLOCK_H;

/**
 * One compound path per row, so the row draws itself left to right as a single
 * stroke: ten separately animated blocks per row would be a hundred motion
 * elements for the same 0.5 s of movement.
 */
function buildGrid(): string[] {
  const r = rng(N.turkey.amnestyBuildings % 9_999_991);
  const out: string[] = [];
  for (let row = 0; row < ROWS; row++) {
    const parts: string[] = [];
    for (let col = 0; col < COLS; col++) {
      // Enough jitter that the grid reads as a stock of buildings rather than a
      // printed table, baked into `d` once.
      const x = GRID_X + col * PITCH_X + (r() - 0.5) * 2.2;
      const y = GRID_Y + row * PITCH_Y + (r() - 0.5) * 1.8;
      const w = BLOCK_W + (r() - 0.5) * 2.4;
      const h = BLOCK_H + (r() - 0.5) * 2.6;
      parts.push(wobbleRect(x, y, w, h, 700 + row * 13 + col, 0.7, 0.8));
    }
    out.push(parts.join(" "));
  }
  return out;
}

const STRIKE_A = wobbleLine(GRID_X - 10, GRID_Y - 8, GRID_X + GRID_W + 10, GRID_Y + GRID_H + 8, 77, 2.4);
const STRIKE_B = wobbleLine(GRID_X + GRID_W + 10, GRID_Y - 8, GRID_X - 10, GRID_Y + GRID_H + 8, 78, 2.4);

const DROP = wobbleLine(BAND_X + BAND_W / 2, AXIS_Y + 12, BAND_X + BAND_W / 2, GRID_Y - 8, 79, 0.9);

/**
 * 45° hatch revealed by sliding an oversized mask rect across the box.
 *
 * Not a `scaleX` wipe: motion writes SVG transforms as CSS with
 * `transform-box: fill-box` and falls back to a `50% 50%` origin, so a scaled
 * mask opens from the middle of the box instead of from its edge. A translate
 * is origin-independent and therefore safe.
 */
function HatchWipe({
  x,
  y,
  w,
  h,
  on,
  gap = 7,
  seed = 1,
  stroke,
  width = 1.2,
  opacity = 0.5,
  delay = 0,
  duration = 0.55,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on: boolean;
  gap?: number;
  seed?: number;
  stroke: string;
  width?: number;
  opacity?: number;
  delay?: number;
  duration?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const boxId = `tt-box-${uid}`;
  const wipeId = `tt-wipe-${uid}`;
  const d = useMemo(() => hatch(x, y, w, h, gap, 45, seed), [x, y, w, h, gap, seed]);

  return (
    <g>
      <defs>
        {/* `hatch` overruns its box by design; this clips it back. */}
        <clipPath id={boxId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <clipPath id={wipeId}>
          <motion.rect
            x={x - w - 4}
            y={y - 4}
            width={w + 8}
            height={h + 8}
            initial={false}
            animate={{ x: on ? w + 4 : 0 }}
            transition={{ duration, ease: EASE, delay }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${boxId})`}>
        <g clipPath={`url(#${wipeId})`}>
          <path d={d} fill="none" stroke={stroke} strokeWidth={width} opacity={opacity} />
        </g>
      </g>
    </g>
  );
}

export function TurkeyTimeline({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.turkey;

  const rows = useMemo(() => buildGrid(), []);

  const on = step >= AT_AMNESTY;
  const hit = step >= AT_QUAKE;

  return (
    <svg viewBox="0 0 620 340" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* ── The rule ── */}
      <SketchPath d={AXIS} on={on} stroke={PAPER_DIM} width={1.8} duration={0.85} />

      <HatchWipe
        x={BAND_X}
        y={BAND_Y}
        w={BAND_W}
        h={BAND_H}
        on={on}
        seed={12}
        stroke={C.gold}
        opacity={0.7}
        delay={0.78}
        duration={0.5}
      />

      <SketchPath d={TICK_PREV} on={on} stroke={C.ash} width={1.8} delay={0.34} duration={0.25} />
      <SketchPath d={TICK_AMNESTY} on={on} stroke={C.gold} width={2.2} delay={0.58} duration={0.25} />

      <Annotation
        x={X_PREV}
        y={LABEL_Y}
        anchor="middle"
        text={String(N.turkey.prevQuakeYear)}
        on={on}
        delay={0.42}
        size={22}
        color={C.ash}
      />
      <Annotation
        x={X_AMNESTY}
        y={LABEL_Y}
        anchor="middle"
        text={String(N.turkey.amnestyYear)}
        on={on}
        delay={0.66}
        size={22}
        color={PAPER}
      />
      {/* Centred on the band, not on the tick: the label, the gold window and
          the drop line down to the stock all share one vertical. It sits in the
          gap the year captions opened up, between the two ticks and clear of
          the rule — the old placement had the rule running through the word. */}
      <Annotation
        x={BAND_X + BAND_W / 2}
        y={AXIS_Y - 20}
        anchor="middle"
        text={t(q.amnestyTick, lang)}
        on={on}
        delay={0.92}
        size={16}
        color={C.gold}
      />

      {/* ── What the amnesty legalised ── */}
      <SketchPath d={DROP} on={on} stroke={C.gold} width={1.4} opacity={0.6} delay={1} duration={0.3} />

      <motion.g
        initial={false}
        animate={{ opacity: hit ? 0.42 : 1 }}
        transition={{ duration: 0.4, ease: EASE, delay: hit ? 0.42 : 0 }}
      >
        {rows.map((d, i) => (
          <SketchPath
            key={i}
            d={d}
            on={on}
            stroke={PAPER}
            width={1.1}
            opacity={0.9}
            delay={1.1 + i * 0.05}
            duration={0.5}
            cap="butt"
          />
        ))}
      </motion.g>

      <SketchPath d={STRIKE_A} on={hit} stroke={C.ember} width={3} delay={0.42} duration={0.4} />
      <SketchPath d={STRIKE_B} on={hit} stroke={C.ember} width={3} delay={0.52} duration={0.4} />

      {/* The count reads against the middle of the stock, not the top of it:
          the caption block and the grid share a centre line at y ≈ 235. */}
      <Annotation
        x={196}
        y={230}
        anchor="middle"
        text={`${num(N.turkey.amnestyBuildings)}+`}
        on={on}
        delay={1.2}
        size={40}
        color={PAPER}
      />
      <Annotation
        x={196}
        y={260}
        anchor="middle"
        text={t(q.gridUnit, lang)}
        on={on}
        delay={1.3}
        size={16}
        color={C.ash}
      />
      <SketchArrow
        x1={300}
        y1={228}
        x2={356}
        y2={228}
        on={on}
        stroke={PAPER_DIM}
        width={1.4}
        head={8}
        seed={44}
        delay={1.34}
        duration={0.3}
      />

      {/* ── 2023 ── */}
      <SketchPath d={TICK_QUAKE} on={hit} stroke={C.ember} width={2.6} delay={0.05} duration={0.3} />
      <Annotation
        x={X_QUAKE}
        y={LABEL_Y}
        anchor="middle"
        text={String(QUAKE_YEAR)}
        on={hit}
        delay={0.14}
        size={24}
        color={C.ember}
      />
      {/*
        No caption on the ember terminus. The slide's own copy already carries
        "M7.8" in a bullet and names Antakya in the body; a third place name
        here (the epicentre in `N` is Kahramanmaraş) would read as a
        contradiction from the back of the room. The tick, the year and the
        strike-through say everything the diagram is for.
      */}
    </svg>
  );
}

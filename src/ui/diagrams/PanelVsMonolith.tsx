"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  Annotation,
  C,
  Hatch,
  SketchEllipse,
  SketchPath,
  rng,
  wobbleLine,
  wobbleRect,
} from "@/ui/sketch";

/**
 * Panel vs monolith — chapter 1 ("Zilzila"), dark theme, slot 1600×370.
 *
 * Step choreography
 *   0 — empty page.
 *   1 — ground line draws, then both bodies. Left: twelve separate prefab slabs,
 *       their touching edges reading as bolted joints. Right: one continuous
 *       outline with an unbroken column/beam frame, hatched as a single body.
 *       Each is labelled with its concrete grade.
 *   2 — the shake. Both buildings translate at 12 Hz (N.testing.vibroFrequencyHz)
 *       for ~1.67 s. The panel swings almost twice as far as the monolith.
 *       Vibration trace lines appear either side of each body.
 *   3 — the outcome. The shake decays to plumb. The panel's joints let go: every
 *       slab offsets, rotates a few degrees and is over-drawn in ember, joint
 *       nodes light up ember. The monolith is over-drawn in leaf, intact.
 *
 * Pure function of `step`; every group is gated on a `step >= n` boolean, so
 * 3 → 1 renders exactly what 1 → 3 rendered.
 */

// ── Geometry, baked once at module load ──────────────────────────────────────

const GROUND_Y = 292;
const BW = 300;
const BH = 236;
const TOP = GROUND_Y - BH;
const PANEL_X = 250;
const MONO_X = 1050;
const COLS = 3;
const ROWS = 4;
const CW = BW / COLS;
const RH = BH / ROWS;

const HZ = N.testing.vibroFrequencyHz;

type Slab = { d: string; ox: number; oy: number; dx: number; dy: number; rot: number };

/** Twelve prefab panels. Offsets grow toward the top, where the drift is worst. */
const SLABS: Slab[] = (() => {
  const r = rng(7717);
  const out: Slab[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = PANEL_X + col * CW;
      const y = TOP + row * RH;
      const f = (ROWS - 1 - row) / (ROWS - 1); // 1 at the top course, 0 at grade
      out.push({
        d: wobbleRect(x, y, CW, RH, 101 + row * 7 + col * 3, 1.2, 1.6),
        ox: x + CW / 2,
        oy: y + RH / 2,
        dx: (r() * 2 - 1) * (7 + 20 * f),
        dy: (r() * 2 - 1) * 4 + 5 * f,
        rot: (r() * 2 - 1) * (1.6 + 4 * f),
      });
    }
  }
  return out;
})();

/** The six interior joint crossings — the failure points. */
const JOINTS: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let row = 1; row < ROWS; row++)
    for (let col = 1; col < COLS; col++) out.push([PANEL_X + col * CW, TOP + row * RH]);
  return out;
})();

const MONO_OUTLINE = wobbleRect(MONO_X, TOP, BW, BH, 331, 1.3, 3);

/** Columns and beams run the full width/height uninterrupted: one poured body. */
const MONO_FRAME = [
  wobbleLine(MONO_X + CW, TOP, MONO_X + CW, GROUND_Y, 401, 1.1),
  wobbleLine(MONO_X + 2 * CW, TOP, MONO_X + 2 * CW, GROUND_Y, 402, 1.1),
  wobbleLine(MONO_X, TOP + RH, MONO_X + BW, TOP + RH, 403, 1.1),
  wobbleLine(MONO_X, TOP + 2 * RH, MONO_X + BW, TOP + 2 * RH, 404, 1.1),
  wobbleLine(MONO_X, TOP + 3 * RH, MONO_X + BW, TOP + 3 * RH, 405, 1.1),
].join(" ");

const GROUND = wobbleLine(180, GROUND_Y, 1420, GROUND_Y, 55, 1.6);

const EARTH = (() => {
  const parts: string[] = [];
  for (let x = 196; x <= 1412; x += 38) parts.push(wobbleLine(x, GROUND_Y, x - 11, GROUND_Y + 12, x, 0.7));
  return parts.join(" ");
})();

/** Vibration trace: short marks flanking a body, outside the shaking group. */
const traces = (x0: number, seed: number) =>
  [96, 152, 208]
    .flatMap((y, i) => [
      wobbleLine(x0 - 54, y, x0 - 20, y, seed + i, 0.9),
      wobbleLine(x0 + BW + 20, y, x0 + BW + 54, y, seed + 10 + i, 0.9),
    ])
    .join(" ");

const TRACE_P = traces(PANEL_X, 611);
const TRACE_M = traces(MONO_X, 733);

// ── Shake ────────────────────────────────────────────────────────────────────
// One transform keyframe list per building, on one <g> each. Frozen arrays so a
// re-render at the same step cannot restart the cycle.

const AMP_P = 7.5;
const AMP_M = 4;

const SHAKE_P = [0, -AMP_P, 0, AMP_P, 0];
const SHAKE_M = [0, -AMP_M, 0, AMP_M, 0];
const SHAKE_T = { duration: 1 / HZ, repeat: Math.round(1.6 * HZ) - 1, ease: "linear" as const };

/** Step 3 tail: the same oscillation, decaying to plumb over half a second. */
const SETTLE_P = [-AMP_P * 0.5, AMP_P * 0.3, -AMP_P * 0.12, 0];
const SETTLE_M = [-AMP_M * 0.5, AMP_M * 0.26, 0];
const SETTLE_T = { duration: 0.5, ease: EASE };

const REST_T = { duration: 0.25, ease: EASE };

const PAPER = "rgba(244,241,234,0.82)";
const PAPER_DIM = "rgba(244,241,234,0.42)";

export function PanelVsMonolith({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.panelVsMonolith;

  const drawn = step >= 1;
  const quaking = step === 2;
  const broken = step >= 3;

  const shakeX = (k: number[], settle: number[]) =>
    quaking ? k : broken ? settle : 0;
  const shakeT = quaking ? SHAKE_T : broken ? SETTLE_T : REST_T;

  return (
    <svg viewBox="0 0 1600 370" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* Grade line and earth hatching — the reference the buildings move against. */}
      <SketchPath d={GROUND} on={drawn} stroke={C.ash} width={2} duration={0.9} />
      <SketchPath d={EARTH} on={drawn} stroke={C.ash} width={1.5} opacity={0.5} delay={0.5} duration={0.6} />

      {/* Vibration traces sit outside the shaking groups, so they read as a trace. */}
      <SketchPath d={TRACE_P} on={quaking} stroke={PAPER_DIM} width={1.5} duration={0.3} />
      <SketchPath d={TRACE_M} on={quaking} stroke={PAPER_DIM} width={1.5} duration={0.3} />

      {/* ── Panel building ── */}
      <motion.g
        initial={false}
        animate={{ x: shakeX(SHAKE_P, SETTLE_P) }}
        transition={{ x: shakeT }}
      >
        {SLABS.map((s, i) => (
          <motion.g
            key={i}
            initial={false}
            animate={{ x: broken ? s.dx : 0, y: broken ? s.dy : 0, rotate: broken ? s.rot : 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: broken ? i * 0.02 : 0 }}
            style={{ transformOrigin: `${s.ox}px ${s.oy}px` }}
          >
            <SketchPath d={s.d} on={drawn} stroke={PAPER} width={1.7} delay={i * 0.05} duration={0.45} />
            {/* Ember over-draw: the crack lighting up, rather than a stroke swap. */}
            <SketchPath
              d={s.d}
              on={broken}
              stroke={C.ember}
              width={2.2}
              delay={i * 0.02}
              duration={0.5}
            />
          </motion.g>
        ))}

        {JOINTS.map(([jx, jy], i) => (
          <SketchEllipse
            key={i}
            cx={jx}
            cy={jy}
            rx={5}
            seed={51 + i}
            on={drawn}
            stroke={broken ? C.ember : PAPER_DIM}
            width={broken ? 2.4 : 1.5}
            delay={0.6 + i * 0.04}
            duration={0.3}
          />
        ))}
      </motion.g>

      {/* ── Monolithic frame ── */}
      <motion.g
        initial={false}
        animate={{ x: shakeX(SHAKE_M, SETTLE_M) }}
        transition={{ x: shakeT }}
      >
        {/* Hatch reveal finishes inside step 1; nothing here animates once the
            group starts shaking at step 2. */}
        <Hatch
          x={MONO_X}
          y={TOP}
          w={BW}
          h={BH}
          on={drawn}
          gap={15}
          seed={17}
          stroke={C.paper}
          width={1.5}
          opacity={0.16}
          delay={0.6}
          duration={0.7}
        />
        <SketchPath d={MONO_FRAME} on={drawn} stroke={PAPER_DIM} width={1.5} delay={0.35} duration={0.7} />
        <SketchPath d={MONO_OUTLINE} on={drawn} stroke={PAPER} width={2.6} delay={0.15} duration={0.7} />

        {/* Leaf over-draw: intact, back to plumb. */}
        <SketchPath d={MONO_OUTLINE} on={broken} stroke={C.leaf} width={2.6} delay={0.18} duration={0.6} />
        <SketchPath d={MONO_FRAME} on={broken} stroke={C.leaf} width={1.5} opacity={0.55} delay={0.3} duration={0.6} />
      </motion.g>

      {/* ── Labels ── */}
      <Annotation
        x={PANEL_X + BW / 2}
        y={330}
        anchor="middle"
        text={t(q.leftLabel, lang)}
        on={drawn}
        delay={0.7}
        size={24}
        color={broken ? C.ember : PAPER}
      />
      <Annotation
        x={PANEL_X + BW / 2}
        y={356}
        anchor="middle"
        text={N.materials.sovietConcrete}
        on={drawn}
        delay={0.8}
        size={18}
        color={C.ash}
      />

      <Annotation
        x={MONO_X + BW / 2}
        y={330}
        anchor="middle"
        text={t(q.rightLabel, lang)}
        on={drawn}
        delay={0.7}
        size={24}
        color={broken ? C.leaf : PAPER}
      />
      <Annotation
        x={MONO_X + BW / 2}
        y={356}
        anchor="middle"
        text={N.materials.modernConcrete}
        on={drawn}
        delay={0.8}
        size={18}
        color={C.ash}
      />
    </svg>
  );
}

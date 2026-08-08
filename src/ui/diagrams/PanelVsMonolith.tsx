"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * PanelVsMonolith — chapter 1 (dark), slide 04. Slot 1600 × 370.
 *
 * v2 "IMARAT Vivid": flat vector, saturated fills wiped in under a clip rect,
 * outlines drawn with pathLength + strokeDashoffset. No pencil, no filters.
 *
 * Step map (slide q-panel-monolith has 4 steps, 0…3)
 *   0 — empty.
 *   1 — grade line draws, then both bodies. Left: twelve separate prefab slabs
 *       with visible joints. Right: one continuous monolith outline with an
 *       unbroken column/beam frame and an emerald body fill. A name pill lands
 *       under each; the concrete grade is the spec card's job, not the pill's.
 *   2 — THE SHAKE. Both bodies translate at 12 Hz (N.testing.vibroFrequencyHz)
 *       for ~1.6 s; the panel swings almost twice as far. Vibration ticks
 *       flank each body. This is the only step that oscillates.
 *   3 — SETTLED END STATE — no replay. The panel's seams split: every slab
 *       offsets, rotates and gains an ember seam; joint nodes go ember. The
 *       monolith returns to plumb, whole, over-drawn emerald. Verdict chips
 *       land under each with a scale pop.
 *
 * Pure function of `step`: step 2 is `step === 2`, so arriving at 3 from either
 * direction shows the settled frame and never restarts the oscillation.
 */

// ── geometry, baked once at module load ──────────────────────────────────────

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

const BASE = "rgba(244,251,244,0.9)";
const DIM = "rgba(244,251,244,0.35)";

/** Deterministic offsets — evaluated once, frozen into the module. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

type Slab = { x: number; y: number; cx: number; cy: number; dx: number; dy: number; rot: number };

/** Twelve prefab panels. Drift grows toward the top, where it is worst. */
const SLABS: Slab[] = (() => {
  const r = lcg(7717);
  const out: Slab[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const f = (ROWS - 1 - row) / (ROWS - 1);
      const x = PANEL_X + col * CW;
      const y = TOP + row * RH;
      out.push({
        x,
        y,
        cx: x + CW / 2,
        cy: y + RH / 2,
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

const rectD = (x: number, y: number, w: number, h: number) =>
  `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;

const MONO_OUTLINE = rectD(MONO_X, TOP, BW, BH);

/** Columns and beams run uninterrupted the full width/height: one poured body. */
const MONO_FRAME = [
  `M ${MONO_X + CW} ${TOP} V ${GROUND_Y}`,
  `M ${MONO_X + 2 * CW} ${TOP} V ${GROUND_Y}`,
  `M ${MONO_X} ${TOP + RH} H ${MONO_X + BW}`,
  `M ${MONO_X} ${TOP + 2 * RH} H ${MONO_X + BW}`,
  `M ${MONO_X} ${TOP + 3 * RH} H ${MONO_X + BW}`,
].join(" ");

const GROUND = `M 180 ${GROUND_Y} H 1420`;

const EARTH = (() => {
  const parts: string[] = [];
  for (let x = 196; x <= 1412; x += 38) parts.push(`M ${x} ${GROUND_Y} L ${x - 12} ${GROUND_Y + 13}`);
  return parts.join(" ");
})();

/** Vibration ticks flanking a body — outside the shaking group, so they read. */
const ticks = (x0: number) =>
  [96, 152, 208]
    .flatMap((y) => [`M ${x0 - 58} ${y} H ${x0 - 22}`, `M ${x0 + BW + 22} ${y} H ${x0 + BW + 58}`])
    .join(" ");

const TICK_P = ticks(PANEL_X);
const TICK_M = ticks(MONO_X);

// ── shake ────────────────────────────────────────────────────────────────────
// One frozen keyframe list per building, on one <g> each, so a re-render at the
// same step cannot restart the cycle.

const AMP_P = 9;
const AMP_M = 4.5;

const SHAKE_P = [0, -AMP_P, 0, AMP_P, 0];
const SHAKE_M = [0, -AMP_M, 0, AMP_M, 0];
const SHAKE_T = { duration: 1 / HZ, repeat: Math.round(1.6 * HZ) - 1, ease: "linear" as const };
const REST_T = { duration: 0.45, ease: EASE };

// ── kit ──────────────────────────────────────────────────────────────────────

function Draw({
  d,
  on,
  stroke,
  w = 4,
  delay = 0,
  dur = 0.7,
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

/** Saturated fill arriving by clip-rect wipe. Never a fill-opacity ramp. */
function FillWipe({
  on,
  x,
  y,
  w,
  h,
  fill,
  delay = 0,
  dur = 0.75,
  from = "up",
}: {
  on: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  delay?: number;
  dur?: number;
  from?: "up" | "left";
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <clipPath id={`pm-${uid}`}>
          <motion.rect
            x={x - 1}
            y={y - 1}
            width={w + 2}
            height={h + 2}
            initial={false}
            animate={from === "up" ? { y: on ? 0 : h + 2 } : { x: on ? 0 : -w - 2 }}
            transition={{ duration: dur, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={fill} clipPath={`url(#pm-${uid})`} />
    </g>
  );
}

/** A verdict chip: lands with scale 1.25 → 1 and a small rotation. */
/** Names the body under it — nothing else. The concrete grade belongs to the
 *  spec card, which gives it a noun ("Beton M200–M300"); printing it here too
 *  put the same figure on the stage twice. */
function Verdict({
  cx,
  y,
  label,
  on,
  color,
  delay = 0,
}: {
  cx: number;
  y: number;
  label: string;
  on: boolean;
  color: string;
  delay?: number;
}) {
  const w = label.length * 13.5 + 52;
  return (
    <g transform={`translate(${cx} ${y})`}>
      <motion.g
        initial={false}
        animate={{ scale: on ? 1 : 1.25, opacity: on ? 1 : 0, rotate: on ? -1.5 : 2 }}
        transition={{ duration: 0.42, ease: EASE, delay: on ? delay : 0 }}
      >
        <rect x={-w / 2} y={0} width={w} height={38} rx={19} fill={color} />
        <text
          x={0}
          y={26}
          fill={V.night}
          fontSize={22}
          textAnchor="middle"
          className="font-sans"
          style={{ fontWeight: 800, letterSpacing: "0.02em" }}
        >
          {label}
        </text>
      </motion.g>
    </g>
  );
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function PanelVsMonolith({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.panelVsMonolith;

  const drawn = step >= 1;
  const quaking = step === 2;
  const broken = step >= 3;

  return (
    <svg viewBox="0 0 1600 370" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* grade */}
      <Draw d={GROUND} on={drawn} stroke={DIM} w={3} dur={0.9} />
      <Draw d={EARTH} on={drawn} stroke={DIM} w={2} opacity={0.6} delay={0.45} dur={0.6} />

      {/* vibration ticks — outside the shaking groups */}
      <Draw d={TICK_P} on={quaking} stroke={V.ember} w={3} dur={0.3} opacity={0.8} />
      <Draw d={TICK_M} on={quaking} stroke={V.leaf} w={3} dur={0.3} opacity={0.8} />

      {/* ══ panel building ══════════════════════════════════════════════════ */}
      <motion.g
        initial={false}
        animate={{ x: quaking ? SHAKE_P : 0 }}
        transition={{ x: quaking ? SHAKE_T : REST_T }}
      >
        {SLABS.map((s, i) => (
          <motion.g
            key={i}
            initial={false}
            animate={{ x: broken ? s.dx : 0, y: broken ? s.dy : 0, rotate: broken ? s.rot : 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: broken ? i * 0.03 : 0 }}
          >
            {/* No pixel transform-origin anywhere in this file: motion sets
                `transform-box: fill-box` on animated SVG, which re-bases a px
                origin against the element's own bounding box. The default
                50% 50% is already the slab's centre, which is the pivot we
                want, so it is left alone. */}
            <FillWipe
              on={drawn}
              x={s.x}
              y={s.y}
              w={CW}
              h={RH}
              fill="rgba(244,251,244,0.09)"
              delay={0.3 + i * 0.03}
              dur={0.5}
            />
            <Draw
              d={rectD(s.x, s.y, CW, RH)}
              on={drawn}
              stroke={BASE}
              w={3}
              delay={i * 0.06}
              dur={0.45}
            />
            {/* the seam splitting — an ember over-draw, not a stroke swap */}
            <Draw
              d={rectD(s.x, s.y, CW, RH)}
              on={broken}
              stroke={V.ember}
              w={4}
              delay={i * 0.03}
              dur={0.5}
            />
          </motion.g>
        ))}

        {JOINTS.map(([jx, jy], i) => (
          <motion.g
            key={i}
            initial={false}
            animate={{ scale: drawn ? 1 : 1.25, opacity: drawn ? 1 : 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: drawn ? 0.55 + i * 0.06 : 0 }}
          >
            {/* Both discs are concentric on (jx, jy), so the fill-box centre
                motion uses by default is already the joint centre. A px
                transform-origin would be re-based against the element's own
                bbox and land off-target. */}
            <circle cx={jx} cy={jy} r={7} fill={broken ? V.ember : DIM} />
            <motion.circle
              cx={jx}
              cy={jy}
              r={13}
              fill="none"
              stroke={V.ember}
              strokeWidth={3}
              initial={false}
              animate={{ opacity: broken ? 1 : 0, scale: broken ? 1 : 0.5 }}
              transition={{ duration: 0.4, ease: EASE, delay: broken ? 0.3 + i * 0.04 : 0 }}
            />
          </motion.g>
        ))}
      </motion.g>

      {/* ══ monolithic frame ════════════════════════════════════════════════ */}
      <motion.g
        initial={false}
        animate={{ x: quaking ? SHAKE_M : 0 }}
        transition={{ x: quaking ? SHAKE_T : REST_T }}
      >
        <FillWipe
          on={drawn}
          x={MONO_X}
          y={TOP}
          w={BW}
          h={BH}
          fill="rgba(0,168,104,0.22)"
          delay={0.35}
          dur={0.85}
        />
        <Draw d={MONO_FRAME} on={drawn} stroke={DIM} w={2.5} delay={0.4} dur={0.7} />
        <Draw d={MONO_OUTLINE} on={drawn} stroke={BASE} w={5} delay={0.12} dur={0.8} />

        {/* intact, back to plumb */}
        <Draw d={MONO_OUTLINE} on={broken} stroke={V.leaf} w={5} delay={0.2} dur={0.6} />
        <Draw d={MONO_FRAME} on={broken} stroke={V.emerald} w={2.5} opacity={0.8} delay={0.32} dur={0.6} />
      </motion.g>

      {/* ══ verdicts ════════════════════════════════════════════════════════ */}
      <Verdict
        cx={PANEL_X + BW / 2}
        y={304}
        label={t(q.leftLabel, lang)}
        on={drawn}
        color={broken ? V.ember : "rgba(244,251,244,0.9)"}
        delay={0.6}
      />
      <Verdict
        cx={MONO_X + BW / 2}
        y={304}
        label={t(q.rightLabel, lang)}
        on={drawn}
        color={broken ? V.leaf : "rgba(244,251,244,0.9)"}
        delay={0.68}
      />
    </svg>
  );
}

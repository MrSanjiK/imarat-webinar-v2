"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { num, t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * MassPhysics — chapter 1 (dark), slide 05 "Ortiqcha vazn". Slot 880 × 600.
 *
 * The frame is split into two bands that never share vertical space: mass on
 * top (columns, readings, the F/m/a legend in the empty right half) and force
 * below (two arrows off one origin, measured against each other). Every label
 * owns a horizontal strip of its own, so no reading can land on top of another.
 *
 * Step map (slide q-mass has 3 steps, 0…2)
 *   0 — the two density columns fill from the ground up: brick to 1875 kg/m³ in
 *       ember, aerated block to 550 kg/m³ in emerald. Counters tick on a .tnum
 *       face above each column; the material name sits under the ground line.
 *   1 — the mass band dims and the F/m/a legend fades into the right half. The
 *       slide sets "F = m · a" at 84 px in its left column; this is the key to
 *       that line, not a second copy of it.
 *   2 — two force arrows extend from a shared origin. The brick one is ~3.4×
 *       the aerated one — the ratio is computed from the figures and clamped
 *       into the claimed 2–4× band, then measured and called out.
 *
 * Pure function of `step`: every animation is a two-state on/off transition, so
 * stepping backward renders exactly what stepping forward rendered.
 */

// ── numbers, all derived from figures.ts, never retyped ──────────────────────

const mid = (r: readonly [number, number]) => (r[0] + r[1]) / 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 1875 kg/m³ — midpoint of the brick-wall band. */
const BRICK = mid(N.materials.brickWallDensity);
/** 550 kg/m³ — midpoint of the aerated-block band. */
const AERATED = mid(N.materials.aeratedDensity);
/** ≈3.4, held inside the claimed 2–4× band so the drawing cannot outrun the copy. */
const RATIO = clamp(BRICK / AERATED, N.materials.lighterFactor[0], N.materials.lighterFactor[1]);

// ── layout (viewBox 880 × 600) ───────────────────────────────────────────────

/** Band A — mass. Ground line, columns above it, material names below. */
const BASE_Y = 320;
const COL_W = 122;
const BRICK_H = 200;
const AER_H = (AERATED / BRICK) * BRICK_H;
const BRICK_CX = 139;
/** Spaced for the *labels*, not the columns: "Gʻisht terimi" is wider than 122. */
const AER_CX = 340;
const NAME_Y = BASE_Y + 34;

/** The right half of band A is empty once the columns are placed. */
const LEG_X = 524;
const LEG_Y = 168;
const LEG_STEP = 52;

/** Band B — force. One origin, two arrows, a measure strung between the tips. */
const ARROW_X0 = 150;
const ARROW_LEN = 660;
const BRICK_ARROW_Y = 425;
const AER_ARROW_Y = 560;
const MEASURE_Y = 500;
const AER_LEN = ARROW_LEN / RATIO;

const BRICK_C = V.ember;
const DIM = "rgba(244,251,244,0.35)";
const MID = "rgba(244,251,244,0.62)";
const BASE = "rgba(244,251,244,0.92)";

// ── kit ──────────────────────────────────────────────────────────────────────

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
        opacity: { duration: 0.2, delay: on ? delay : 0 },
      }}
    />
  );
}

/** rAF ticker; mounting already-on snaps, so reverse nav never replays a build. */
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

/**
 * A density column. The body fill is revealed by translating a clip rect down
 * off the ground line; the outline draws over it. Nothing scales geometry.
 */
function Column({
  cx,
  h,
  on,
  fill,
  stroke,
  bands,
  delay = 0,
}: {
  cx: number;
  h: number;
  on: boolean;
  fill: string;
  stroke: string;
  /** Horizontal courses — dense reads heavy, sparse reads light. */
  bands: number;
  delay?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const x = cx - COL_W / 2;
  const y = BASE_Y - h;
  const courses = useMemo(() => {
    const parts: string[] = [];
    for (let i = 1; i < bands; i++) {
      const yy = Math.round(y + (h * i) / bands);
      parts.push(`M ${x} ${yy} H ${x + COL_W}`);
    }
    return parts.join(" ");
  }, [x, y, h, bands]);

  return (
    <g>
      <defs>
        <clipPath id={`mp-c-${uid}`}>
          <motion.rect
            x={x - 2}
            y={y - 2}
            width={COL_W + 4}
            height={h + 4}
            initial={false}
            animate={{ y: on ? 0 : h + 4 }}
            transition={{ duration: 0.85, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#mp-c-${uid})`}>
        <rect x={x} y={y} width={COL_W} height={h} fill={fill} />
        <path d={courses} fill="none" stroke={stroke} strokeWidth={2} opacity={0.4} />
      </g>
      <Draw
        d={`M ${x} ${BASE_Y} V ${y} H ${x + COL_W} V ${BASE_Y}`}
        on={on}
        stroke={stroke}
        w={4}
        delay={delay + 0.1}
        dur={0.7}
      />
    </g>
  );
}

/**
 * A force arrow that extends along its own axis. The shaft is a plain rect and
 * the head a triangle, both inside a group revealed by a sliding clip rect —
 * no geometry attribute animates.
 */
function ForceArrow({
  y,
  len,
  on,
  color,
  delay = 0,
  thick = 16,
}: {
  y: number;
  len: number;
  on: boolean;
  color: string;
  delay?: number;
  thick?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const head = 34;
  return (
    <g transform={`translate(${ARROW_X0} ${y})`}>
      <defs>
        <clipPath id={`mp-a-${uid}`}>
          <motion.rect
            x={-2}
            y={-40}
            width={len + 6}
            height={80}
            initial={false}
            animate={{ x: on ? 0 : -len - 8 }}
            transition={{ duration: 0.85, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#mp-a-${uid})`}>
        <rect x={0} y={-thick / 2} width={Math.max(0, len - head)} height={thick} fill={color} />
        <path
          d={`M ${len - head} ${-thick / 2 - 9} L ${len} 0 L ${len - head} ${thick / 2 + 9} Z`}
          fill={color}
        />
      </g>
    </g>
  );
}

/** One column's reading: value, unit — stacked above the column, never on it. */
function Reading({
  cx,
  top,
  value,
  unit,
  color,
  on,
  delay,
}: {
  cx: number;
  top: number;
  value: number;
  unit: string;
  color: string;
  on: boolean;
  delay: number;
}) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 12 }}
      transition={{ duration: 0.4, ease: EASE, delay: on ? delay : 0 }}
    >
      <text
        x={cx}
        y={top - 56}
        fill={color}
        fontSize={60}
        textAnchor="middle"
        className="font-display tnum"
        style={{ fontWeight: 700 }}
      >
        {value}
      </text>
      <text
        x={cx}
        y={top - 26}
        fill={MID}
        fontSize={19}
        textAnchor="middle"
        className="font-mono"
        style={{ letterSpacing: "0.08em" }}
      >
        {unit}
      </text>
    </motion.g>
  );
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function MassPhysics({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.mass;

  const formula = step >= 1;
  const force = step >= 2;

  const brickV = useCount(BRICK, true, 1.1, 0.35);
  const aerV = useCount(AERATED, true, 1.1, 0.5);

  /** The leading glyph of "F = m · a" — it labels both arrows and is never
   *  retyped here. The legend below spells the same three letters out. */
  const glyphs = useMemo(() => q.formula.split(/\s+/).filter(Boolean), [q.formula]);
  const F = glyphs[0] ?? "F";

  const legend: Array<[string, string, string]> = [
    [F, t("Kuch", lang), "(N)"],
    ["m", t("Massa", lang), "(kg)"],
    ["a", t("Tezlanish", lang), "(m/s²)"],
  ];

  return (
    <svg viewBox="0 0 880 600" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* ══ band A · mass ═══════════════════════════════════════════════════ */}

      {/* The mass band steps back once the formula lands on the slide. Group
          opacity multiplies with each child's own gate, so the entrance
          animations are untouched — this only sets the ceiling. */}
      <motion.g
        initial={false}
        animate={{ opacity: formula ? 0.45 : 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: formula ? 0.15 : 0 }}
      >
        <Draw
          d={`M 52 ${BASE_Y} H ${AER_CX + COL_W / 2 + 26}`}
          on
          stroke={DIM}
          w={3}
          dur={0.7}
        />

        <Column
          cx={BRICK_CX}
          h={BRICK_H}
          on
          fill="rgba(255,90,60,0.22)"
          stroke={BRICK_C}
          bands={11}
          delay={0.05}
        />
        <Column
          cx={AER_CX}
          h={AER_H}
          on
          fill="rgba(0,168,104,0.3)"
          stroke={V.leaf}
          bands={3}
          delay={0.22}
        />

        <Reading
          cx={BRICK_CX}
          top={BASE_Y - BRICK_H}
          value={brickV}
          unit={q.unit}
          color={BRICK_C}
          on
          delay={0.3}
        />
        <Reading
          cx={AER_CX}
          top={BASE_Y - AER_H}
          value={aerV}
          unit={q.unit}
          color={V.leaf}
          on
          delay={0.46}
        />

        <motion.text
          x={BRICK_CX}
          y={NAME_Y}
          fill={BRICK_C}
          fontSize={21}
          textAnchor="middle"
          className="font-mono"
          style={{ letterSpacing: "0.06em" }}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE, delay: 0.45 }}
        >
          {t(q.brickLabel, lang)}
        </motion.text>
        <motion.text
          x={AER_CX}
          y={NAME_Y}
          fill={V.leaf}
          fontSize={21}
          textAnchor="middle"
          className="font-mono"
          style={{ letterSpacing: "0.06em" }}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE, delay: 0.6 }}
        >
          {t(q.blockLabel, lang)}
        </motion.text>
      </motion.g>

      {/* ══ step 1 · the key to F = m · a, in the empty right half ══════════ */}

      <Draw
        d={`M ${LEG_X - 26} ${LEG_Y - 30} V ${LEG_Y + LEG_STEP * 2 + 12}`}
        on={formula}
        stroke={V.gold}
        w={3}
        dur={0.5}
        delay={0.2}
      />
      {legend.map(([g, word, unit], i) => (
        <motion.g
          key={g}
          initial={false}
          animate={{ opacity: formula ? 1 : 0, x: formula ? 0 : -14 }}
          transition={{ duration: 0.38, ease: EASE, delay: formula ? 0.3 + i * 0.09 : 0 }}
        >
          <text
            x={LEG_X}
            y={LEG_Y + i * LEG_STEP}
            fill={V.gold}
            fontSize={30}
            className="font-display"
            style={{ fontWeight: 700 }}
          >
            {g}
          </text>
          <text
            x={LEG_X + 44}
            y={LEG_Y + i * LEG_STEP}
            fill={BASE}
            fontSize={26}
            className="font-display"
          >
            {word}
            <tspan
              dx={12}
              fill={MID}
              fontSize={18}
              className="font-mono"
              style={{ letterSpacing: "0.06em" }}
            >
              {unit}
            </tspan>
          </text>
        </motion.g>
      ))}

      {/* ══ step 2 · force ══════════════════════════════════════════════════ */}

      <Draw d={`M 138 395 V ${AER_ARROW_Y + 22}`} on={force} stroke={DIM} w={2.5} dur={0.5} />

      <ForceArrow y={BRICK_ARROW_Y} len={ARROW_LEN} on={force} color={BRICK_C} delay={0.12} />
      <ForceArrow y={AER_ARROW_Y} len={AER_LEN} on={force} color={V.leaf} delay={0.42} />

      {/* Arrow labels sit outside the shaft, left of the shared origin. */}
      <motion.text
        x={122}
        y={BRICK_ARROW_Y + 11}
        fill={BRICK_C}
        fontSize={32}
        textAnchor="end"
        className="font-display"
        style={{ fontWeight: 700 }}
        initial={false}
        animate={{ opacity: force ? 1 : 0 }}
        transition={{ duration: 0.3, delay: force ? 0.3 : 0 }}
      >
        {F}
      </motion.text>
      <motion.text
        x={122}
        y={AER_ARROW_Y + 11}
        fill={V.leaf}
        fontSize={32}
        textAnchor="end"
        className="font-display"
        style={{ fontWeight: 700 }}
        initial={false}
        animate={{ opacity: force ? 1 : 0 }}
        transition={{ duration: 0.3, delay: force ? 0.6 : 0 }}
      >
        {F}
      </motion.text>

      {/* the measure across the difference between the two tips */}
      <Draw
        d={`M ${ARROW_X0 + AER_LEN} ${MEASURE_Y} H ${ARROW_X0 + ARROW_LEN}`}
        on={force}
        stroke={MID}
        w={2.5}
        delay={1.05}
        dur={0.6}
      />
      <Draw
        d={`M ${ARROW_X0 + AER_LEN} ${MEASURE_Y - 11} V ${MEASURE_Y + 11} M ${
          ARROW_X0 + ARROW_LEN
        } ${MEASURE_Y - 11} V ${MEASURE_Y + 11}`}
        on={force}
        stroke={MID}
        w={2.5}
        delay={1.25}
        dur={0.25}
      />

      <motion.g
        initial={false}
        animate={{ scale: force ? 1 : 1.25, opacity: force ? 1 : 0 }}
        transition={{ duration: 0.42, ease: EASE, delay: force ? 1.35 : 0 }}
      >
        {/* The group holds one middle-anchored <text>, so motion's default
            fill-box centre is already the glyph centre. A px origin would be
            re-based against that same bbox and push the pop off-centre. */}
        <text
          x={ARROW_X0 + (AER_LEN + ARROW_LEN) / 2}
          y={MEASURE_Y - 20}
          fill={BASE}
          fontSize={44}
          textAnchor="middle"
          className="font-display tnum"
          style={{ fontWeight: 600 }}
        >
          {`≈ ${num(Math.round(RATIO * 10) / 10)} ×`}
        </text>
      </motion.g>
    </svg>
  );
}

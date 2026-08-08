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
 * v2 "IMARAT Vivid": flat vector, saturated fills wiped in under a clip rect.
 * The physics justification for the material choice, drawn as an argument that
 * assembles itself.
 *
 * Step map (slide q-mass has 4 steps, 0…3)
 *   0 — empty.
 *   1 — two density columns fill from the ground up: brick to 1875 kg/m³ in
 *       bone white, aerated block to 550 kg/m³ in emerald. Counters tick to the
 *       two figures on a .tnum face; the unit and the material name sit with
 *       each column.
 *   2 — the mass block dims to half. F = m · a belongs to the slide, which sets
 *       it at 84 px in the left column; the diagram must not echo it in grey at
 *       the same moment, so here the step is a hand-off, not a second reading.
 *   3 — two force arrows extend along their own axis. The brick one is ~3.4×
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

const BASE_Y = 310;
const COL_W = 122;
const BRICK_H = 215;
const AER_H = (AERATED / BRICK) * BRICK_H;
const BRICK_CX = 139;
/** Spaced for the *labels*, not the columns: "Gʻisht terimi" is wider than 122. */
const AER_CX = 340;

const ARROW_X0 = 78;
const ARROW_LEN = 700;
const BRICK_ARROW_Y = 418;
const AER_ARROW_Y = 528;
const MEASURE_Y = 480;

const BASE = "rgba(244,251,244,0.9)";
const DIM = "rgba(244,251,244,0.35)";
const MID = "rgba(244,251,244,0.6)";

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
 * the head a triangle, both inside a group scaled on X from a local origin at
 * the tail — no geometry attribute animates.
 */
function ForceArrow({
  y,
  len,
  on,
  color,
  delay = 0,
  thick = 12,
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

// ── diagram ──────────────────────────────────────────────────────────────────

export function MassPhysics({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.mass;

  const mass = step >= 1;
  const formula = step >= 2;
  const force = step >= 3;

  const brickV = useCount(BRICK, mass, 1.1, 0.35);
  const aerV = useCount(AERATED, mass, 1.1, 0.5);

  /** The leading glyph of "F = m · a", straight from strings — it labels both
   *  force arrows at step 3 and is never retyped here. */
  const glyphs = useMemo(() => q.formula.split(/\s+/).filter(Boolean), [q.formula]);

  return (
    <svg viewBox="0 0 880 600" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* ══ step 1 · mass ═══════════════════════════════════════════════════ */}

      {/* The whole mass block steps back once the formula lands on the slide.
          Group opacity multiplies with each child's own gate, so the entrance
          animations are untouched — this only sets the ceiling. */}
      <motion.g
        initial={false}
        animate={{ opacity: formula ? 0.5 : 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: formula ? 0.2 : 0 }}
      >
      <Draw
        d={`M 52 ${BASE_Y} H ${AER_CX + COL_W / 2 + 24}`}
        on={mass}
        stroke={DIM}
        w={3}
        dur={0.7}
      />

      <Column
        cx={BRICK_CX}
        h={BRICK_H}
        on={mass}
        fill="rgba(244,251,244,0.16)"
        stroke={BASE}
        bands={11}
        delay={0.05}
      />
      <Column
        cx={AER_CX}
        h={AER_H}
        on={mass}
        fill="rgba(0,168,104,0.3)"
        stroke={V.leaf}
        bands={3}
        delay={0.22}
      />

      {/* readings */}
      <motion.g
        initial={false}
        animate={{ opacity: mass ? 1 : 0, y: mass ? 0 : 12 }}
        transition={{ duration: 0.4, ease: EASE, delay: mass ? 0.3 : 0 }}
      >
        <text
          x={BRICK_CX}
          y={BASE_Y - BRICK_H - 38}
          fill={BASE}
          fontSize={54}
          textAnchor="middle"
          className="font-display tnum"
          style={{ fontWeight: 600 }}
        >
          {brickV}
        </text>
        <text
          x={BRICK_CX}
          y={BASE_Y - BRICK_H - 12}
          fill={MID}
          fontSize={20}
          textAnchor="middle"
          className="font-mono"
          style={{ letterSpacing: "0.08em" }}
        >
          {q.unit}
        </text>
      </motion.g>

      <motion.g
        initial={false}
        animate={{ opacity: mass ? 1 : 0, y: mass ? 0 : 12 }}
        transition={{ duration: 0.4, ease: EASE, delay: mass ? 0.46 : 0 }}
      >
        <text
          x={AER_CX}
          y={BASE_Y - AER_H - 38}
          fill={V.leaf}
          fontSize={54}
          textAnchor="middle"
          className="font-display tnum"
          style={{ fontWeight: 600 }}
        >
          {aerV}
        </text>
        <text
          x={AER_CX}
          y={BASE_Y - AER_H - 12}
          fill={MID}
          fontSize={20}
          textAnchor="middle"
          className="font-mono"
          style={{ letterSpacing: "0.08em" }}
        >
          {q.unit}
        </text>
      </motion.g>

      <motion.text
        x={BRICK_CX}
        y={BASE_Y + 36}
        fill={MID}
        fontSize={23}
        textAnchor="middle"
        className="font-mono"
        style={{ letterSpacing: "0.06em" }}
        initial={false}
        animate={{ opacity: mass ? 1 : 0, y: mass ? 0 : 8 }}
        transition={{ duration: 0.35, ease: EASE, delay: mass ? 0.45 : 0 }}
      >
        {t(q.brickLabel, lang)}
      </motion.text>
      <motion.text
        x={AER_CX}
        y={BASE_Y + 36}
        fill={V.leaf}
        fontSize={23}
        textAnchor="middle"
        className="font-mono"
        style={{ letterSpacing: "0.06em" }}
        initial={false}
        animate={{ opacity: mass ? 1 : 0, y: mass ? 0 : 8 }}
        transition={{ duration: 0.35, ease: EASE, delay: mass ? 0.6 : 0 }}
      >
        {t(q.blockLabel, lang)}
      </motion.text>
      </motion.g>

      {/* ══ step 2 · the mass block recedes; the formula lands on the slide ══ */}

      {/* ══ step 3 · force ══════════════════════════════════════════════════ */}

      <Draw d="M 66 372 V 566" on={force} stroke={DIM} w={2.5} dur={0.5} />

      <ForceArrow y={BRICK_ARROW_Y} len={ARROW_LEN} on={force} color={V.ember} delay={0.12} thick={16} />
      <ForceArrow y={AER_ARROW_Y} len={ARROW_LEN / RATIO} on={force} color={V.leaf} delay={0.42} thick={16} />

      <motion.text
        x={92}
        y={BRICK_ARROW_Y - 26}
        fill={V.ember}
        fontSize={30}
        className="font-display"
        style={{ fontWeight: 600 }}
        initial={false}
        animate={{ opacity: force ? 1 : 0 }}
        transition={{ duration: 0.3, delay: force ? 0.3 : 0 }}
      >
        {glyphs[0] ?? "F"}
      </motion.text>
      <motion.text
        x={92}
        y={AER_ARROW_Y - 26}
        fill={V.leaf}
        fontSize={30}
        className="font-display"
        style={{ fontWeight: 600 }}
        initial={false}
        animate={{ opacity: force ? 1 : 0 }}
        transition={{ duration: 0.3, delay: force ? 0.6 : 0 }}
      >
        {glyphs[0] ?? "F"}
      </motion.text>

      {/* the measure across the difference between the two tips */}
      <Draw
        d={`M ${ARROW_X0 + ARROW_LEN / RATIO} ${MEASURE_Y} H ${ARROW_X0 + ARROW_LEN}`}
        on={force}
        stroke={MID}
        w={2.5}
        delay={1.05}
        dur={0.6}
      />
      <Draw
        d={`M ${ARROW_X0 + ARROW_LEN / RATIO} ${MEASURE_Y - 11} V ${MEASURE_Y + 11} M ${
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
          x={ARROW_X0 + (ARROW_LEN / RATIO + ARROW_LEN) / 2}
          y={MEASURE_Y - 18}
          fill={BASE}
          fontSize={46}
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

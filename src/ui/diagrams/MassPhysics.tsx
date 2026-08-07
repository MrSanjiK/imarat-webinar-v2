"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { num, t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  Annotation,
  C,
  CounterText,
  Hatch,
  SketchArrow,
  SketchLine,
  SketchRect,
} from "@/ui/sketch";

/**
 * MassPhysics — chapter 1 (dark), slide 05 "Ortiqcha vazn".
 *
 * The physics justification for the material choice, drawn as an argument that
 * assembles itself:
 *
 *   step 0 — empty sheet.
 *   step 1 — two density columns grow from the ground line, hatched (brick dense,
 *            block sparse), counters ticking to 1875 and 550 kg/m³.
 *   step 2 — F = m · a assembles: `m` flies out of the mass columns (with a
 *            leader arrow back to them), `F` rises from the force zone below,
 *            `a` arrives from the right. The picture becomes an equation.
 *   step 3 — two force arrows stretch along their axis, the brick one ~3.4× the
 *            aerated one, with a measure line and the ratio called out.
 *
 * Pure function of `step`: every animation is a two-state `on/off` transition,
 * so stepping backward renders exactly what stepping forward rendered.
 */

// ── numbers (all derived from figures.ts, never retyped) ─────────────────────

const mid = (r: readonly [number, number]) => (r[0] + r[1]) / 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 1875 kg/m³ — midpoint of the brick-wall band. */
const BRICK = mid(N.materials.brickWallDensity);
/** 550 kg/m³ — midpoint of the aerated-block band. */
const AERATED = mid(N.materials.aeratedDensity);
/** ≈3.4, held inside the claimed 2–4× band so the diagram cannot outrun the copy. */
const RATIO = clamp(BRICK / AERATED, N.materials.lighterFactor[0], N.materials.lighterFactor[1]);

// ── layout (viewBox 880 × 600) ───────────────────────────────────────────────

const BASE = 310; // ground line under the mass columns
const COL_W = 122;
const BRICK_H = 215;
const AER_H = (AERATED / BRICK) * BRICK_H;
const BRICK_CX = 139;
// Not spaced for the columns — spaced for their labels. "Gʻisht terimi" is
// 190 px wide at 23 px mono against a 122 px column, so centring each caption on
// its own column needs the centres ~196 px apart or the two words touch.
const AER_CX = 340;

const FORMULA_Y = 175;
const ARROW_X0 = 78;
const ARROW_LEN = 700;
const BRICK_ARROW_Y = 415;
const AER_ARROW_Y = 525;
const MEASURE_Y = 478;

const LINE = "rgba(244,241,234,0.82)";
const DIM = "rgba(244,241,234,0.52)";
const FAINT = "rgba(244,241,234,0.32)";

// ── pieces ───────────────────────────────────────────────────────────────────

/**
 * A density column. Grows by scaling a `<g>` whose local origin sits on the
 * ground line — the rect's own `y`/`height` never move.
 */
function MassColumn({
  cx,
  h,
  on,
  gap,
  hatchColor,
  seed,
  delay = 0,
}: {
  cx: number;
  h: number;
  on: boolean;
  gap: number;
  hatchColor: string;
  seed: number;
  delay?: number;
}) {
  return (
    <g transform={`translate(${cx} ${BASE})`}>
      <motion.g
        initial={false}
        animate={{ scaleY: on ? 1 : 0 }}
        transition={{ duration: 0.8, ease: EASE, delay }}
        style={{ transformOrigin: "0px 0px" }}
      >
        <Hatch
          x={-COL_W / 2}
          y={-h}
          w={COL_W}
          h={h}
          gap={gap}
          seed={seed + 7}
          stroke={hatchColor}
          width={1.5}
          opacity={0.5}
          on={on}
          delay={delay + 0.3}
          duration={0.7}
        />
        <SketchRect
          x={-COL_W / 2}
          y={-h}
          w={COL_W}
          h={h}
          seed={seed}
          amp={1.6}
          on={on}
          stroke={LINE}
          width={2}
          delay={delay}
          duration={0.75}
        />
      </motion.g>
    </g>
  );
}

/** A formula glyph that flies in from wherever its meaning comes from. */
function Glyph({
  x,
  y,
  ch,
  on,
  from,
  delay = 0,
  duration = 0.6,
  size = 66,
  color = C.paper,
}: {
  x: number;
  y: number;
  ch: string;
  on: boolean;
  from: readonly [number, number];
  delay?: number;
  duration?: number;
  size?: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g
        initial={false}
        animate={{ x: on ? 0 : from[0], y: on ? 0 : from[1], opacity: on ? 1 : 0 }}
        transition={{
          duration,
          ease: EASE,
          delay: on ? delay : 0,
          opacity: { duration: 0.28, delay: on ? delay : 0 },
        }}
      >
        <text
          x={0}
          y={0}
          fill={color}
          fontSize={size}
          textAnchor="middle"
          className="font-display"
          style={{ fontWeight: 500 }}
        >
          {ch}
        </text>
      </motion.g>
    </g>
  );
}

/** A force arrow that stretches along its own axis. */
function ForceArrow({
  y,
  len,
  on,
  color,
  seed,
  delay = 0,
}: {
  y: number;
  len: number;
  on: boolean;
  color: string;
  seed: number;
  delay?: number;
}) {
  return (
    <g transform={`translate(${ARROW_X0} ${y})`}>
      <motion.g
        initial={false}
        animate={{ scaleX: on ? 1 : 0 }}
        transition={{ duration: 0.85, ease: EASE, delay }}
        style={{ transformOrigin: "0px 0px" }}
      >
        <SketchArrow
          x1={0}
          y1={0}
          x2={len}
          y2={0}
          seed={seed}
          head={20}
          on={on}
          stroke={color}
          width={3}
          delay={delay}
          duration={0.6}
        />
      </motion.g>
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

  return (
    <svg viewBox="0 0 880 600" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* ── step 1 · mass ─────────────────────────────────────────────────── */}

      <SketchLine
        x1={52}
        y1={BASE}
        x2={AER_CX + COL_W / 2 + 22}
        y2={BASE}
        seed={17}
        amp={1.5}
        on={mass}
        stroke={DIM}
        width={1.5}
        duration={0.7}
      />

      {/* dense hatch = heavy */}
      <MassColumn cx={BRICK_CX} h={BRICK_H} on={mass} gap={9} hatchColor={C.paper} seed={23} delay={0.05} />
      {/* sparse hatch = light; leaf marks "ours" */}
      <MassColumn cx={AER_CX} h={AER_H} on={mass} gap={19} hatchColor={C.leaf} seed={57} delay={0.22} />

      <CounterText
        x={BRICK_CX}
        y={BASE - BRICK_H - 40}
        to={BRICK}
        on={mass}
        format={(v) => String(Math.round(v))}
        size={50}
        color={C.paper}
        anchor="middle"
        delay={0.35}
        duration={1.1}
      />
      <motion.text
        x={BRICK_CX}
        y={BASE - BRICK_H - 14}
        fill={DIM}
        fontSize={20}
        textAnchor="middle"
        className="font-mono"
        style={{ letterSpacing: "0.08em" }}
        initial={false}
        animate={{ opacity: mass ? 1 : 0 }}
        transition={{ duration: 0.3, delay: mass ? 0.5 : 0 }}
      >
        {q.unit}
      </motion.text>

      <CounterText
        x={AER_CX}
        y={BASE - AER_H - 40}
        to={AERATED}
        on={mass}
        format={(v) => String(Math.round(v))}
        size={50}
        color={C.leaf}
        anchor="middle"
        delay={0.5}
        duration={1.1}
      />
      <motion.text
        x={AER_CX}
        y={BASE - AER_H - 14}
        fill={DIM}
        fontSize={20}
        textAnchor="middle"
        className="font-mono"
        style={{ letterSpacing: "0.08em" }}
        initial={false}
        animate={{ opacity: mass ? 1 : 0 }}
        transition={{ duration: 0.3, delay: mass ? 0.65 : 0 }}
      >
        {q.unit}
      </motion.text>

      <motion.text
        x={BRICK_CX}
        y={BASE + 34}
        fill={DIM}
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
        y={BASE + 34}
        fill={C.leaf}
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

      {/* ── step 2 · the formula assembles ───────────────────────────────── */}

      {/* leader: `m` came out of the columns */}
      <SketchArrow
        x1={212}
        y1={186}
        x2={634}
        y2={178}
        seed={71}
        head={13}
        on={formula}
        stroke={FAINT}
        width={1.5}
        delay={1.0}
        duration={0.55}
        curve={-26}
      />

      {/* F rises out of the (still empty) force zone below */}
      <Glyph x={552} y={FORMULA_Y} ch="F" on={formula} from={[-120, 250]} delay={0} duration={0.7} />
      <Glyph x={614} y={FORMULA_Y} ch="=" on={formula} from={[0, -34]} delay={0.18} color={DIM} />
      {/* m travels the whole way from the mass columns */}
      <Glyph
        x={677}
        y={FORMULA_Y}
        ch="m"
        on={formula}
        from={[BRICK_CX - 677, 200 - FORMULA_Y]}
        delay={0.34}
        duration={0.85}
      />
      <Glyph x={727} y={FORMULA_Y} ch="·" on={formula} from={[0, -34]} delay={0.5} color={DIM} />
      {/* a arrives from outside — the ground moves, not the building */}
      <Glyph x={770} y={FORMULA_Y} ch="a" on={formula} from={[170, 0]} delay={0.6} />

      {/* ── step 3 · force ────────────────────────────────────────────────── */}

      <SketchLine
        x1={66}
        y1={372}
        x2={66}
        y2={562}
        seed={31}
        amp={1.4}
        on={force}
        stroke={FAINT}
        width={1.5}
        duration={0.5}
      />

      <ForceArrow y={BRICK_ARROW_Y} len={ARROW_LEN} on={force} color={C.ember} seed={83} delay={0.12} />
      <ForceArrow
        y={AER_ARROW_Y}
        len={ARROW_LEN / RATIO}
        on={force}
        color={C.leaf}
        seed={97}
        delay={0.42}
      />

      <motion.text
        x={90}
        y={BRICK_ARROW_Y - 24}
        fill={C.ember}
        fontSize={30}
        className="font-display"
        initial={false}
        animate={{ opacity: force ? 1 : 0 }}
        transition={{ duration: 0.3, delay: force ? 0.3 : 0 }}
      >
        F
      </motion.text>
      <motion.text
        x={90}
        y={AER_ARROW_Y - 24}
        fill={C.leaf}
        fontSize={30}
        className="font-display"
        initial={false}
        animate={{ opacity: force ? 1 : 0 }}
        transition={{ duration: 0.3, delay: force ? 0.6 : 0 }}
      >
        F
      </motion.text>

      {/* measure line spanning the difference between the two tips */}
      <SketchLine
        x1={ARROW_X0 + ARROW_LEN / RATIO}
        y1={MEASURE_Y}
        x2={ARROW_X0 + ARROW_LEN}
        y2={MEASURE_Y}
        seed={43}
        amp={1.2}
        on={force}
        stroke={DIM}
        width={1.5}
        delay={1.05}
        duration={0.6}
      />
      <SketchLine
        x1={ARROW_X0 + ARROW_LEN / RATIO}
        y1={MEASURE_Y - 9}
        x2={ARROW_X0 + ARROW_LEN / RATIO}
        y2={MEASURE_Y + 9}
        seed={44}
        amp={0.8}
        on={force}
        stroke={DIM}
        width={1.5}
        delay={1.25}
        duration={0.25}
      />
      <SketchLine
        x1={ARROW_X0 + ARROW_LEN}
        y1={MEASURE_Y - 9}
        x2={ARROW_X0 + ARROW_LEN}
        y2={MEASURE_Y + 9}
        seed={45}
        amp={0.8}
        on={force}
        stroke={DIM}
        width={1.5}
        delay={1.25}
        duration={0.25}
      />

      <Annotation
        x={ARROW_X0 + (ARROW_LEN / RATIO + ARROW_LEN) / 2}
        y={MEASURE_Y - 14}
        text={`≈ ${num(Math.round(RATIO * 10) / 10)} ×`}
        on={force}
        delay={1.35}
        color={C.paper}
        size={42}
        anchor="middle"
      />
    </svg>
  );
}

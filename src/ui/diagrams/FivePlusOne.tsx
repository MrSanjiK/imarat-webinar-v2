"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { N } from "@/content/figures";
import {
  C,
  CounterText,
  Hatch,
  SketchArrow,
  SketchPath,
  wobbleEllipse,
  wobbleLine,
  wobblePoly,
  wobbleRect,
  type Pt,
} from "@/ui/sketch";

/**
 * FivePlusOne — chapter 4, the 5+1 offer, slot 880 × 700.
 *
 * Two bands. The upper one counts the apartments: five in pencil, then a plus,
 * then the sixth in gold. The lower one owns the three words the slide prints
 * underneath in this exact left-to-right order — Toʻlov, Chegirma, Sovgʻa — as
 * two meshed gauges and a wrapped unit. No word is repeated in the drawing;
 * the captions name it, the drawing shows the mechanism.
 *
 * The point of the slide is that the two gauges are geared: the discount you
 * get is the percentage you paid. Their needles therefore always sit at the
 * same angle, their rims mesh, and an "=" sits in the gap between them.
 *
 * Step choreography (VipFivePlusOne, 4 steps)
 *   0 — the apparatus, empty: dashed ghosts of six units and of the gift, plus
 *       two blank gauge tracks. Reads as reserved, not blank.
 *   1 — five units draw in left to right in ink; the sixth materialises out of
 *       its ghost in gold with a gold wash. Braces count 5 and 6.
 *   2 — the gauge band opens. Both needles swing to N.vip.ladder[0]: 50 paid,
 *       50 off. The meshing teeth and the "=" draw in.
 *   3 — the pair runs on to N.vip.ladder[1]: 100 paid, 100 off. An arrow leaves
 *       the discount gauge and the sixth unit lands, gold, under a forest
 *       ribbon and bow.
 *
 * Pure function of `step`. Only transform, opacity and strokeDashoffset move;
 * both needles rotate inside an invisible square anchor so their pivot is the
 * gauge centre rather than whatever bounding box motion would otherwise use.
 */

// ── geometry, baked once at module load ─────────────────────────────────────

const LADDER = N.vip.ladder;

/** Gauge sweep: 135° (lower left) clockwise 270° to 45° (lower right). */
const A0 = 135;
const SWEEP = 270;

function gaugeArc(cx: number, cy: number, r: number, seed: number, n = 40): string {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((A0 + (SWEEP * i) / n) * Math.PI) / 180;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return wobblePoly(pts, seed, 0.8, false);
}

/** Three majors only — 0, half, full — so nothing collides with the teeth. */
function gaugeTicks(cx: number, cy: number, r: number, seed: number): string {
  const parts: string[] = [];
  for (let i = 0; i <= 2; i++) {
    const a = ((A0 + (SWEEP * i) / 2) * Math.PI) / 180;
    parts.push(
      wobbleLine(
        cx + Math.cos(a) * (r + 5),
        cy + Math.sin(a) * (r + 5),
        cx + Math.cos(a) * (r + 15),
        cy + Math.sin(a) * (r + 15),
        seed + i,
        0.4,
      ),
    );
  }
  return parts.join(" ");
}

/** Three short rim teeth, so the two gauges read as geared to each other. */
function teeth(cx: number, cy: number, r: number, base: number, seed: number): string {
  return [-18, 0, 18]
    .map((d, i) => {
      const a = ((base + d) * Math.PI) / 180;
      return wobbleLine(
        cx + Math.cos(a) * r,
        cy + Math.sin(a) * r,
        cx + Math.cos(a) * (r + 10),
        cy + Math.sin(a) * (r + 10),
        seed + i,
        0.35,
      );
    })
    .join(" ");
}

/** Drawn at the zero position; the group rotates it to the reading. */
function needlePath(cx: number, cy: number, r: number, seed: number): string {
  const a = (A0 * Math.PI) / 180;
  return wobbleLine(
    cx - Math.cos(a) * 14,
    cy - Math.sin(a) * 14,
    cx + Math.cos(a) * (r - 22),
    cy + Math.sin(a) * (r - 22),
    seed,
    0.5,
  );
}

/** An apartment as a two-by-two elevation with a door. */
function unitPaths(x: number, y: number, w: number, h: number, seed: number) {
  const ww = w * 0.28;
  const wh = h * 0.2;
  const c1 = x + w * 0.16;
  const c2 = x + w * 0.84 - ww;
  const r1 = y + h * 0.14;
  const r2 = y + h * 0.42;
  const dw = w * 0.24;
  const dh = h * 0.28;
  return {
    body: wobbleRect(x, y, w, h, seed, 1.2, 2),
    detail: [
      wobbleRect(c1, r1, ww, wh, seed + 1, 0.8),
      wobbleRect(c2, r1, ww, wh, seed + 2, 0.8),
      wobbleRect(c1, r2, ww, wh, seed + 3, 0.8),
      wobbleRect(c2, r2, ww, wh, seed + 4, 0.8),
      wobbleRect(x + (w - dw) / 2, y + h - dh, dw, dh, seed + 5, 0.8),
    ].join(" "),
  };
}

// upper band — the count
const UNIT = { w: 112, h: 132, y: 64 };
const UNIT_X = [46, 176, 306, 436, 566, 722] as const;
const BONUS_I = UNIT_X.length - 1;
const UNITS = UNIT_X.map((x, i) => unitPaths(x, UNIT.y, UNIT.w, UNIT.h, 101 + i * 11));
const UNIT_GHOST = UNIT_X.map((x, i) => wobbleRect(x, UNIT.y, UNIT.w, UNIT.h, 201 + i * 9, 1.5));

const BRACE_MANY = [
  wobbleLine(46, 214, 678, 214, 401, 1),
  wobbleLine(46, 214, 46, 204, 402, 0.5),
  wobbleLine(678, 214, 678, 204, 403, 0.5),
  wobbleLine(362, 214, 362, 228, 404, 0.5),
].join(" ");

const BRACE_ONE = [
  wobbleLine(722, 214, 834, 214, 411, 0.8),
  wobbleLine(722, 214, 722, 204, 412, 0.5),
  wobbleLine(834, 214, 834, 204, 413, 0.5),
  wobbleLine(778, 214, 778, 228, 414, 0.5),
].join(" ");

const DIVIDER = wobbleLine(50, 288, 830, 288, 421, 1.2);

// lower band — pay, discount, gift
const R = 84;
const CY = 462;
const PAID_CX = 228;
const DISC_CX = 452;
const GIFT_CX = 676;
const READOUT_Y = 588;

const PAID = {
  arc: gaugeArc(PAID_CX, CY, R, 301),
  ticks: gaugeTicks(PAID_CX, CY, R, 311),
  needle: needlePath(PAID_CX, CY, R, 321),
  teeth: teeth(PAID_CX, CY, R, 0, 331),
};

const DISC = {
  arc: gaugeArc(DISC_CX, CY, R, 341),
  ticks: gaugeTicks(DISC_CX, CY, R, 351),
  needle: needlePath(DISC_CX, CY, R, 361),
  teeth: teeth(DISC_CX, CY, R, 180, 371),
};

const GIFT = { x: 616, y: 387, w: 120, h: 150 };
const GIFT_BODY = wobbleRect(GIFT.x, GIFT.y, GIFT.w, GIFT.h, 501, 1.6, 3);
const GIFT_GHOST = wobbleRect(GIFT.x, GIFT.y, GIFT.w, GIFT.h, 511, 1.5);
const RIBBON = [
  wobbleLine(GIFT_CX, GIFT.y, GIFT_CX, GIFT.y + GIFT.h, 521, 1),
  wobbleLine(GIFT.x, CY, GIFT.x + GIFT.w, CY, 522, 1),
].join(" ");
const BOW = [
  wobbleEllipse(GIFT_CX - 17, GIFT.y - 11, 16, 12, 531, 1),
  wobbleEllipse(GIFT_CX + 17, GIFT.y - 11, 16, 12, 532, 1),
  wobbleEllipse(GIFT_CX, GIFT.y - 9, 6, 6, 533, 0.6),
].join(" ");
const GIFT_RULE = wobbleLine(620, 578, 732, 578, 541, 0.9);

// ── parts ───────────────────────────────────────────────────────────────────

/** Dashed placeholder. Fades, never draws on. */
function Ghost({ d, on }: { d: string; on: boolean }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={C.ash}
      strokeWidth={1.6}
      strokeDasharray="9 9"
      strokeLinecap="round"
      initial={false}
      animate={{ opacity: on ? 0.45 : 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    />
  );
}

/** Partial reveal of a baked arc: strokeDashoffset against pathLength 1. */
function Reading({
  d,
  frac,
  stroke,
  delay,
}: {
  d: string;
  frac: number;
  stroke: string;
  delay: number;
}) {
  return (
    <motion.path
      d={d}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={6}
      strokeLinecap="round"
      strokeDasharray={1}
      initial={false}
      animate={{ strokeDashoffset: 1 - frac }}
      transition={{ duration: 0.85, ease: EASE, delay }}
      style={{ strokeDasharray: 1 }}
    />
  );
}

function Gauge({
  cx,
  parts,
  frac,
  on,
  color,
  value,
  delay,
}: {
  cx: number;
  parts: typeof PAID;
  frac: number;
  on: boolean;
  color: string;
  value: number;
  delay: number;
}) {
  return (
    <g>
      <SketchPath d={parts.arc} on stroke={C.ash} width={2} opacity={0.45} duration={0.9} />
      <SketchPath d={parts.ticks} on stroke={C.ash} width={1.8} opacity={0.6} duration={0.4} />
      <Reading d={parts.arc} frac={frac} stroke={color} delay={delay} />
      <SketchPath
        d={parts.teeth}
        on={on}
        stroke={C.ash}
        width={2}
        opacity={0.8}
        delay={delay}
        duration={0.3}
      />

      {/*
        The needle. Motion forces `transform-box: fill-box` on animated SVG
        nodes, so a rotation is taken about the group's own bounding-box centre.
        The square below is centred on (cx, CY) and larger than everything else
        in the group, which pins that centre to the gauge centre exactly.
      */}
      <motion.g
        initial={false}
        animate={{ rotate: frac * SWEEP, opacity: on ? 1 : 0 }}
        transition={{
          rotate: { duration: 0.85, ease: EASE, delay },
          opacity: { duration: 0.3, delay: on ? delay : 0 },
        }}
      >
        <rect x={cx - (R + 20)} y={CY - (R + 20)} width={(R + 20) * 2} height={(R + 20) * 2} fill="none" />
        <path
          d={parts.needle}
          fill="none"
          stroke={color}
          strokeWidth={3.4}
          strokeLinecap="round"
        />
      </motion.g>
      <motion.circle
        cx={cx}
        cy={CY}
        r={6}
        fill={color}
        initial={false}
        animate={{ opacity: on ? 1 : 0 }}
        transition={{ duration: 0.3, delay: on ? delay : 0 }}
      />

      <CounterText
        x={cx}
        y={READOUT_Y}
        to={value}
        on={on}
        format={(v) => `${Math.round(v)}%`}
        size={56}
        color={color}
        anchor="middle"
        duration={0.85}
        delay={delay}
      />
    </g>
  );
}

// ── the diagram ─────────────────────────────────────────────────────────────

export function FivePlusOne({ step }: { step: number }) {
  const counted = step >= 1;
  const geared = step >= 2;
  const free = step >= 3;

  const rung = free ? LADDER[1] : geared ? LADDER[0] : null;
  const paid = rung ? rung.paid : 0;
  const discount = rung ? rung.discount : 0;

  return (
    <svg viewBox="0 0 880 700" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* ── the count ────────────────────────────────────────────────────── */}
      {UNIT_X.map((x, i) => {
        const bonus = i === BONUS_I;
        const stroke = bonus ? C.gold : C.ink;
        const d = 0.08 + i * 0.11;
        return (
          <g key={x}>
            <Ghost d={UNIT_GHOST[i]} on={!counted} />
            <SketchPath
              d={UNITS[i].body}
              on={counted}
              stroke={stroke}
              width={bonus ? 3.2 : 2.4}
              delay={d}
              duration={0.45}
            />
            <SketchPath
              d={UNITS[i].detail}
              on={counted}
              stroke={stroke}
              width={1.6}
              opacity={0.75}
              delay={d + 0.16}
              duration={0.4}
            />
            {bonus && (
              <Hatch
                x={x + 4}
                y={UNIT.y + 4}
                w={UNIT.w - 8}
                h={UNIT.h - 8}
                gap={13}
                angle={45}
                seed={181}
                on={counted}
                stroke={C.gold}
                width={1.4}
                opacity={0.24}
                delay={d + 0.24}
                duration={0.6}
              />
            )}
          </g>
        );
      })}

      <motion.text
        x={700}
        y={146}
        fill={C.ash}
        fontSize={46}
        textAnchor="middle"
        className="font-sans"
        fontWeight={300}
        initial={false}
        animate={{ opacity: counted ? 1 : 0, scale: counted ? 1 : 0.7 }}
        transition={{ duration: 0.3, ease: EASE, delay: counted ? 0.62 : 0 }}
      >
        +
      </motion.text>

      <SketchPath
        d={BRACE_MANY}
        on={counted}
        stroke={C.ash}
        width={1.6}
        opacity={0.75}
        delay={0.66}
        duration={0.5}
      />
      <SketchPath
        d={BRACE_ONE}
        on={counted}
        stroke={C.gold}
        width={1.6}
        opacity={0.85}
        delay={0.78}
        duration={0.3}
      />
      <motion.text
        x={362}
        y={256}
        fill={C.ash}
        fontSize={30}
        textAnchor="middle"
        className="tnum font-mono"
        initial={false}
        animate={{ opacity: counted ? 1 : 0, y: counted ? 0 : 8 }}
        transition={{ duration: 0.3, ease: EASE, delay: counted ? 0.86 : 0 }}
      >
        {N.vip.bundleSize}
      </motion.text>
      <motion.text
        x={778}
        y={256}
        fill={C.gold}
        fontSize={30}
        textAnchor="middle"
        className="tnum font-mono"
        initial={false}
        animate={{ opacity: counted ? 1 : 0, y: counted ? 0 : 8 }}
        transition={{ duration: 0.3, ease: EASE, delay: counted ? 0.94 : 0 }}
      >
        {N.vip.bundleBonusIndex}
      </motion.text>

      <motion.path
        d={DIVIDER}
        fill="none"
        stroke={C.ink}
        strokeWidth={1.4}
        strokeDasharray="10 9"
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: geared ? 0.18 : 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      />

      {/* ── the mechanism: paid · discount · gift, left to right ─────────── */}
      <Gauge
        cx={PAID_CX}
        parts={PAID}
        frac={paid}
        on={geared}
        color={C.ink}
        value={paid * 100}
        delay={0.12}
      />

      <motion.text
        x={340}
        y={CY + 14}
        fill={C.gold}
        fontSize={38}
        textAnchor="middle"
        className="font-sans"
        fontWeight={400}
        initial={false}
        animate={{ opacity: geared ? 1 : 0, scale: geared ? 1 : 0.6 }}
        transition={{ duration: 0.32, ease: EASE, delay: geared ? 0.5 : 0 }}
      >
        =
      </motion.text>

      <Gauge
        cx={DISC_CX}
        parts={DISC}
        frac={discount}
        on={geared}
        color={C.gold}
        value={discount * 100}
        delay={0.12}
      />

      {/* the sixth apartment, handed over */}
      <Ghost d={GIFT_GHOST} on={!free} />
      <SketchArrow
        x1={548}
        y1={CY}
        x2={606}
        y2={CY}
        seed={551}
        head={13}
        on={free}
        stroke={C.forest}
        width={2.4}
        delay={0.5}
        duration={0.35}
      />
      <SketchPath d={GIFT_BODY} on={free} stroke={C.gold} width={3.2} delay={0.72} duration={0.5} />
      <Hatch
        x={GIFT.x + 5}
        y={GIFT.y + 5}
        w={GIFT.w - 10}
        h={GIFT.h - 10}
        gap={14}
        angle={45}
        seed={561}
        on={free}
        stroke={C.gold}
        width={1.4}
        opacity={0.26}
        delay={0.92}
        duration={0.6}
      />
      <SketchPath d={RIBBON} on={free} stroke={C.forest} width={6} delay={1.04} duration={0.45} />
      <SketchPath d={BOW} on={free} stroke={C.forest} width={3} delay={1.3} duration={0.4} />
      <SketchPath
        d={GIFT_RULE}
        on={free}
        stroke={C.forest}
        width={2.4}
        opacity={0.8}
        delay={1.42}
        duration={0.3}
      />
    </svg>
  );
}

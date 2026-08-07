"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { N } from "@/content/figures";
import { C, Hatch, SketchEllipse, SketchPath, wobbleLine, wobbleRect } from "@/ui/sketch";

/**
 * BonusStack — chapter 4, "Keyingi xarid uchun bonuslar", slot 940 × 300.
 *
 * The slide's own list names the five perks; this drawing carries the shape of
 * the deal instead — four tiers stacking on one ground line, each one longer
 * and more densely washed than the last, so "more contracts, more back" is
 * legible before a word is read.
 *
 * Step choreography (VipBonuses, 6 steps)
 *   0 — ground line and four dashed tier ghosts: the rungs, waiting.
 *   1..4 — one tier lands per step, bottom to top. Outline draws in ink, the
 *          gold wash wipes up behind it, and its ordinal appears in the margin.
 *          Steps 2–4 carry no new slide copy, so the presenter has the stack to
 *          talk against while walking the list.
 *   5 — the two thresholds light up: a gold over-draw on the tiers at
 *       N.vip.freeRenovationFrom and N.vip.freeFurnishingFrom, each with a
 *       leader out to a circled "1+" / "2+" chip. This is the slide's only
 *       statement of those two figures in place, so it carries the beat alone.
 *
 * Pure function of `step`. Only transform, opacity and strokeDashoffset move.
 */

// ── geometry, baked once at module load ─────────────────────────────────────

const X0 = 62;
const BASE_Y = 262;
const SLAB_H = 50;
const PITCH = 58;

/** Left-aligned and widening upward: a staircase profile, not a pyramid. */
const WIDTHS = [420, 540, 660, 780] as const;
const HATCH_GAP = [20, 16, 12, 9] as const;
const HATCH_OP = [0.16, 0.22, 0.29, 0.36] as const;

const TIER = WIDTHS.map((w, i) => ({
  w,
  y: BASE_Y - SLAB_H - i * PITCH,
  mid: BASE_Y - SLAB_H / 2 - i * PITCH,
  right: X0 + w,
}));

const SLAB_D = TIER.map((tr, i) => wobbleRect(X0, tr.y, tr.w, SLAB_H, 21 + i * 9, 1.3, 2.5));
const GHOST_D = TIER.map((tr, i) => wobbleRect(X0, tr.y, tr.w, SLAB_H, 141 + i * 7, 1.5));

const GROUND = wobbleLine(40, BASE_Y, 900, BASE_Y, 11, 1.4);

/**
 * Which tier each bonus unlocks at. Driven by the figures, not hard-coded: move
 * `freeFurnishingFrom` to 3 and the chip walks up the stack with it.
 */
const CHIPS = [
  { from: N.vip.freeRenovationFrom, seed: 61 },
  { from: N.vip.freeFurnishingFrom, seed: 71 },
].map(({ from, seed }) => {
  const i = Math.min(Math.max(from - 1, 0), TIER.length - 1);
  const tr = TIER[i];
  return {
    i,
    seed,
    label: `${from}+`,
    cx: tr.right + 46,
    cy: tr.mid,
    leader: wobbleLine(tr.right + 6, tr.mid, tr.right + 22, tr.mid, seed + 3, 0.6),
  };
});

/** Tiers that get a gold over-draw at step 5, deduplicated. */
const LIT = Array.from(new Set(CHIPS.map((c) => c.i)));

// ── parts ───────────────────────────────────────────────────────────────────

/** Dashed outline of a tier not yet earned. Fades, never draws on. */
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

/** Margin ordinal: which contract number this tier is. */
function Ordinal({ n, y, on, delay }: { n: number; y: number; on: boolean; delay: number }) {
  return (
    <motion.text
      x={X0 - 18}
      y={y + 9}
      fill={C.ash}
      fontSize={26}
      textAnchor="end"
      className="tnum font-mono"
      initial={false}
      animate={{ opacity: on ? 1 : 0, x: on ? 0 : -8 }}
      transition={{ duration: 0.3, ease: EASE, delay: on ? delay : 0 }}
    >
      {n}
    </motion.text>
  );
}

/** Circled gold threshold marker. */
function ThresholdChip({
  cx,
  cy,
  label,
  leader,
  on,
  delay,
  seed,
}: {
  cx: number;
  cy: number;
  label: string;
  leader: string;
  on: boolean;
  delay: number;
  seed: number;
}) {
  return (
    <g>
      <SketchPath
        d={leader}
        on={on}
        stroke={C.gold}
        width={1.8}
        opacity={0.8}
        delay={delay}
        duration={0.2}
      />
      <SketchEllipse
        cx={cx}
        cy={cy}
        rx={24}
        ry={22}
        seed={seed}
        on={on}
        stroke={C.gold}
        width={2.6}
        delay={delay + 0.14}
        duration={0.4}
      />
      <motion.text
        x={cx}
        y={cy + 9}
        fill={C.gold}
        fontSize={26}
        fontWeight={600}
        textAnchor="middle"
        className="tnum font-sans"
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.72 }}
        transition={{ duration: 0.28, ease: EASE, delay: on ? delay + 0.3 : 0 }}
      >
        {label}
      </motion.text>
    </g>
  );
}

// ── the diagram ─────────────────────────────────────────────────────────────

export function BonusStack({ step }: { step: number }) {
  const marked = step >= 5;

  return (
    <svg viewBox="0 0 940 300" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <SketchPath d={GROUND} on stroke={C.ash} width={1.5} opacity={0.55} duration={0.8} />
      <Hatch
        x={40}
        y={BASE_Y}
        w={860}
        h={16}
        gap={13}
        angle={45}
        seed={17}
        on
        stroke={C.ash}
        width={1.2}
        opacity={0.35}
        delay={0.2}
        duration={0.7}
      />

      {TIER.map((tr, i) => {
        const on = step >= i + 1;
        const lit = marked && LIT.includes(i);
        return (
          /* Translate only: every child gates its own opacity, so the group can
             carry the settle without fading anything twice. */
          <motion.g
            key={i}
            initial={false}
            animate={{ y: on ? 0 : -16 }}
            transition={{ duration: 0.38, ease: EASE }}
          >
            <Ghost d={GHOST_D[i]} on={!on} />
            <SketchPath d={SLAB_D[i]} on={on} stroke={C.ink} width={2.4} duration={0.5} />
            <Hatch
              x={X0 + 3}
              y={tr.y + 3}
              w={tr.w - 6}
              h={SLAB_H - 6}
              gap={HATCH_GAP[i]}
              angle={45}
              seed={31 + i * 5}
              on={on}
              stroke={C.gold}
              width={1.5}
              opacity={HATCH_OP[i]}
              delay={0.22}
              duration={0.55}
            />
            <SketchPath
              d={SLAB_D[i]}
              on={lit}
              stroke={C.gold}
              width={3.2}
              delay={LIT.indexOf(i) * 0.18}
              duration={0.45}
            />
            <Ordinal n={i + 1} y={tr.mid} on={on} delay={0.3} />
          </motion.g>
        );
      })}

      {CHIPS.map((c, k) => (
        <ThresholdChip
          key={c.label}
          cx={c.cx}
          cy={c.cy}
          label={c.label}
          leader={c.leader}
          on={marked}
          delay={0.24 + k * 0.22}
          seed={c.seed}
        />
      ))}
    </svg>
  );
}

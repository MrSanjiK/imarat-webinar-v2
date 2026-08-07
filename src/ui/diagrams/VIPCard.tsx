"use client";

import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { C, Hatch, SketchEllipse, SketchPath, wobbleLine, wobbleRect } from "@/ui/sketch";

/**
 * VIPCard — chapter 4 opener, paper theme, slot 760 × 470.
 *
 * A membership card drawn the way an architect would draw one: pencil edges,
 * hatched wash, gold only where the club's value sits.
 *
 * Step choreography (VipIntro, 2 steps)
 *   0 — the empty slot: four corner registration marks and a dashed ghost of
 *       the card. The right half of the slide reads as "reserved", not blank,
 *       while the title and the gold badge land on the left.
 *   1 — the card flips in on rotateY, its gold edge draws, the wash hatches,
 *       and the face prints itself: issuer line, chip, wordmark, embossed
 *       number row, signature lines, and the club seal. One gold shine passes
 *       across it and is gone. One pass only — a second would read as a casino.
 *
 * Pure function of `step`. Only transform / opacity / strokeDashoffset animate;
 * the shine is a masked gradient rect that translates, never a filter.
 */

// ── geometry, baked once at module load ─────────────────────────────────────

const CARD = { x: 90, y: 54, w: 580, h: 352 } as const;
const CX = CARD.x + CARD.w / 2; // 380 — the flip axis
const CY = CARD.y + CARD.h / 2; // 230

const INNER = { x: CARD.x + 16, y: CARD.y + 16, w: CARD.w - 32, h: CARD.h - 32 };
const WASH = { x: CARD.x + 10, y: CARD.y + 10, w: CARD.w - 20, h: CARD.h - 20 };

const CHIP = { x: 134, y: 158, w: 86, h: 62 };
const SEAL = { cx: 578, cy: 336, r: 44 };

/** Drafting corner marks: the slot the card is about to land in. */
const MARKS = (() => {
  const a = 30;
  const o = 20;
  const l = CARD.x - o;
  const r = CARD.x + CARD.w + o;
  const tp = CARD.y - o;
  const b = CARD.y + CARD.h + o;
  return [
    wobbleLine(l, tp, l + a, tp, 201, 0.7),
    wobbleLine(l, tp, l, tp + a, 202, 0.7),
    wobbleLine(r, tp, r - a, tp, 203, 0.7),
    wobbleLine(r, tp, r, tp + a, 204, 0.7),
    wobbleLine(r, b, r - a, b, 205, 0.7),
    wobbleLine(r, b, r, b - a, 206, 0.7),
    wobbleLine(l, b, l + a, b, 207, 0.7),
    wobbleLine(l, b, l, b - a, 208, 0.7),
  ].join(" ");
})();

/** Four groups of four embossed dashes — a card number without inventing one. */
const NUMBER_ROW = (() => {
  const parts: string[] = [];
  let x = 134;
  for (let g = 0; g < 4; g++) {
    for (let d = 0; d < 4; d++) {
      parts.push(wobbleLine(x, 292, x + 13, 292, 301 + g * 7 + d, 0.45));
      x += 20;
    }
    x += 16;
  }
  return parts.join(" ");
})();

/** Where a member signs. Two pencil rules, never a fake name. */
const NAME_LINES = [
  wobbleLine(134, 340, 344, 340, 411, 0.9),
  wobbleLine(134, 368, 274, 368, 412, 0.9),
].join(" ");

const CHIP_LINES = [
  wobbleLine(CHIP.x, CHIP.y + 21, CHIP.x + CHIP.w, CHIP.y + 21, 421, 0.5),
  wobbleLine(CHIP.x, CHIP.y + 42, CHIP.x + CHIP.w, CHIP.y + 42, 422, 0.5),
  wobbleLine(CHIP.x + 31, CHIP.y, CHIP.x + 31, CHIP.y + CHIP.h, 423, 0.5),
].join(" ");

/** Milled rim of the seal — twelve short radial ticks. */
const SEAL_RIM = (() => {
  const parts: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    parts.push(
      wobbleLine(
        SEAL.cx + Math.cos(a) * 30,
        SEAL.cy + Math.sin(a) * 30,
        SEAL.cx + Math.cos(a) * 37,
        SEAL.cy + Math.sin(a) * 37,
        501 + i,
        0.35,
      ),
    );
  }
  return parts.join(" ");
})();

/**
 * The shine, as three frozen keyframe lists.
 *
 * Module constants on purpose: an inline array is a new reference on every
 * render, and motion restarts a keyframe animation whose target changed
 * identity — which would re-fire the sweep on an unrelated re-render.
 */
const SHINE_X = [0, 980];
const SHINE_O = [0, 0.55, 0.55, 0];
const SHINE_T = [0, 0.14, 0.7, 1];

// ── a line of card face text ────────────────────────────────────────────────

function Ink({
  x,
  y,
  text,
  on,
  delay = 0,
  size = 24,
  color = C.ink,
  anchor = "start",
  font = "font-sans",
  tracking,
  weight,
}: {
  x: number;
  y: number;
  text: string;
  on: boolean;
  delay?: number;
  size?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  font?: string;
  tracking?: string;
  weight?: number;
}) {
  return (
    <motion.text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      textAnchor={anchor}
      letterSpacing={tracking}
      fontWeight={weight}
      className={font}
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 7 }}
      transition={{ duration: 0.34, ease: EASE, delay: on ? delay : 0 }}
    >
      {text}
    </motion.text>
  );
}

// ── the diagram ─────────────────────────────────────────────────────────────

export function VIPCard({ step }: { step: number }) {
  const lang = useLang();
  const uid = useId().replace(/:/g, "");
  const shineId = `vip-shine-${uid}`;
  const clipId = `vip-clip-${uid}`;

  const on = step >= 1;

  const geo = useMemo(
    () => ({
      edge: wobbleRect(CARD.x, CARD.y, CARD.w, CARD.h, 61, 1.8, 3),
      inner: wobbleRect(INNER.x, INNER.y, INNER.w, INNER.h, 77, 1, 1.5),
      chip: wobbleRect(CHIP.x, CHIP.y, CHIP.w, CHIP.h, 91, 0.9, 1.5),
    }),
    [],
  );

  return (
    <svg viewBox="0 0 760 470" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.gold} stopOpacity={0} />
          <stop offset="0.5" stopColor={C.gold} stopOpacity={1} />
          <stop offset="1" stopColor={C.gold} stopOpacity={0} />
        </linearGradient>
        {/* Inset by 3 px so the gleam never spills past the pencil wobble. */}
        <clipPath id={clipId}>
          <rect x={CARD.x + 3} y={CARD.y + 3} width={CARD.w - 6} height={CARD.h - 6} rx={10} />
        </clipPath>
      </defs>

      <SketchPath d={MARKS} on stroke={C.ash} width={1.5} opacity={0.5} duration={0.8} />

      {/* The slot, before the card is in it. */}
      <motion.path
        d={geo.edge}
        fill="none"
        stroke={C.ash}
        strokeWidth={1.8}
        strokeDasharray="11 10"
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: on ? 0 : 0.55 }}
        transition={{ duration: 0.35, ease: EASE }}
      />

      {/*
        The flip. Motion writes `transform-box: fill-box` on every animated SVG
        node, so the rotation axis is the group's own bounding-box centre and a
        pixel `transform-origin` would be measured from the wrong corner. The
        anchor rect below is symmetric about (CX, CY), which pins that centre to
        the middle of the card no matter what else the group ends up containing.
      */}
      <motion.g
        initial={false}
        animate={{ rotateY: on ? 0 : -80, opacity: on ? 1 : 0, transformPerspective: 1100 }}
        transition={{
          rotateY: { duration: 0.8, ease: EASE },
          opacity: { duration: on ? 0.3 : 0.24 },
        }}
      >
        <rect x={CX - 340} y={CY - 220} width={680} height={440} fill="none" />

        <Hatch
          x={WASH.x}
          y={WASH.y}
          w={WASH.w}
          h={WASH.h}
          gap={22}
          angle={45}
          seed={131}
          on={on}
          stroke={C.gold}
          width={1.4}
          opacity={0.18}
          delay={0.28}
          duration={0.9}
        />

        <SketchPath d={geo.edge} on={on} stroke={C.gold} width={3.2} duration={0.85} />
        <SketchPath
          d={geo.inner}
          on={on}
          stroke={C.ink}
          width={1.4}
          opacity={0.32}
          delay={0.4}
          duration={0.6}
        />

        {/* The header is two elements on one baseline row, so their widths have
            to be budgeted against each other: at 20/0.18em the issuer ran to
            415 and the 54 px product name started at 411. Sized so the pair
            leaves ~65 px of air, which also absorbs a longer issuer string. */}
        <Ink
          x={134}
          y={116}
          text={t(S.brand.company, lang)}
          on={on}
          delay={0.5}
          size={18}
          color={C.ash}
          font="font-mono"
          tracking="0.15em"
        />
        <Ink
          x={626}
          y={132}
          text={t(S.chapters.c4.title, lang)}
          on={on}
          delay={0.58}
          size={46}
          anchor="end"
          font="font-display"
          weight={500}
        />

        {/* Chip */}
        <SketchPath d={geo.chip} on={on} stroke={C.gold} width={2.2} delay={0.62} duration={0.4} />
        <Hatch
          x={CHIP.x + 2}
          y={CHIP.y + 2}
          w={CHIP.w - 4}
          h={CHIP.h - 4}
          gap={8}
          angle={45}
          seed={177}
          on={on}
          stroke={C.gold}
          width={1.2}
          opacity={0.4}
          delay={0.74}
          duration={0.45}
        />
        <SketchPath
          d={CHIP_LINES}
          on={on}
          stroke={C.gold}
          width={1.5}
          opacity={0.8}
          delay={0.7}
          duration={0.35}
        />

        <SketchPath
          d={NUMBER_ROW}
          on={on}
          stroke={C.ink}
          width={3}
          opacity={0.6}
          delay={0.82}
          duration={0.55}
        />
        <SketchPath
          d={NAME_LINES}
          on={on}
          stroke={C.ash}
          width={1.6}
          opacity={0.8}
          delay={0.92}
          duration={0.45}
        />

        {/* Club seal */}
        <SketchEllipse
          cx={SEAL.cx}
          cy={SEAL.cy}
          rx={SEAL.r}
          seed={211}
          on={on}
          stroke={C.gold}
          width={2.4}
          delay={0.9}
          duration={0.5}
        />
        <SketchEllipse
          cx={SEAL.cx}
          cy={SEAL.cy}
          rx={30}
          seed={213}
          on={on}
          stroke={C.gold}
          width={1.6}
          opacity={0.85}
          delay={1.02}
          duration={0.4}
        />
        <Hatch
          x={SEAL.cx - 22}
          y={SEAL.cy - 22}
          w={44}
          h={44}
          gap={9}
          angle={45}
          seed={223}
          on={on}
          stroke={C.gold}
          width={1.3}
          opacity={0.45}
          delay={1.12}
          duration={0.4}
        />
        <SketchPath
          d={SEAL_RIM}
          on={on}
          stroke={C.gold}
          width={1.4}
          opacity={0.7}
          delay={1.08}
          duration={0.4}
        />
      </motion.g>

      {/*
        The shine. A gradient rect inside a static rotated group, moved by
        translate alone — no filter, no width animation, and deliberately kept
        outside the flip group so its off-card geometry cannot drag the flip
        axis away from the middle of the card.
      */}
      <g clipPath={`url(#${clipId})`}>
        <g transform={`rotate(-16 ${CX} ${CY})`}>
          <motion.rect
            x={CARD.x - 260}
            y={CARD.y - 130}
            width={110}
            height={CARD.h + 260}
            fill={`url(#${shineId})`}
            initial={false}
            animate={on ? { x: SHINE_X, opacity: SHINE_O } : { x: 0, opacity: 0 }}
            transition={
              on
                ? { duration: 1.05, delay: 1.05, times: SHINE_T, ease: "linear" }
                : { duration: 0.2 }
            }
          />
        </g>
      </g>
    </svg>
  );
}

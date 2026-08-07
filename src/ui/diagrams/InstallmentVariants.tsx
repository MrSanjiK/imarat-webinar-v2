"use client";

import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { C, SketchLine, hatch } from "@/ui/sketch";

/**
 * InstallmentVariants — the hinge between the slide title and the two payment
 * cards below it. A 1600 × 64 band has room for exactly one idea, so it carries
 * one: the slide splits in two, the right half is the gold one.
 *
 * Nothing here restates the cards. They already print the down payments, the
 * terms and the discount chip at full size 40 px underneath; a second, smaller
 * copy of the same numbers in a 64 px strip would only compete with them.
 *
 * Step choreography — the slide has four states.
 *   0 — empty. The rule cannot draw itself on mount (`initial={false}` snaps),
 *       so it waits for a step rather than appearing already finished.
 *   1 — the rule draws left to right across the full width, the gutter serif
 *       lands at the midpoint, and variant 1's territory is claimed in ink:
 *       a heavier overdraw, two end serifs, a low ink hatch beneath.
 *   2 — variant 2's territory claims the right half in gold, matching the gold
 *       border of the card below it, and its label carries the discount.
 *   3 — unchanged. The bonus line lands elsewhere on the slide; at this height
 *       one more mark would read as clutter.
 *
 * Territory edges are the cards' own edges. The slot starts at stage x=160 and
 * the cards sit at 160 and 1000, both 760 wide, so in band coordinates they are
 * 0–760 and 840–1600; the marks stop 4 px short of each so the pencil does not
 * look like it is trying to be a border.
 */

const RULE_Y = 36;
const LEFT: [number, number] = [0, 756];
const RIGHT: [number, number] = [844, 1600];
const GUTTER = 800;

const SERIF_TOP = 28;
const SERIF_BOTTOM = 44;
const HATCH_Y = 40;
const HATCH_H = 15;

/** 45° hatch revealed by translating an oversized mask.
 *
 *  The shared `Hatch` scales a clip rect about a pixel `transform-origin`, and
 *  motion replaces that origin with `50% 50%` on SVG as soon as a transform
 *  exists — the wipe then opens from the middle of the band rather than from
 *  its left edge, which at this width is very visible. A translate cannot lose
 *  an origin it never had. */
function HatchBand({
  x,
  w,
  on,
  stroke,
  opacity,
  seed,
  delay,
}: {
  x: number;
  w: number;
  on: boolean;
  stroke: string;
  opacity: number;
  seed: number;
  delay: number;
}) {
  const uid = useId().replace(/:/g, "");
  const boxId = `iv-box-${uid}`;
  const wipeId = `iv-wipe-${uid}`;
  const d = useMemo(() => hatch(x, HATCH_Y, w, HATCH_H, 13, 45, seed), [x, w, seed]);

  return (
    <g>
      <defs>
        <clipPath id={boxId}>
          <rect x={x} y={HATCH_Y} width={w} height={HATCH_H} />
        </clipPath>
        <clipPath id={wipeId}>
          <motion.rect
            x={x}
            y={HATCH_Y - 3}
            width={w}
            height={HATCH_H + 6}
            initial={false}
            animate={{ x: on ? 0 : -w - 2 }}
            transition={{ duration: 0.85, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${boxId})`}>
        <g clipPath={`url(#${wipeId})`}>
          <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} opacity={opacity} />
        </g>
      </g>
    </g>
  );
}

/** One variant's stretch of the rule: overdraw, two end serifs, hatch below. */
function Territory({
  span,
  on,
  color,
  hatchOpacity,
  seed,
  delay,
}: {
  span: [number, number];
  on: boolean;
  color: string;
  hatchOpacity: number;
  seed: number;
  delay: number;
}) {
  const [x0, x1] = span;
  // Inset so the mark reads as a pencil claim, not as a box around the card.
  const a = x0 + 4;
  const b = x1 - 4;

  return (
    <g>
      <SketchLine
        x1={a}
        y1={RULE_Y}
        x2={b}
        y2={RULE_Y}
        seed={seed}
        amp={1.2}
        on={on}
        stroke={color}
        width={3}
        delay={delay}
        duration={0.6}
      />
      <SketchLine
        x1={a}
        y1={SERIF_TOP}
        x2={a}
        y2={SERIF_BOTTOM}
        seed={seed + 3}
        amp={0.7}
        on={on}
        stroke={color}
        width={2.2}
        delay={delay + 0.12}
        duration={0.22}
      />
      <SketchLine
        x1={b}
        y1={SERIF_TOP}
        x2={b}
        y2={SERIF_BOTTOM}
        seed={seed + 6}
        amp={0.7}
        on={on}
        stroke={color}
        width={2.2}
        delay={delay + 0.42}
        duration={0.22}
      />
      <HatchBand
        x={a}
        w={b - a}
        on={on}
        stroke={color}
        opacity={hatchOpacity}
        seed={seed + 9}
        delay={delay + 0.14}
      />
    </g>
  );
}

/** Mono caps, same voice as the labels printed on the cards below. */
function Tag({
  x,
  text,
  on,
  color,
  anchor,
  delay,
}: {
  x: number;
  text: string;
  on: boolean;
  color: string;
  anchor: "start" | "end";
  delay: number;
}) {
  return (
    <motion.text
      x={x}
      y={20}
      fill={color}
      fontSize={20}
      textAnchor={anchor}
      className="font-mono"
      style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 5 }}
      transition={{ duration: 0.32, ease: EASE, delay: on ? delay : 0 }}
    >
      {text}
    </motion.text>
  );
}

export function InstallmentVariants({ step }: { step: number }) {
  const lang = useLang();
  const o = S.offer.installments;

  const one = step >= 1;
  const two = step >= 2;

  const discount = `−${Math.round(N.plans.b.discount * 100)}%`;

  return (
    <svg viewBox="0 0 1600 64" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* The rule itself — one stroke, left to right, under both variants. */}
      {/* Inset by the cap radius: a round cap sitting exactly on the viewBox
          edge gets sliced in half by the viewport. */}
      <SketchLine
        x1={2}
        y1={RULE_Y}
        x2={1598}
        y2={RULE_Y}
        seed={17}
        amp={1.4}
        on={one}
        stroke={C.ink}
        width={2}
        opacity={0.45}
        duration={0.95}
      />

      {/* Gutter serif: the split, announced before either card has landed. */}
      <SketchLine
        x1={GUTTER}
        y1={16}
        x2={GUTTER}
        y2={52}
        seed={29}
        amp={0.8}
        on={one}
        stroke={C.ink}
        width={1.5}
        opacity={0.24}
        delay={0.62}
        duration={0.3}
      />

      <Territory span={LEFT} on={one} color={C.ink} hatchOpacity={0.15} seed={41} delay={0.5} />
      <Territory span={RIGHT} on={two} color={C.gold} hatchOpacity={0.32} seed={67} delay={0.1} />

      <Tag x={4} text={t(o.v1, lang)} on={one} color={C.ash} anchor="start" delay={0.72} />
      <Tag
        x={1596}
        text={`${t(o.v2, lang)} · ${discount}`}
        on={two}
        color={C.gold}
        anchor="end"
        delay={0.32}
      />
    </svg>
  );
}

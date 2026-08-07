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
  SketchLine,
  SketchPath,
  rng,
  smooth,
  wobbleLine,
  wobblePoly,
  wobbleRect,
  type Pt,
} from "@/ui/sketch";

/**
 * BearingWallPlan — chapter 1 (dark), slide 06 "Yuk koʻtaruvchi devorga tegib
 * boʻlmaydi". Box 860 × 600.
 *
 * An apartment floor in plan view. The three bays are drawn to scale off
 * N.materials.bearingWallSpacing: 3 m, 4.5 m (the midpoint) and 6 m, so the
 * drawing itself is the claim "every 3–6 metres".
 *
 *   step 0 — empty sheet.
 *   step 1 — the envelope, the cross-walls and the partitions draw in, all in
 *            neutral pencil; doors get their swings. Nothing is special yet.
 *   step 2 — the load-bearing walls light up: ember over-draw plus 45° poché,
 *            and the dimension line underneath measures the three bays.
 *   step 3 — the middle cross-wall is gone. It fades to a dashed ghost, the
 *            slab above it cracks, the two walls that inherit the load are
 *            over-drawn hotter and arrowed, the freed floor area is hatched in
 *            ember, and a second dimension line reports the new 10,5 m span.
 *
 * Pure function of `step`. Draw-ons are gated by monotonic `step >= n` booleans;
 * the one thing that goes away (the demolished wall) does so through a group
 * opacity, which is a pure function of `step` and reverses exactly.
 */

// ── geometry ─────────────────────────────────────────────────────────────────

type Rect = { x: number; y: number; w: number; h: number };

const X0 = 78;
const Y0 = 100;
const PW = 704;
const PH = 340;
const Y1 = Y0 + PH; // 440
const T = 16; // load-bearing wall thickness, in plan

/** 3 m, 4.5 m, 6 m — the band's floor, midpoint and ceiling, left to right. */
const SPAN = N.materials.bearingWallSpacing;
const BAYS = [SPAN[0], (SPAN[0] + SPAN[1]) / 2, SPAN[1]] as const;
const METRES = BAYS[0] + BAYS[1] + BAYS[2];
const PPM = PW / METRES;

/** Cross-wall centrelines. */
const XS = [X0, X0 + BAYS[0] * PPM, X0 + (BAYS[0] + BAYS[1]) * PPM, X0 + PW];

/** The span left over once the middle cross-wall is removed: 4,5 + 6 = 10,5 m. */
const NEW_SPAN = BAYS[1] + BAYS[2];

const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

const WALLS: Rect[] = [
  r(X0 - T / 2, Y0 - T / 2, PW + T, T), // 0 · north facade
  r(X0 - T / 2, Y1 - T / 2, PW + T, T), // 1 · south facade
  r(X0 - T / 2, Y0 - T / 2, T, PH + T), // 2 · west gable
  r(XS[3] - T / 2, Y0 - T / 2, T, PH + T), // 3 · east gable — inherits load
  r(XS[1] - T / 2, Y0 - T / 2, T, PH + T), // 4 · cross-wall — inherits load
  r(XS[2] - T / 2, Y0 - T / 2, T, PH + T), // 5 · cross-wall — the one that goes
];
const REMOVED = 5;
const INHERIT = [3, 4];

/** Partitions, as centreline runs with the door openings already cut out. */
const PARTITIONS: Array<[number, number, number, number]> = [
  [86, 232, 150, 232],
  [190, 232, 226, 232],
  [352, 100, 352, 188],
  [352, 222, 352, 300],
  [242, 300, 300, 300],
  [340, 300, 461, 300],
  [477, 246, 560, 246],
  [600, 246, 774, 246],
  [660, 246, 660, 330],
  [660, 372, 660, 432],
  [572, 100, 572, 150],
  [572, 186, 572, 246],
];

/** Door swings: centre, radius, and the quarter the leaf sweeps through. */
const DOORS: Array<{ cx: number; cy: number; rad: number; a0: number; a1: number; lx: number; ly: number }> = [
  { cx: 150, cy: 232, rad: 40, a0: 0, a1: -Math.PI / 2, lx: 150, ly: 192 },
  { cx: 340, cy: 300, rad: 40, a0: Math.PI, a1: Math.PI * 1.5, lx: 340, ly: 260 },
  { cx: 660, cy: 330, rad: 42, a0: Math.PI / 2, a1: Math.PI, lx: 618, ly: 330 },
];

/** Slab cracks radiating out of the wall that was taken away. */
const CRACKS: Pt[][] = [
  [[469, 92], [450, 126], [460, 164], [436, 204], [444, 244], [416, 288]],
  [[469, 448], [493, 412], [483, 372], [509, 330], [499, 286], [526, 240]],
  [[469, 268], [514, 258], [556, 276], [602, 264], [648, 280], [698, 268]],
];

/** Floor area that loses its support: cross-wall 1 through to the east gable. */
const FREED: Rect = r(XS[1] + T / 2, Y0, XS[3] - XS[1] - T, PH);

const DIM_Y = 494;
const DIM2_Y = 540;

const LINE = "rgba(244,241,234,0.86)";
const PART = "rgba(244,241,234,0.45)";
const DIM = "rgba(244,241,234,0.52)";
const FAINT = "rgba(244,241,234,0.26)";

const rectD = (b: Rect) => `M ${b.x} ${b.y} H ${b.x + b.w} V ${b.y + b.h} H ${b.x} Z`;

/**
 * 45° hatching in the deck's "\" direction, clipped analytically to the box
 * instead of generated across its diagonal. Same grammar as the sketch
 * `hatch()` — same angle, same wobbled strokes, same clip-wipe reveal — but for
 * a 720 × 16 wall it emits 162 curves instead of 2 900. That matters here
 * because these paths sit under an *animated* clip and are re-rasterised on
 * every frame of the wipe; six walls at the primitive's cost would not hold 60.
 */
function hatch45(b: Rect, gap: number, seed: number): string {
  const out: string[] = [];
  let i = 0;
  for (let sx = b.x - b.h; sx <= b.x + b.w; sx += gap, i++) {
    const s0 = Math.max(0, b.x - sx);
    const s1 = Math.min(b.h, b.x + b.w - sx);
    if (s1 - s0 < 1.5) continue;
    out.push(wobbleLine(sx + s0, b.y + s0, sx + s1, b.y + s1, seed + i * 13, 0.7));
  }
  return out.join(" ");
}

/** A hand-drawn quarter circle: jitter the samples once, then smooth through. */
function arcD(cx: number, cy: number, rad: number, a0: number, a1: number, seed: number): string {
  const rnd = rng(seed * 2654435761);
  const n = 12;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    const j = (rnd() - 0.5) * 2.2;
    pts.push([cx + Math.cos(a) * (rad + j), cy + Math.sin(a) * (rad + j)]);
  }
  return smooth(pts);
}

// ── pieces ───────────────────────────────────────────────────────────────────

/**
 * Hatch revealed by *translating* an oversized mask path. Motion drops pixel
 * `transformOrigin` on SVG children, so a `scaleX` wipe would open from the
 * middle of the box; a translation has no origin to lose.
 */
function HatchWipe({
  box,
  on,
  gap,
  seed,
  stroke,
  width = 1.3,
  opacity = 0.5,
  delay = 0,
  duration = 0.7,
}: {
  box: Rect;
  on: boolean;
  gap: number;
  seed: number;
  stroke: string;
  width?: number;
  opacity?: number;
  delay?: number;
  duration?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const lines = useMemo(() => hatch45(box, gap, seed), [box, gap, seed]);

  const pad = 12;
  const ww = box.w + pad * 2;
  const wipeD = `M ${box.x - pad} ${box.y - pad} H ${box.x + box.w + pad} V ${box.y + box.h + pad} H ${
    box.x - pad
  } Z`;

  return (
    <g>
      <defs>
        <clipPath id={`box-${uid}`}>
          <path d={rectD(box)} />
        </clipPath>
        <clipPath id={`wipe-${uid}`}>
          <motion.path
            d={wipeD}
            initial={false}
            animate={{ x: on ? 0 : -ww }}
            transition={{ duration, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#box-${uid})`}>
        <g clipPath={`url(#wipe-${uid})`}>
          <path d={lines} fill="none" stroke={stroke} strokeWidth={width} opacity={opacity} />
        </g>
      </g>
    </g>
  );
}

/** One load-bearing wall: neutral outline at step 1, ember poché at step 2. */
function BearingWall({
  box,
  d,
  drawn,
  lit,
  hot,
  seed,
  delay,
}: {
  box: Rect;
  d: string;
  drawn: boolean;
  lit: boolean;
  hot: boolean;
  seed: number;
  delay: number;
}) {
  return (
    <g>
      <HatchWipe
        box={box}
        on={lit}
        gap={9}
        seed={seed + 400}
        stroke={C.ember}
        width={1.3}
        opacity={0.62}
        delay={delay + 0.14}
        duration={0.75}
      />
      <SketchPath d={d} on={drawn} stroke={LINE} width={2} delay={delay} duration={0.6} />
      <SketchPath d={d} on={lit} stroke={C.ember} width={2.8} delay={delay} duration={0.55} />
      {/* Step 3: the two walls that pick up the orphaned load get re-inked. */}
      <SketchPath d={d} on={hot} stroke={C.ember} width={4.2} delay={0.35} duration={0.5} />
    </g>
  );
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function BearingWallPlan({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.bearing;

  const drawn = step >= 1;
  const lit = step >= 2;
  const removed = step >= 3;

  // Every pencil offset is drawn once, here, and baked into the `d` strings.
  const geo = useMemo(
    () => ({
      walls: WALLS.map((b, i) => wobbleRect(b.x, b.y, b.w, b.h, 120 + i * 17, 1.1, 1.6)),
      partitions: PARTITIONS.map(([x1, y1, x2, y2], i) =>
        wobbleLine(x1, y1, x2, y2, 300 + i * 11, 1.1),
      ),
      doors: DOORS.map((dr, i) => ({
        swing: arcD(dr.cx, dr.cy, dr.rad, dr.a0, dr.a1, 500 + i * 23),
        leaf: wobbleLine(dr.cx, dr.cy, dr.lx, dr.ly, 560 + i * 23, 0.8),
      })),
      cracks: CRACKS.map((c, i) => wobblePoly(c, 700 + i * 31, 1.5)),
    }),
    [],
  );

  return (
    <svg viewBox="0 0 860 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* ── step 1 · the plan ─────────────────────────────────────────────── */}

      {geo.partitions.map((d, i) => (
        <SketchPath
          key={`p${i}`}
          d={d}
          on={drawn}
          stroke={PART}
          width={5}
          cap="butt"
          delay={0.45 + i * 0.035}
          duration={0.35}
        />
      ))}
      {geo.doors.map((dr, i) => (
        <g key={`d${i}`}>
          <SketchPath d={dr.leaf} on={drawn} stroke={PART} width={2.2} delay={0.9 + i * 0.06} duration={0.25} />
          <SketchPath
            d={dr.swing}
            on={drawn}
            stroke={FAINT}
            width={1.4}
            delay={0.98 + i * 0.06}
            duration={0.4}
          />
        </g>
      ))}

      {/* ── step 3 · the floor area that just lost its support ────────────── */}

      <HatchWipe
        box={FREED}
        on={removed}
        gap={30}
        seed={880}
        stroke={C.ember}
        width={1.4}
        opacity={0.16}
        delay={0.45}
        duration={1}
      />

      {/* ── steps 1–2 · the structure ─────────────────────────────────────── */}

      {WALLS.map((b, i) =>
        i === REMOVED ? null : (
          <BearingWall
            key={`w${i}`}
            box={b}
            d={geo.walls[i]}
            drawn={drawn}
            lit={lit}
            hot={removed && INHERIT.includes(i)}
            seed={120 + i * 17}
            delay={i * 0.07}
          />
        ),
      )}

      {/* The demolished wall. Drawn exactly like its neighbours, then faded out
          as a group at step 3 — a pure function of `step`, reversible. */}
      <motion.g
        initial={false}
        animate={{ opacity: removed ? 0 : 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: removed ? 0.05 : 0.1 }}
      >
        <BearingWall
          box={WALLS[REMOVED]}
          d={geo.walls[REMOVED]}
          drawn={drawn}
          lit={lit}
          hot={false}
          seed={120 + REMOVED * 17}
          delay={REMOVED * 0.07}
        />
      </motion.g>

      {/* …and the dashed ghost it leaves behind. */}
      <motion.path
        d={geo.walls[REMOVED]}
        fill="none"
        stroke={C.ember}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="11 9"
        initial={false}
        animate={{ opacity: removed ? 0.55 : 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: removed ? 0.35 : 0 }}
      />

      {/* Cracks in the slab over the new span. */}
      {geo.cracks.map((d, i) => (
        <SketchPath
          key={`c${i}`}
          d={d}
          on={removed}
          stroke={C.ember}
          width={2}
          opacity={0.85}
          delay={0.7 + i * 0.14}
          duration={0.6}
        />
      ))}

      {/* Load pushing sideways into the two walls that now carry it. */}
      <SketchArrow
        x1={330}
        y1={132}
        x2={252}
        y2={132}
        seed={911}
        head={14}
        on={removed}
        stroke={C.ember}
        width={2.4}
        delay={1.1}
        duration={0.4}
      />
      <SketchArrow
        x1={690}
        y1={132}
        x2={766}
        y2={132}
        seed={923}
        head={14}
        on={removed}
        stroke={C.ember}
        width={2.4}
        delay={1.2}
        duration={0.4}
      />

      {/* ── step 2 · the bay dimensions ───────────────────────────────────── */}

      {XS.map((x, i) => (
        <SketchLine
          key={`e${i}`}
          x1={x}
          y1={452}
          x2={x}
          y2={502}
          seed={620 + i}
          amp={0.9}
          on={lit}
          stroke={FAINT}
          width={1.2}
          delay={0.2 + i * 0.04}
          duration={0.3}
        />
      ))}
      <SketchLine
        x1={XS[0]}
        y1={DIM_Y}
        x2={XS[3]}
        y2={DIM_Y}
        seed={651}
        amp={1}
        on={lit}
        stroke={DIM}
        width={1.5}
        delay={0.3}
        duration={0.8}
      />
      {XS.map((x, i) => (
        <SketchLine
          key={`t${i}`}
          x1={x - 7}
          y1={DIM_Y + 7}
          x2={x + 7}
          y2={DIM_Y - 7}
          seed={670 + i}
          amp={0.6}
          on={lit}
          stroke={DIM}
          width={1.6}
          delay={0.5 + i * 0.05}
          duration={0.2}
        />
      ))}
      {BAYS.map((m, i) => (
        <motion.text
          key={`bl${i}`}
          x={(XS[i] + XS[i + 1]) / 2}
          y={DIM_Y - 13}
          fill={DIM}
          fontSize={24}
          textAnchor="middle"
          className="font-mono tnum"
          style={{ letterSpacing: "0.06em" }}
          initial={false}
          animate={{ opacity: lit ? 1 : 0 }}
          transition={{ duration: 0.3, delay: lit ? 0.6 + i * 0.08 : 0 }}
        >
          {`${num(m)} ${t(q.unit, lang)}`}
        </motion.text>
      ))}

      {/* ── step 3 · the span that replaced them ──────────────────────────── */}

      <SketchLine
        x1={XS[1]}
        y1={502}
        x2={XS[1]}
        y2={548}
        seed={701}
        amp={0.9}
        on={removed}
        stroke="rgba(199,80,47,0.5)"
        width={1.2}
        delay={0.9}
        duration={0.25}
      />
      <SketchLine
        x1={XS[3]}
        y1={502}
        x2={XS[3]}
        y2={548}
        seed={702}
        amp={0.9}
        on={removed}
        stroke="rgba(199,80,47,0.5)"
        width={1.2}
        delay={0.95}
        duration={0.25}
      />
      <SketchLine
        x1={XS[1]}
        y1={DIM2_Y}
        x2={XS[3]}
        y2={DIM2_Y}
        seed={711}
        amp={1}
        on={removed}
        stroke={C.ember}
        width={2}
        delay={1}
        duration={0.7}
      />
      <motion.text
        x={(XS[1] + XS[3]) / 2}
        y={DIM2_Y - 13}
        fill={C.ember}
        fontSize={28}
        textAnchor="middle"
        className="font-mono tnum"
        style={{ letterSpacing: "0.06em" }}
        initial={false}
        animate={{ opacity: removed ? 1 : 0 }}
        transition={{ duration: 0.3, delay: removed ? 1.3 : 0 }}
      >
        {`${num(NEW_SPAN)} ${t(q.unit, lang)}`}
      </motion.text>

      {/* ── step 3 · what happened, in words ──────────────────────────────── */}

      <Annotation
        x={318}
        y={68}
        text={t(q.removedLabel, lang)}
        on={removed}
        delay={0.5}
        color={C.ember}
        size={29}
        anchor="end"
        seed={77}
        leader={{ x: XS[2] - 12, y: 86 }}
      />
      <Annotation
        x={X0}
        y={580}
        text={t(q.loadShift, lang)}
        on={removed}
        delay={1.45}
        color="rgba(244,241,234,0.8)"
        size={28}
        anchor="start"
      />
    </svg>
  );
}

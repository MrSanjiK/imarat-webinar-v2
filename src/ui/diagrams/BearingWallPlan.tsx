"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { num, t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * BearingWallPlan — chapter 1 (dark), slide 06 "Yuk koʻtaruvchi devorga tegib
 * boʻlmaydi". Slot 860 × 600.
 *
 * v2 "IMARAT Vivid": flat vector. Walls are solid poché arriving by clip-rect
 * wipe; outlines draw with pathLength + strokeDashoffset. No pencil, no filter.
 *
 * The three bays are drawn to scale off N.materials.bearingWallSpacing — 3 m,
 * 4.5 m (the midpoint) and 6 m — so the drawing itself is the claim.
 *
 * Step map (slide q-bearing has 4 steps, 0…3)
 *   0 — empty.
 *   1 — the apartment plan draws: envelope, two cross-walls, partitions and
 *       door swings, all in neutral white. Nothing is special yet.
 *   2 — the load-bearing walls are INDICATED: emerald poché wipes into each
 *       one, the outline is over-drawn emerald, and the dimension line under
 *       the plan measures the three bays.
 *   3 — the middle cross-wall is REMOVED (the ember moment): it fades to a
 *       dashed ember ghost, the freed floor area fills ember, cracks radiate
 *       through the slab, and the load RE-ROUTES — the two neighbour walls go
 *       ember-hot and their load arrows thicken and extend outward. A second
 *       dimension line reports the new 10,5 m span.
 *
 * Pure function of `step`. The one thing that goes away does so through a group
 * opacity keyed on `step`, which reverses exactly.
 */

// ── geometry ─────────────────────────────────────────────────────────────────

type Rect = { x: number; y: number; w: number; h: number };

const X0 = 78;
const Y0 = 100;
const PW = 704;
const PH = 340;
const Y1 = Y0 + PH; // 440
const T = 18; // load-bearing wall thickness in plan

/** 3 m, 4.5 m, 6 m — the band's floor, midpoint and ceiling, left to right. */
const SPAN = N.materials.bearingWallSpacing;
const BAYS = [SPAN[0], (SPAN[0] + SPAN[1]) / 2, SPAN[1]] as const;
const METRES = BAYS[0] + BAYS[1] + BAYS[2];
const PPM = PW / METRES;

/** Cross-wall centrelines. */
const XS = [X0, X0 + BAYS[0] * PPM, X0 + (BAYS[0] + BAYS[1]) * PPM, X0 + PW];

/** The span left once the middle cross-wall goes: 4,5 + 6 = 10,5 m. */
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
const DOORS = [
  { cx: 150, cy: 232, rad: 40, a0: 0, a1: -Math.PI / 2, lx: 150, ly: 192 },
  { cx: 340, cy: 300, rad: 40, a0: Math.PI, a1: Math.PI * 1.5, lx: 340, ly: 260 },
  { cx: 660, cy: 330, rad: 42, a0: Math.PI / 2, a1: Math.PI, lx: 618, ly: 330 },
];

/** Slab cracks radiating out of the wall that was taken away. */
const CRACKS: Array<Array<[number, number]>> = [
  [[469, 92], [450, 126], [460, 164], [436, 204], [444, 244], [416, 288]],
  [[469, 448], [493, 412], [483, 372], [509, 330], [499, 286], [526, 240]],
  [[469, 268], [514, 258], [556, 276], [602, 264], [648, 280], [698, 268]],
];

/** The floor area that loses its support: cross-wall 1 through to the east gable. */
const FREED: Rect = r(XS[1] + T / 2, Y0, XS[3] - XS[1] - T, PH);

const DIM_Y = 496;
const DIM2_Y = 542;

const BASE = "rgba(244,251,244,0.9)";
const DIM = "rgba(244,251,244,0.35)";
const MID = "rgba(244,251,244,0.6)";

const rectD = (b: Rect) => `M ${b.x} ${b.y} H ${b.x + b.w} V ${b.y + b.h} H ${b.x} Z`;
const poly = (p: Array<[number, number]>) =>
  p.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

/** A flat quarter-circle arc, sampled once at module load. */
function arcD(cx: number, cy: number, rad: number, a0: number, a1: number): string {
  const n = 10;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push([
      Math.round((cx + Math.cos(a) * rad) * 10) / 10,
      Math.round((cy + Math.sin(a) * rad) * 10) / 10,
    ]);
  }
  return poly(pts);
}

const DOOR_GEO = DOORS.map((d) => ({
  swing: arcD(d.cx, d.cy, d.rad, d.a0, d.a1),
  leaf: `M ${d.cx} ${d.cy} L ${d.lx} ${d.ly}`,
}));

// ── kit ──────────────────────────────────────────────────────────────────────

function Draw({
  d,
  on,
  stroke,
  w = 3,
  delay = 0,
  dur = 0.6,
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

/** Solid poché arriving by sliding a clip rect across the box. */
function FillWipe({
  box,
  on,
  fill,
  delay = 0,
  dur = 0.7,
  from = "left",
}: {
  box: Rect;
  on: boolean;
  fill: string;
  delay?: number;
  dur?: number;
  from?: "left" | "up";
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <clipPath id={`bw-${uid}`}>
          <motion.rect
            x={box.x - 1}
            y={box.y - 1}
            width={box.w + 2}
            height={box.h + 2}
            initial={false}
            animate={from === "left" ? { x: on ? 0 : -box.w - 2 } : { y: on ? 0 : box.h + 2 }}
            transition={{ duration: dur, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        fill={fill}
        clipPath={`url(#bw-${uid})`}
      />
    </g>
  );
}

/** One structural wall: neutral at step 1, emerald poché at step 2, hot at 3. */
function BearingWall({
  box,
  drawn,
  lit,
  hot,
  delay,
}: {
  box: Rect;
  drawn: boolean;
  lit: boolean;
  hot: boolean;
  delay: number;
}) {
  const d = rectD(box);
  return (
    <g>
      <FillWipe box={box} on={lit} fill="rgba(0,168,104,0.55)" delay={delay + 0.12} dur={0.7} />
      <FillWipe box={box} on={hot} fill="rgba(255,90,60,0.55)" delay={0.4} dur={0.55} />
      <Draw d={d} on={drawn} stroke={BASE} w={3} delay={delay} dur={0.6} />
      <Draw d={d} on={lit} stroke={V.emerald} w={4} delay={delay + 0.05} dur={0.55} />
      <Draw d={d} on={hot} stroke={V.ember} w={5} delay={0.35} dur={0.5} />
    </g>
  );
}

/**
 * A load arrow that thickens and extends when the load re-routes. Both the
 * thickening and the extension are one `scale` on a group — no width/height.
 */
function LoadArrow({
  x,
  y,
  dir,
  on,
  heavy,
  delay = 0,
}: {
  x: number;
  y: number;
  dir: 1 | -1;
  on: boolean;
  heavy: boolean;
  delay?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const len = 96;
  const head = 26;
  return (
    <g transform={`translate(${x} ${y}) scale(${dir} 1)`}>
      <motion.g
        initial={false}
        animate={{ scaleX: heavy ? 1.55 : 1, scaleY: heavy ? 1.9 : 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: heavy ? delay + 0.25 : 0 }}
        // The arrow must grow from its TAIL, not its centre. motion sets
        // `transform-box: fill-box` on animated SVG, so px origins are re-based
        // against this group's own bbox (x 0…len, y -13…13). Percentages are
        // therefore the honest way to say "tail, vertically centred".
        style={{ transformOrigin: "0% 50%" }}
      >
        <defs>
          <clipPath id={`bw-a-${uid}`}>
            <motion.rect
              x={-2}
              y={-22}
              width={len + 6}
              height={44}
              initial={false}
              animate={{ x: on ? 0 : -len - 8 }}
              transition={{ duration: 0.5, ease: EASE, delay: on ? delay : 0 }}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#bw-a-${uid})`}>
          <rect x={0} y={-4} width={len - head} height={8} fill={V.ember} />
          <path d={`M ${len - head} -13 L ${len} 0 L ${len - head} 13 Z`} fill={V.ember} />
        </g>
      </motion.g>
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

  return (
    <svg viewBox="0 0 860 600" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* ══ step 1 · the plan ═══════════════════════════════════════════════ */}

      {PARTITIONS.map(([x1, y1, x2, y2], i) => (
        <Draw
          key={`p${i}`}
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          on={drawn}
          stroke={DIM}
          w={6}
          cap="butt"
          delay={0.4 + i * 0.06}
          dur={0.35}
        />
      ))}
      {DOOR_GEO.map((dr, i) => (
        <g key={`d${i}`}>
          <Draw d={dr.leaf} on={drawn} stroke={DIM} w={3} delay={0.95 + i * 0.06} dur={0.25} />
          <Draw d={dr.swing} on={drawn} stroke={DIM} w={2} opacity={0.7} delay={1.02 + i * 0.06} dur={0.4} />
        </g>
      ))}

      {/* ══ step 3 · the floor that just lost its support ═══════════════════ */}

      <FillWipe box={FREED} on={removed} fill="rgba(255,90,60,0.14)" delay={0.45} dur={0.9} />

      {/* ══ steps 1–2 · the structure ═══════════════════════════════════════ */}

      {WALLS.map((b, i) =>
        i === REMOVED ? null : (
          <BearingWall
            key={`w${i}`}
            box={b}
            drawn={drawn}
            lit={lit}
            hot={removed && INHERIT.includes(i)}
            delay={i * 0.07}
          />
        ),
      )}

      {/* The demolished wall. Drawn like its neighbours, then faded as a group
          at step 3 — a pure function of `step`, exactly reversible. */}
      <motion.g
        initial={false}
        animate={{ opacity: removed ? 0 : 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: removed ? 0.05 : 0.1 }}
      >
        <BearingWall box={WALLS[REMOVED]} drawn={drawn} lit={lit} hot={false} delay={REMOVED * 0.07} />
      </motion.g>

      {/* …and the dashed ghost it leaves behind. */}
      <motion.path
        d={rectD(WALLS[REMOVED])}
        fill="none"
        stroke={V.ember}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="13 11"
        initial={false}
        animate={{ opacity: removed ? 0.8 : 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: removed ? 0.35 : 0 }}
      />

      {/* Cracks across the new span. */}
      {CRACKS.map((c, i) => (
        <Draw
          key={`c${i}`}
          d={poly(c)}
          on={removed}
          stroke={V.ember}
          w={3}
          opacity={0.9}
          delay={0.7 + i * 0.14}
          dur={0.6}
        />
      ))}

      {/* Load re-routing sideways into the two walls that now carry it. */}
      <LoadArrow x={342} y={140} dir={-1} on={removed} heavy={removed} delay={1.0} />
      <LoadArrow x={598} y={140} dir={1} on={removed} heavy={removed} delay={1.1} />

      {/* ══ step 2 · the bay dimensions ═════════════════════════════════════ */}

      {XS.map((x, i) => (
        <Draw
          key={`e${i}`}
          d={`M ${x} 456 V 504`}
          on={lit}
          stroke={DIM}
          w={1.8}
          delay={0.2 + i * 0.06}
          dur={0.3}
        />
      ))}
      <Draw d={`M ${XS[0]} ${DIM_Y} H ${XS[3]}`} on={lit} stroke={MID} w={2.5} delay={0.3} dur={0.8} />
      {XS.map((x, i) => (
        <Draw
          key={`t${i}`}
          d={`M ${x - 8} ${DIM_Y + 8} L ${x + 8} ${DIM_Y - 8}`}
          on={lit}
          stroke={MID}
          w={2.5}
          delay={0.5 + i * 0.06}
          dur={0.2}
        />
      ))}
      {BAYS.map((m, i) => (
        <motion.text
          key={`bl${i}`}
          x={(XS[i] + XS[i + 1]) / 2}
          y={DIM_Y - 14}
          fill={MID}
          fontSize={24}
          textAnchor="middle"
          className="font-mono tnum"
          style={{ letterSpacing: "0.06em" }}
          initial={false}
          animate={{ opacity: lit ? 1 : 0 }}
          transition={{ duration: 0.3, delay: lit ? 0.6 + i * 0.06 : 0 }}
        >
          {`${num(m)} ${t(q.unit, lang)}`}
        </motion.text>
      ))}

      {/* ══ step 3 · the span that replaced them ════════════════════════════ */}

      <Draw
        d={`M ${XS[1]} 504 V 550 M ${XS[3]} 504 V 550`}
        on={removed}
        stroke="rgba(255,90,60,0.55)"
        w={1.8}
        delay={0.9}
        dur={0.25}
      />
      <Draw d={`M ${XS[1]} ${DIM2_Y} H ${XS[3]}`} on={removed} stroke={V.ember} w={3} delay={1} dur={0.7} />
      <motion.text
        x={(XS[1] + XS[3]) / 2}
        y={DIM2_Y - 14}
        fill={V.ember}
        fontSize={28}
        textAnchor="middle"
        className="font-mono tnum"
        style={{ letterSpacing: "0.06em", fontWeight: 600 }}
        initial={false}
        animate={{ opacity: removed ? 1 : 0 }}
        transition={{ duration: 0.3, delay: removed ? 1.3 : 0 }}
      >
        {`${num(NEW_SPAN)} ${t(q.unit, lang)}`}
      </motion.text>

      {/* ══ step 3 · what happened, in words ════════════════════════════════ */}

      <motion.g
        initial={false}
        animate={{ opacity: removed ? 1 : 0, y: removed ? 0 : -10 }}
        transition={{ duration: 0.4, ease: EASE, delay: removed ? 0.5 : 0 }}
      >
        <path
          d={`M ${XS[2] - 12} 86 L 330 68`}
          fill="none"
          stroke="rgba(255,90,60,0.5)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <text
          x={318}
          y={74}
          fill={V.ember}
          fontSize={29}
          textAnchor="end"
          className="font-sans"
          style={{ fontWeight: 700 }}
        >
          {t(q.removedLabel, lang)}
        </text>
      </motion.g>

      <motion.text
        x={X0}
        y={584}
        fill={BASE}
        fontSize={28}
        className="font-sans"
        style={{ fontWeight: 600 }}
        initial={false}
        animate={{ opacity: removed ? 1 : 0, y: removed ? 0 : 10 }}
        transition={{ duration: 0.4, ease: EASE, delay: removed ? 1.45 : 0 }}
      >
        {t(q.loadShift, lang)}
      </motion.text>
    </svg>
  );
}

"use client";

import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import {
  Annotation,
  C,
  SketchEllipse,
  SketchLine,
  SketchPath,
  SketchRect,
  hatch,
  wobbleEllipse,
  wobbleLine,
  type Pt,
} from "@/ui/sketch";

/**
 * InfraMap — a locality sheet in architect's pencil. The argument the slide is
 * making is that the surroundings set the price, so Sergeli City is drawn as a
 * plain ink parcel in the middle and everything that is being built around it
 * lands in forest green.
 *
 * Step choreography — the slide has five states and reveals one pin per step.
 *   0 — empty paper.
 *   1 — the sheet draws: the Sergeli City parcel with its hatch and name, six
 *       faint neighbouring blocks for urban fabric, then pin 01 (airport).
 *   2 — pin 02, the metro station.
 *   3 — pin 03, the new highway.
 *   4 — pin 04, Eco Park.
 *
 * Each pin lands as a four-beat cascade ~120 ms apart: the forest route leaves
 * the parcel, the landmark draws itself, the numbered badge pops, the name
 * settles underneath. Pin leads are staggered 120 ms so a jump straight into
 * the middle of the slide still cascades instead of flashing all four at once.
 *
 * Deliberately silent on distance. The client supplied no kilometres and no
 * drive times, so the map states adjacency and nothing more — the qualitative
 * descriptions ("walking distance", "next to the project") stay in the slide's
 * own list, where they are quoted verbatim.
 *
 * Pure function of `step`: every `on` is monotonic, so 4 → 3 leaves the sheet
 * exactly as 3 built it.
 */

// ── sheet geometry ───────────────────────────────────────────────────────────

/** The Sergeli City parcel. Everything else is positioned off this. */
const BLOCK = { x: 366, y: 252, w: 168, h: 92 } as const;
const BLOCK_LABEL: Pt = [450, 388];

/** Neighbouring blocks — urban fabric, drawn faint, placed only where no
 *  landmark, route or label can ever reach them. */
const FABRIC = [
  { x: 292, y: 44, w: 96, h: 56 },
  { x: 420, y: 40, w: 116, h: 60 },
  { x: 808, y: 62, w: 92, h: 64 },
  { x: 36, y: 262, w: 92, h: 46 },
  { x: 404, y: 452, w: 104, h: 62 },
  { x: 692, y: 494, w: 128, h: 46 },
] as const;

type PinSpec = {
  /** Where the route leaves the parcel. */
  from: Pt;
  /** Badge centre, sitting on the landmark itself. */
  at: Pt;
  /** Name anchor. Chosen per pin so the Cyrillic form — ~10% wider — still
   *  clears the 940 px edge. */
  label: Pt;
  anchor: "start" | "middle";
  seed: number;
  /** Stagger between pins, so a multi-step jump cascades. */
  lead: number;
};

const PINS: readonly PinSpec[] = [
  // 01 airport — lower right, badge on the runway
  { from: [534, 330], at: [777, 395], label: [748, 470], anchor: "middle", seed: 101, lead: 0.62 },
  // 02 metro — upper right, badge is the station on the line
  { from: [520, 252], at: [668, 200], label: [668, 156], anchor: "middle", seed: 131, lead: 0.12 },
  // 03 highway — upper left, badge is the junction
  { from: [366, 286], at: [216, 196], label: [252, 176], anchor: "start", seed: 163, lead: 0.24 },
  // 04 eco park — lower left, badge in the middle of the parcel
  { from: [372, 344], at: [222, 428], label: [222, 526], anchor: "middle", seed: 197, lead: 0.36 },
];

// landmark geometry
const RUNWAY: [Pt, Pt] = [[668, 434], [886, 356]];
const RAIL: [Pt, Pt] = [[560, 200], [884, 200]];
const HIGHWAY: [Pt, Pt] = [[128, 352], [304, 40]];
const PARK = { cx: 222, cy: 428, rx: 118, ry: 72 } as const;
/** Fits inside the park ellipse with room to spare, so no clip is needed. */
const PARK_HATCH = { x: 162, y: 392, w: 120, h: 72 } as const;

// ── pencil helpers ───────────────────────────────────────────────────────────

/** Pull the far end of a segment back, so a route stops clear of its badge. */
function shorten(a: Pt, b: Pt, cut: number): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [b[0] - (dx / len) * cut, b[1] - (dy / len) * cut];
}

/** One edge of a dual carriageway or a runway: the centreline, pushed sideways. */
function offsetEdge(a: Pt, b: Pt, off: number, seed: number, amp = 1.2): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * off;
  const ny = (dx / len) * off;
  return wobbleLine(a[0] + nx, a[1] + ny, b[0] + nx, b[1] + ny, seed, amp);
}

/** Perpendicular strokes across a line — sleepers on a rail, thresholds on a
 *  runway. `ts` are positions along the line, so the badge can be stepped over. */
function crossTicks(a: Pt, b: Pt, ts: readonly number[], half: number, seed: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * half;
  const ny = (dx / len) * half;
  return ts
    .map((f, i) => {
      const px = a[0] + dx * f;
      const py = a[1] + dy * f;
      return wobbleLine(px - nx, py - ny, px + nx, py + ny, seed + i * 3, 0.6);
    })
    .join(" ");
}

/** Broken centreline, as `[from, to]` fractions along the road. */
function centreDashes(a: Pt, b: Pt, spans: readonly (readonly [number, number])[], seed: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return spans
    .map(([t0, t1], i) =>
      wobbleLine(a[0] + dx * t0, a[1] + dy * t0, a[0] + dx * t1, a[1] + dy * t1, seed + i * 5, 0.6),
    )
    .join(" ");
}

// ── local primitives ─────────────────────────────────────────────────────────

/**
 * 45° hatch revealed by sliding an oversized mask, not by scaling it.
 *
 * The shared `Hatch` scales a clip rect around a pixel `transform-origin`, and
 * motion overwrites `transform-origin` with `50% 50%` on SVG the moment a
 * transform exists — so that wipe opens from the middle of the box instead of
 * its left edge. A translate has no origin to lose.
 */
function HatchWipe({
  x,
  y,
  w,
  h,
  on,
  gap = 11,
  seed = 1,
  stroke = C.ink,
  width = 1.4,
  opacity = 0.2,
  delay = 0,
  duration = 0.7,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on: boolean;
  gap?: number;
  seed?: number;
  stroke?: string;
  width?: number;
  opacity?: number;
  delay?: number;
  duration?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const boxId = `imap-box-${uid}`;
  const wipeId = `imap-wipe-${uid}`;
  const d = useMemo(() => hatch(x, y, w, h, gap, 45, seed), [x, y, w, h, gap, seed]);

  return (
    <g>
      <defs>
        <clipPath id={boxId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <clipPath id={wipeId}>
          <motion.rect
            x={x}
            y={y - 4}
            width={w}
            height={h + 8}
            initial={false}
            animate={{ x: on ? 0 : -w - 2 }}
            transition={{ duration, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${boxId})`}>
        <g clipPath={`url(#${wipeId})`}>
          <path d={d} fill="none" stroke={stroke} strokeWidth={width} opacity={opacity} />
        </g>
      </g>
    </g>
  );
}

/**
 * The numbered pin, keyed to the 01–04 column the slide prints beside the map.
 *
 * Geometry is drawn around a local origin and placed by a plain `<g transform>`,
 * so the scale pop resolves against the badge's own box — motion's forced
 * `50% 50%` origin is the right answer here rather than a hazard.
 */
function PinBadge({
  at,
  n,
  on,
  delay,
  seed,
}: {
  at: Pt;
  n: string;
  on: boolean;
  delay: number;
  seed: number;
}) {
  const ring = useMemo(() => wobbleEllipse(0, 0, 17, 17, seed, 1.2), [seed]);

  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <motion.g
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.55 }}
        transition={{ duration: 0.34, ease: EASE, delay: on ? delay : 0 }}
      >
        {/* Knocks the hatch and the route out from under the numeral. */}
        <circle r={18} fill={C.paper} opacity={0.95} />
        <path d={ring} fill="none" stroke={C.forest} strokeWidth={2.6} strokeLinecap="round" />
        <text
          y={6}
          textAnchor="middle"
          fontSize={17}
          fill={C.forest}
          className="tnum font-mono"
        >
          {n}
        </text>
      </motion.g>
    </g>
  );
}

// ── the diagram ──────────────────────────────────────────────────────────────

export function InfraMap({ step }: { step: number }) {
  const lang = useLang();
  const pins = S.city.infra.pins;

  const sheet = step >= 1;

  const g = useMemo(() => {
    const [rwA, rwB] = RUNWAY;
    const [rlA, rlB] = RAIL;
    const [hwA, hwB] = HIGHWAY;
    return {
      routes: PINS.map((p) => ({ from: p.from, end: shorten(p.from, p.at, 26) })),
      runwayL: offsetEdge(rwA, rwB, 13, 211),
      runwayR: offsetEdge(rwA, rwB, -13, 217),
      runwayEnds: crossTicks(rwA, rwB, [0.03, 0.97], 14, 223),
      runwayMarks: centreDashes(
        rwA,
        rwB,
        [
          [0.1, 0.18],
          [0.24, 0.32],
          [0.62, 0.7],
          [0.76, 0.84],
        ],
        229,
      ),
      sleepers: crossTicks(
        rlA,
        rlB,
        [0.05, 0.14, 0.23, 0.46, 0.58, 0.7, 0.82, 0.94],
        9,
        241,
      ),
      highwayL: offsetEdge(hwA, hwB, 8, 251),
      highwayR: offsetEdge(hwA, hwB, -8, 257),
      highwayMarks: centreDashes(
        hwA,
        hwB,
        [
          [0.06, 0.16],
          [0.24, 0.34],
          [0.62, 0.72],
          [0.8, 0.9],
        ],
        263,
      ),
    };
  }, []);

  return (
    <svg viewBox="0 0 940 560" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* ── the sheet: fabric, then the parcel the whole slide is about ─────── */}
      {FABRIC.map((b, i) => (
        <SketchRect
          key={`${b.x}-${b.y}`}
          x={b.x}
          y={b.y}
          w={b.w}
          h={b.h}
          seed={11 + i * 7}
          amp={1.3}
          on={sheet}
          stroke={C.ink}
          width={1.3}
          opacity={0.18}
          delay={0.24 + i * 0.05}
          duration={0.34}
        />
      ))}

      <SketchRect
        x={BLOCK.x}
        y={BLOCK.y}
        w={BLOCK.w}
        h={BLOCK.h}
        seed={71}
        amp={1.6}
        on={sheet}
        stroke={C.ink}
        width={2.8}
        duration={0.55}
      />
      <HatchWipe
        x={BLOCK.x + 8}
        y={BLOCK.y + 8}
        w={BLOCK.w - 16}
        h={BLOCK.h - 16}
        on={sheet}
        gap={12}
        seed={83}
        stroke={C.ink}
        opacity={0.18}
        delay={0.26}
        duration={0.6}
      />
      <Annotation
        x={BLOCK_LABEL[0]}
        y={BLOCK_LABEL[1]}
        text={t(S.brand.project, lang)}
        on={sheet}
        color={C.ink}
        size={32}
        anchor="middle"
        delay={0.44}
      />

      {/* ── routes out of the parcel ────────────────────────────────────────── */}
      {g.routes.map((r, i) => (
        <SketchLine
          key={`route-${i}`}
          x1={r.from[0]}
          y1={r.from[1]}
          x2={r.end[0]}
          y2={r.end[1]}
          seed={PINS[i].seed}
          amp={1.5}
          on={step >= i + 1}
          stroke={C.forest}
          width={1.8}
          opacity={0.5}
          delay={PINS[i].lead}
          duration={0.42}
        />
      ))}

      {/* ── 01 · airport: two runway edges, thresholds, centreline ──────────── */}
      <g>
        <SketchPath d={g.runwayL} on={step >= 1} stroke={C.forest} width={2.2} opacity={0.9} delay={PINS[0].lead + 0.12} duration={0.6} />
        <SketchPath d={g.runwayR} on={step >= 1} stroke={C.forest} width={2.2} opacity={0.9} delay={PINS[0].lead + 0.18} duration={0.6} />
        <SketchPath d={g.runwayEnds} on={step >= 1} stroke={C.forest} width={2} opacity={0.8} delay={PINS[0].lead + 0.34} duration={0.28} />
        <SketchPath d={g.runwayMarks} on={step >= 1} stroke={C.forest} width={1.6} opacity={0.6} delay={PINS[0].lead + 0.4} duration={0.32} />
      </g>

      {/* ── 02 · metro: the line, then its sleepers ─────────────────────────── */}
      <g>
        <SketchLine
          x1={RAIL[0][0]}
          y1={RAIL[0][1]}
          x2={RAIL[1][0]}
          y2={RAIL[1][1]}
          seed={137}
          amp={1.4}
          on={step >= 2}
          stroke={C.forest}
          width={2.4}
          opacity={0.9}
          delay={PINS[1].lead + 0.12}
          duration={0.6}
        />
        <SketchPath d={g.sleepers} on={step >= 2} stroke={C.forest} width={1.6} opacity={0.65} delay={PINS[1].lead + 0.3} duration={0.4} />
      </g>

      {/* ── 03 · highway: dual carriageway heading for the centre ───────────── */}
      <g>
        <SketchPath d={g.highwayL} on={step >= 3} stroke={C.forest} width={2.2} opacity={0.9} delay={PINS[2].lead + 0.12} duration={0.62} />
        <SketchPath d={g.highwayR} on={step >= 3} stroke={C.forest} width={2.2} opacity={0.9} delay={PINS[2].lead + 0.18} duration={0.62} />
        <SketchPath d={g.highwayMarks} on={step >= 3} stroke={C.forest} width={1.6} opacity={0.55} delay={PINS[2].lead + 0.38} duration={0.34} />
      </g>

      {/* ── 04 · eco park: a hatched parcel next door ───────────────────────── */}
      <g>
        <SketchEllipse
          cx={PARK.cx}
          cy={PARK.cy}
          rx={PARK.rx}
          ry={PARK.ry}
          seed={199}
          on={step >= 4}
          stroke={C.forest}
          width={2.2}
          opacity={0.9}
          delay={PINS[3].lead + 0.12}
          duration={0.7}
        />
        <HatchWipe
          x={PARK_HATCH.x}
          y={PARK_HATCH.y}
          w={PARK_HATCH.w}
          h={PARK_HATCH.h}
          on={step >= 4}
          gap={13}
          seed={211}
          stroke={C.forest}
          width={1.5}
          opacity={0.3}
          delay={PINS[3].lead + 0.3}
          duration={0.6}
        />
      </g>

      {/* ── badges and names, always last so nothing draws over them ────────── */}
      {PINS.map((p, i) => (
        <g key={`pin-${i}`}>
          <PinBadge
            at={p.at}
            n={String(i + 1).padStart(2, "0")}
            on={step >= i + 1}
            delay={p.lead + 0.48}
            seed={p.seed + 4}
          />
          <Annotation
            x={p.label[0]}
            y={p.label[1]}
            text={t(pins[i].t, lang)}
            on={step >= i + 1}
            color={C.ink2}
            size={21}
            anchor={p.anchor}
            delay={p.lead + 0.6}
          />
        </g>
      ))}
    </svg>
  );
}

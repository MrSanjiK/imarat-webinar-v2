"use client";

import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  Annotation,
  C,
  SketchLine,
  SketchPath,
  rng,
  smooth,
  wobbleEllipse,
  wobbleLine,
  type Pt,
} from "@/ui/sketch";

/**
 * SeismicMapUZ — chapter 1 (dark), slide 03 "Biz seysmik hududda yashaymiz".
 * Box 900 × 640.
 *
 * A hand-drawn Uzbekistan in architect's pencil. Not a survey: a recognisable
 * contour, the fault families that actually run under it, and the one city the
 * room is sitting in.
 *
 *   step 0 — empty sheet; the title is still landing.
 *   step 1 — a faint graticule, then the country contour draws as one continuous
 *            pencil stroke, and 45° hatching wipes in behind it.
 *   step 2 — six fault traces draw in (chapter accent, the legend's `legendFault`
 *            colour) and take on a slow dash-flow. They run past the border on
 *            purpose: geology does not stop at a customs post.
 *   step 3 — Tashkent lands in ember (the legend's `legendCity` colour) with a
 *            crosshair, and three rings pulse out of it.
 *
 * Pure function of `step`. Every draw-on is gated by a `step >= n` boolean, so
 * 3 → 1 renders exactly what 1 → 3 rendered. The only looping animations are
 * `strokeDashoffset` (fault flow) and `scale`/`opacity` (pulse rings); nothing
 * animates a filter, a geometry attribute or a shadow.
 */

// ── projection ───────────────────────────────────────────────────────────────
// Plate carrée with the x-axis stretched ~9% over true scale at 41°N, which
// fills the 900 × 640 slot without making the country look squashed.

const LON0 = 55.6;
const LAT0 = 37.0;
const SX = 43;
const SY = 52;
const OX = 72;
const OY = 545;

const px = ([lon, lat]: Pt): Pt => [OX + (lon - LON0) * SX, OY - (lat - LAT0) * SY];

/**
 * The real border, from Natural Earth via `scripts/extract-uz-outline.mjs`:
 * 84 vertices spaced evenly along the perimeter. Runs anticlockwise from the
 * north-east tip above Tashkent.
 *
 * Not hand-drawn on purpose. The audience lives here, and an approximated
 * silhouette of their own country is the kind of detail that costs credibility
 * on the slide asking them to trust an engineering claim. Even spacing matters
 * as much as the coordinates: `smooth()` overshoots where segment lengths jump,
 * and the raw border does that at every enclave.
 *
 * 84 rather than fewer because that is where the corner north-east of Tashkent
 * survives resampling — the city clears the border by 7.7 px here, which is the
 * true figure. Nothing gains from a rounder outline once the one point the map
 * has to place starts sitting on the line.
 */
const UZ: Pt[] = [
  [70.95, 42.25],
  [70.89, 42.04],
  [70.35, 41.67],
  [70.61, 41.44],
  [71.16, 41.15],
  [71.61, 41.39],
  [71.94, 41.19],
  [72.49, 40.99],
  [73.13, 40.81],
  [72.53, 40.54],
  [72.06, 40.37],
  [71.47, 40.23],
  [70.79, 40.23],
  [70.49, 40.52],
  [70.53, 40.93],
  [69.97, 40.76],
  [69.34, 40.76],
  [69.25, 40.24],
  [68.63, 40.17],
  [68.84, 39.95],
  [68.47, 39.55],
  [67.79, 39.61],
  [67.39, 39.21],
  [67.97, 38.99],
  [68.1, 38.45],
  [68.19, 37.92],
  [67.81, 37.38],
  [67.33, 37.21],
  [66.68, 37.36],
  [66.58, 37.87],
  [66.09, 38.19],
  [65.45, 38.32],
  [64.83, 38.64],
  [64.24, 38.97],
  [63.64, 39.26],
  [63.06, 39.64],
  [62.47, 39.99],
  [62.17, 40.58],
  [61.81, 41.15],
  [61.17, 41.2],
  [60.49, 41.22],
  [60.12, 41.62],
  [59.97, 42.05],
  [59.5, 42.31],
  [58.9, 42.56],
  [58.34, 42.68],
  [58.46, 42.3],
  [57.92, 42.34],
  [57.32, 42.13],
  [57.0, 41.62],
  [56.78, 41.28],
  [56.09, 41.32],
  [55.98, 41.9],
  [55.98, 42.59],
  [55.98, 43.28],
  [55.98, 43.97],
  [55.98, 44.66],
  [56.33, 45.07],
  [57.0, 45.22],
  [57.68, 45.36],
  [58.35, 45.51],
  [58.99, 45.35],
  [59.61, 45.05],
  [60.24, 44.76],
  [60.86, 44.46],
  [61.35, 44.01],
  [61.89, 43.58],
  [62.54, 43.55],
  [63.23, 43.63],
  [63.92, 43.58],
  [64.6, 43.61],
  [65.19, 43.49],
  [65.69, 43.04],
  [66.08, 42.82],
  [66.01, 42.14],
  [66.51, 41.93],
  [66.69, 41.26],
  [67.31, 41.17],
  [67.98, 41.16],
  [68.28, 40.67],
  [68.66, 40.96],
  [69.14, 41.42],
  [69.76, 41.7],
  [70.35, 42.03],
];

/** The fault families, densest in the east where the seismicity actually is. */
const FAULTS: Pt[][] = [
  // Northern Fergana
  [[69.9, 41.6], [71.0, 41.2], [72.2, 41.0], [73.6, 40.9]],
  // Southern Fergana
  [[69.8, 39.9], [71.0, 40.1], [72.0, 40.3], [73.2, 40.7]],
  // Karzhantau–Chatkal — the one that runs straight under Tashkent
  [[68.0, 40.4], [69.3, 41.2], [70.4, 42.0]],
  // Nuratau–Zeravshan
  [[63.7, 40.2], [65.8, 40.6], [67.8, 40.3], [69.1, 39.7]],
  // Bukhara–Gissar
  [[62.8, 39.1], [64.9, 38.8], [66.9, 38.4], [68.5, 37.9]],
  // Ustyurt–Aral, the quiet western family
  [[57.2, 44.5], [59.4, 43.7], [61.5, 43.0], [63.2, 42.4]],
];

const TASHKENT = px([69.28, 41.31]);

const MERIDIANS = [58, 61, 64, 67, 70, 73];
const PARALLELS = [38, 40, 42, 44];

/** Bounding box the country hatching is generated across. */
const BOX = { x: 76, y: 92, w: 768, h: 464 };

const LINE = "rgba(244,241,234,0.86)";
const FAINT = "rgba(244,241,234,0.10)";

/**
 * 45° hatching in the deck's "\" direction, clipped analytically to the box
 * rather than generated across its diagonal. Same grammar as the sketch
 * `hatch()` — same angle, same wobbled strokes, same clip-wipe reveal — but the
 * primitive spends 1 498 curves on this box against 620 here, and the path sits
 * under an *animated* clip, so every one of them is re-rasterised on every
 * frame of the wipe.
 */
function hatch45(x: number, y: number, w: number, h: number, gap: number, seed: number): string {
  const out: string[] = [];
  let i = 0;
  for (let sx = x - h; sx <= x + w; sx += gap, i++) {
    const s0 = Math.max(0, x - sx);
    const s1 = Math.min(h, x + w - sx);
    if (s1 - s0 < 1.5) continue;
    out.push(wobbleLine(sx + s0, y + s0, sx + s1, y + s1, seed + i * 13, 0.8));
  }
  return out.join(" ");
}

/** Jitter every vertex once, then run Catmull–Rom through it. Baked into `d`. */
function pencil(pts: Pt[], seed: number, amp: number, closed = false): string {
  const r = rng(seed * 2654435761);
  return smooth(
    pts.map(([x, y]) => [x + (r() - 0.5) * 2 * amp, y + (r() - 0.5) * 2 * amp] as Pt),
    closed,
  );
}

// ── pieces ───────────────────────────────────────────────────────────────────

/**
 * 45° hatching clipped to an arbitrary silhouette and revealed by *translating*
 * an oversized mask path. A `scaleX` wipe would depend on `transformOrigin`,
 * which Motion drops on SVG children — translation has no origin to lose.
 */
function HatchWipe({
  clipD,
  x,
  y,
  w,
  h,
  on,
  gap = 16,
  seed = 1,
  stroke = C.paper,
  width = 1.4,
  opacity = 0.13,
  delay = 0,
  duration = 1.2,
}: {
  clipD: string;
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
  const lines = useMemo(() => hatch45(x, y, w, h, gap, seed), [x, y, w, h, gap, seed]);

  const pad = 14;
  const ww = w + pad * 2;
  const wipeD = `M ${x - pad} ${y - pad} H ${x - pad + ww} V ${y + h + pad} H ${x - pad} Z`;

  return (
    <g>
      <defs>
        <clipPath id={`shape-${uid}`}>
          <path d={clipD} />
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
      <g clipPath={`url(#shape-${uid})`}>
        <g clipPath={`url(#wipe-${uid})`}>
          <path d={lines} fill="none" stroke={stroke} strokeWidth={width} opacity={opacity} />
        </g>
      </g>
    </g>
  );
}

/**
 * The travelling half of a fault trace: a fixed dash pattern in `pathLength`
 * units, offset animated by exactly one period so the loop is seamless.
 */
function FaultFlow({ d, on, delay }: { d: string; on: boolean; delay: number }) {
  return (
    <motion.path
      d={d}
      pathLength={1}
      fill="none"
      stroke={C.leaf}
      strokeWidth={2.8}
      strokeLinecap="round"
      strokeDasharray="0.028 0.062"
      initial={false}
      animate={{ strokeDashoffset: on ? [0, -0.09] : 0, opacity: on ? 0.95 : 0 }}
      transition={{
        strokeDashoffset: on
          ? { duration: 5.5, ease: "linear", repeat: Infinity, delay }
          : { duration: 0 },
        opacity: { duration: 0.35, delay: on ? delay : 0 },
      }}
    />
  );
}

/**
 * One expanding ring. The geometry is centred on the group's local origin, so
 * the default 50%/50% transform box is already the right one — the scale opens
 * from the epicentre whatever Motion does with `transformOrigin`.
 */
function Pulse({ r, on, delay, seed }: { r: number; on: boolean; delay: number; seed: number }) {
  const d = useMemo(() => wobbleEllipse(0, 0, r, r, seed, 1.5), [r, seed]);
  return (
    <motion.g
      initial={false}
      animate={{ scale: on ? [0.16, 1] : 0.16, opacity: on ? [0.62, 0] : 0 }}
      transition={on ? { duration: 2.7, ease: EASE, repeat: Infinity, delay } : { duration: 0.2 }}
    >
      <path d={d} fill="none" stroke={C.ember} strokeWidth={2.2} />
    </motion.g>
  );
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function SeismicMapUZ({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.seismic;

  const land = step >= 1;
  const faults = step >= 2;
  const epi = step >= 3;

  // Every pencil offset is drawn from a seeded RNG here, once, and baked into
  // the `d` strings below. Nothing downstream re-randomises per frame.
  const geo = useMemo(() => {
    const outline = pencil(UZ.map(px), 8123, 2.6, true);
    const traces = FAULTS.map((f, i) => pencil(f.map(px), 4400 + i * 137, 2.2));
    const cross = (() => {
      const [cx, cy] = TASHKENT;
      const a = 15;
      const b = 5;
      return [
        `M ${cx - a} ${cy} H ${cx - b}`,
        `M ${cx + b} ${cy} H ${cx + a}`,
        `M ${cx} ${cy - a} V ${cy - b}`,
        `M ${cx} ${cy + b} V ${cy + a}`,
      ].join(" ");
    })();
    const ring = wobbleEllipse(TASHKENT[0], TASHKENT[1], 13, 13, 991, 1.1);
    const dot = wobbleEllipse(TASHKENT[0], TASHKENT[1], 4.2, 4.2, 331, 0.5);
    return { outline, traces, cross, ring, dot };
  }, []);

  return (
    <svg viewBox="0 0 900 640" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* ── graticule: enough to say "map", not enough to read ─────────────── */}
      {MERIDIANS.map((lon, i) => {
        const [x] = px([lon, 0]);
        return (
          <SketchLine
            key={`m${lon}`}
            x1={x}
            y1={78}
            x2={x}
            y2={570}
            seed={200 + i}
            amp={1.1}
            on={land}
            stroke={FAINT}
            width={1}
            delay={i * 0.03}
            duration={0.5}
          />
        );
      })}
      {PARALLELS.map((lat, i) => {
        const [, y] = px([0, lat]);
        return (
          <SketchLine
            key={`p${lat}`}
            x1={54}
            y1={y}
            x2={856}
            y2={y}
            seed={240 + i}
            amp={1.1}
            on={land}
            stroke={FAINT}
            width={1}
            delay={0.1 + i * 0.03}
            duration={0.5}
          />
        );
      })}

      {/* ── step 1 · the country ──────────────────────────────────────────── */}

      <HatchWipe
        clipD={geo.outline}
        x={BOX.x}
        y={BOX.y}
        w={BOX.w}
        h={BOX.h}
        on={land}
        gap={24}
        seed={61}
        delay={0.45}
        duration={1.25}
      />
      <SketchPath d={geo.outline} on={land} stroke={LINE} width={2.4} delay={0.18} duration={1.7} />

      {/* ── step 2 · the faults ───────────────────────────────────────────── */}

      {geo.traces.map((d, i) => (
        <SketchPath
          key={`f${i}`}
          d={d}
          on={faults}
          stroke={C.leaf}
          width={2.2}
          opacity={0.34}
          delay={i * 0.11}
          duration={0.85}
        />
      ))}
      {geo.traces.map((d, i) => (
        <FaultFlow key={`ff${i}`} d={d} on={faults} delay={0.55 + i * 0.11} />
      ))}

      {/* ── step 3 · Tashkent ─────────────────────────────────────────────── */}

      <g transform={`translate(${TASHKENT[0]} ${TASHKENT[1]})`}>
        <Pulse r={68} on={epi} delay={0} seed={17} />
        <Pulse r={68} on={epi} delay={0.9} seed={29} />
        <Pulse r={68} on={epi} delay={1.8} seed={43} />
      </g>

      <SketchPath d={geo.cross} on={epi} stroke={C.ember} width={1.8} opacity={0.8} delay={0.1} duration={0.3} />
      <SketchPath d={geo.ring} on={epi} stroke={C.ember} width={2.4} delay={0.16} duration={0.4} />
      <SketchPath d={geo.dot} on={epi} stroke={C.ember} width={1} fill={C.ember} delay={0.3} duration={0.25} />

      <Annotation
        x={TASHKENT[0]}
        y={TASHKENT[1] - 64}
        text={t(q.legendCity, lang)}
        on={epi}
        delay={0.36}
        color={C.ember}
        size={34}
        anchor="middle"
      />
      <motion.text
        x={TASHKENT[0]}
        y={TASHKENT[1] - 40}
        fill="rgba(199,80,47,0.72)"
        fontSize={21}
        textAnchor="middle"
        className="font-mono"
        style={{ letterSpacing: "0.1em" }}
        initial={false}
        animate={{ opacity: epi ? 1 : 0 }}
        transition={{ duration: 0.3, delay: epi ? 0.5 : 0 }}
      >
        {`M${N.quake1966.magnitude}`}
      </motion.text>
    </svg>
  );
}

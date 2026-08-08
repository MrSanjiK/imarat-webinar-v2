"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { num, t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * SeismicMapUZ — chapter 1 (dark), slide 03 "Biz seysmik hududda yashaymiz".
 * Slot 900 × 640, rendered over the night field.
 *
 * v2 "IMARAT Vivid": bold flat vector. No pencil, no jitter, no filters. Every
 * fill arrives through a translating clip rect; every outline arrives through
 * `pathLength={1}` + `strokeDashoffset 1 → 0`.
 *
 * Step map (slide q-seismic has 5 steps, 0…4)
 *   0 — empty sheet. The title is still landing.
 *   1 — the dot field sweeps in, the country outline draws as one stroke, then
 *       the land fill wipes in behind it.
 *   2 — the three seismic hazard bands wipe in west → east (the eastern band is
 *       gold: the highest demand), then six fault traces draw with a 0.06
 *       stagger and take a slow dash-flow.
 *   3 — Tashkent lands: crosshair pin pops 1.25 → 1, three rings pulse, and the
 *       1966 casualty / homeless counters tick in under the map.
 *   4 — MARQUEE. The whole map group transform-zooms into Tashkent
 *       (scale 2.6 + translate, EASE, 0.9 s), the rest of the country falls to
 *       0.28 opacity, the counters clear, and the city label + magnitude chip
 *       scale up. Pure transform — nothing re-rasterises.
 *
 * Pure function of `step`. Every gate is `step >= n`, so 4 → 1 renders exactly
 * what 1 → 4 rendered.
 */

// ── projection ───────────────────────────────────────────────────────────────
// Plate carrée, x stretched ~9% over true scale at 41°N so the country fills a
// 900 × 640 slot without looking squashed.

type Pt = [number, number];

const LON0 = 55.6;
const LAT0 = 37.0;
const SX = 43;
const SY = 52;
const OX = 72;
const OY = 545;

const px = ([lon, lat]: Pt): Pt => [OX + (lon - LON0) * SX, OY - (lat - LAT0) * SY];

/**
 * The real border, from Natural Earth via `scripts/extract-uz-outline.mjs`:
 * 84 vertices spaced evenly along the perimeter, anticlockwise from the
 * north-east tip above Tashkent. Not approximated on purpose — the audience
 * lives here, and a wrong silhouette of their own country costs credibility on
 * the slide that asks them to trust an engineering claim.
 */
const UZ: Pt[] = [
  [70.95, 42.25], [70.89, 42.04], [70.35, 41.67], [70.61, 41.44], [71.16, 41.15],
  [71.61, 41.39], [71.94, 41.19], [72.49, 40.99], [73.13, 40.81], [72.53, 40.54],
  [72.06, 40.37], [71.47, 40.23], [70.79, 40.23], [70.49, 40.52], [70.53, 40.93],
  [69.97, 40.76], [69.34, 40.76], [69.25, 40.24], [68.63, 40.17], [68.84, 39.95],
  [68.47, 39.55], [67.79, 39.61], [67.39, 39.21], [67.97, 38.99], [68.1, 38.45],
  [68.19, 37.92], [67.81, 37.38], [67.33, 37.21], [66.68, 37.36], [66.58, 37.87],
  [66.09, 38.19], [65.45, 38.32], [64.83, 38.64], [64.24, 38.97], [63.64, 39.26],
  [63.06, 39.64], [62.47, 39.99], [62.17, 40.58], [61.81, 41.15], [61.17, 41.2],
  [60.49, 41.22], [60.12, 41.62], [59.97, 42.05], [59.5, 42.31], [58.9, 42.56],
  [58.34, 42.68], [58.46, 42.3], [57.92, 42.34], [57.32, 42.13], [57.0, 41.62],
  [56.78, 41.28], [56.09, 41.32], [55.98, 41.9], [55.98, 42.59], [55.98, 43.28],
  [55.98, 43.97], [55.98, 44.66], [56.33, 45.07], [57.0, 45.22], [57.68, 45.36],
  [58.35, 45.51], [58.99, 45.35], [59.61, 45.05], [60.24, 44.76], [60.86, 44.46],
  [61.35, 44.01], [61.89, 43.58], [62.54, 43.55], [63.23, 43.63], [63.92, 43.58],
  [64.6, 43.61], [65.19, 43.49], [65.69, 43.04], [66.08, 42.82], [66.01, 42.14],
  [66.51, 41.93], [66.69, 41.26], [67.31, 41.17], [67.98, 41.16], [68.28, 40.67],
  [68.66, 40.96], [69.14, 41.42], [69.76, 41.7], [70.35, 42.03],
];

/** The fault families, densest in the east where the seismicity actually is. */
const FAULTS: Pt[][] = [
  [[69.9, 41.6], [71.0, 41.2], [72.2, 41.0], [73.6, 40.9]], // Northern Fergana
  [[69.8, 39.9], [71.0, 40.1], [72.0, 40.3], [73.2, 40.7]], // Southern Fergana
  [[68.0, 40.4], [69.3, 41.2], [70.4, 42.0]], // Karzhantau–Chatkal, under Tashkent
  [[63.7, 40.2], [65.8, 40.6], [67.8, 40.3], [69.1, 39.7]], // Nuratau–Zeravshan
  [[62.8, 39.1], [64.9, 38.8], [66.9, 38.4], [68.5, 37.9]], // Bukhara–Gissar
  [[57.2, 44.5], [59.4, 43.7], [61.5, 43.0], [63.2, 42.4]], // Ustyurt–Aral
];

/**
 * Hazard bands. Seismic demand in Uzbekistan genuinely climbs west → east, so
 * three meridional bands, clipped to the land, say it without pretending to be
 * a survey. Gold marks the top band only — one accent, used once.
 */
const ZONES: Array<{ lon: [number, number]; fill: string }> = [
  { lon: [55.2, 62.4], fill: "rgba(244,251,244,0.05)" },
  { lon: [62.4, 67.9], fill: "rgba(244,251,244,0.11)" },
  { lon: [67.9, 74.2], fill: "rgba(240,178,62,0.20)" },
];

const TASHKENT = px([69.28, 41.31]);
const [TX, TY] = TASHKENT;

/** Where the camera parks the city on the marquee step. */
const FOCUS: Pt = [450, 336];
const ZOOM = 2.6;
/**
 * Half-side of the invisible square that fixes the zoom's pivot on Tashkent.
 * Must stay large enough to strictly enclose every child of the scaled group
 * (content spans x 40…880, y 40…620); see the camera comment in the render.
 */
const PIVOT_R = 700;

const BASE = "rgba(244,251,244,0.9)";
const DIM = "rgba(244,251,244,0.35)";
const MID = "rgba(244,251,244,0.6)";

// ── geometry helpers (no jitter — flat vector) ───────────────────────────────

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Catmull–Rom → cubic. One evaluation at module load, baked into `d`. */
function smooth(p: Pt[], closed = false): string {
  const n = p.length;
  if (n < 2) return "";
  const at = (i: number): Pt => (closed ? p[(i + n) % n] : p[Math.min(n - 1, Math.max(0, i))]);
  let d = `M ${r2(p[0][0])} ${r2(p[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return closed ? `${d} Z` : d;
}

const LAND = smooth(UZ.map(px), true);
const TRACES = FAULTS.map((f) => smooth(f.map(px)));

const zoneD = (lon: [number, number]) => {
  const [x0] = px([lon[0], 0]);
  const [x1] = px([lon[1], 0]);
  return `M ${r2(x0)} 40 H ${r2(x1)} V 620 H ${r2(x0)} Z`;
};

/** Dot field: one static path of 336 tiny discs, revealed by a single wipe. */
const DOTS = (() => {
  const parts: string[] = [];
  for (let y = 96; y <= 560; y += 34) {
    for (let x = 60; x <= 856; x += 34) {
      parts.push(`M ${x - 1.7} ${y} a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0`);
    }
  }
  return parts.join(" ");
})();

const CROSS = `M -34 0 H -13 M 13 0 H 34 M 0 -34 V -13 M 0 13 V 34`;

// ── kit ──────────────────────────────────────────────────────────────────────

function Draw({
  d,
  on,
  stroke,
  w = 4,
  delay = 0,
  dur = 0.8,
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

/** Fills arrive by sliding a clip rect — never by ramping fill-opacity. */
function Wipe({
  on,
  x,
  y,
  w,
  h,
  from = "left",
  delay = 0,
  dur = 0.9,
  children,
}: {
  on: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  from?: "left" | "right" | "up";
  delay?: number;
  dur?: number;
  children: React.ReactNode;
}) {
  const uid = useId().replace(/:/g, "");
  const off =
    from === "left" ? { x: -w - 4, y: 0 } : from === "right" ? { x: w + 4, y: 0 } : { x: 0, y: h + 4 };
  return (
    <g>
      <defs>
        <clipPath id={`sm-w-${uid}`}>
          <motion.rect
            x={x - 2}
            y={y - 2}
            width={w + 4}
            height={h + 4}
            initial={false}
            animate={{ x: on ? 0 : off.x, y: on ? 0 : off.y }}
            transition={{ duration: dur, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#sm-w-${uid})`}>{children}</g>
    </g>
  );
}

/** Travelling half of a fault trace: fixed dash pattern, one-period offset loop. */
function FaultFlow({ d, on, delay }: { d: string; on: boolean; delay: number }) {
  return (
    <motion.path
      d={d}
      pathLength={1}
      fill="none"
      stroke={V.leaf}
      strokeWidth={4}
      strokeLinecap="round"
      strokeDasharray="0.03 0.06"
      initial={false}
      animate={{ strokeDashoffset: on ? [0, -0.09] : 0, opacity: on ? 1 : 0 }}
      transition={{
        strokeDashoffset: on
          ? { duration: 5.4, ease: "linear", repeat: Infinity, delay }
          : { duration: 0 },
        opacity: { duration: 0.3, delay: on ? delay : 0 },
      }}
    />
  );
}

/** One expanding ring, centred on the group origin so scale opens from the pin. */
function Pulse({ on, delay }: { on: boolean; delay: number }) {
  return (
    <motion.g
      initial={false}
      animate={{ scale: on ? [0.2, 1] : 0.2, opacity: on ? [0.75, 0] : 0 }}
      transition={on ? { duration: 2.6, ease: EASE, repeat: Infinity, delay } : { duration: 0.2 }}
    >
      <circle cx={0} cy={0} r={78} fill="none" stroke={V.ember} strokeWidth={3} />
    </motion.g>
  );
}

/** rAF ticker. Mounting with `on` already true snaps — reverse nav never replays. */
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

function Tally({
  x,
  y,
  to,
  on,
  label,
  color,
  delay = 0,
}: {
  x: number;
  y: number;
  to: number;
  on: boolean;
  label: string;
  color: string;
  delay?: number;
}) {
  const v = useCount(to, on, 1.2, delay);
  return (
    <motion.g
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 14 }}
      transition={{ duration: 0.5, ease: EASE, delay: on ? delay : 0 }}
    >
      <text x={x} y={y} fill={color} fontSize={54} className="font-display tnum" style={{ fontWeight: 600 }}>
        {num(v)}
      </text>
      <text x={x} y={y + 28} fill={DIM} fontSize={19} className="font-mono" style={{ letterSpacing: "0.06em" }}>
        {label}
      </text>
    </motion.g>
  );
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function SeismicMapUZ({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.seismic;
  const y66 = S.quake.y1966;
  const uid = useId().replace(/:/g, "");
  const landClip = `sm-land-${uid}`;

  const land = step >= 1;
  const zones = step >= 2;
  const city = step >= 3;
  const zoom = step >= 4;

  const chip = useMemo(() => {
    const label = `M${N.quake1966.magnitude}`;
    return { label, w: label.length * 15 + 34 };
  }, []);

  return (
    <svg viewBox="0 0 900 640" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      <defs>
        <clipPath id={landClip}>
          <path d={LAND} />
        </clipPath>
      </defs>

      {/* ── the camera ───────────────────────────────────────────────────────
          Translate outside, scale inside.

          The pivot is load-bearing and worth spelling out. Motion sets
          `transform-box: fill-box` on any animated SVG element, which re-bases
          the transform origin onto that element's OWN bounding box — so a px
          origin in user space would be silently wrong here. Instead the scaled
          group carries an invisible square centred on Tashkent and large enough
          (1400 × 1400 against content spanning x 40…880, y 40…620) to strictly
          enclose every child. The group's bbox is therefore exactly that
          square, its centre is exactly the city, and the default 50% 50% origin
          opens the zoom on Tashkent. `fill="none"` does not exclude the rect:
          an SVG bounding box is geometry, not paint.

          If PIVOT_R ever stops enclosing the content, the zoom drifts. */}
      <motion.g
        initial={false}
        animate={{ x: zoom ? FOCUS[0] - TX : 0, y: zoom ? FOCUS[1] - TY : 0 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <motion.g
          initial={false}
          animate={{ scale: zoom ? ZOOM : 1 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <rect
            x={TX - PIVOT_R}
            y={TY - PIVOT_R}
            width={PIVOT_R * 2}
            height={PIVOT_R * 2}
            fill="none"
          />

          {/* Everything that is not the city dims away on the marquee step. */}
          <motion.g
            initial={false}
            animate={{ opacity: zoom ? 0.28 : 1 }}
            transition={{ duration: 0.75, ease: EASE, delay: zoom ? 0.12 : 0 }}
          >
            {/* dot field */}
            <Wipe on={land} x={40} y={80} w={840} h={500} dur={1.1}>
              <path d={DOTS} fill="rgba(244,251,244,0.16)" />
            </Wipe>

            {/* land body + hazard bands, both clipped to the border */}
            <g clipPath={`url(#${landClip})`}>
              <Wipe on={land} x={40} y={40} w={840} h={580} delay={0.55} dur={1.0}>
                <path d={LAND} fill="rgba(0,168,104,0.16)" />
              </Wipe>
              {ZONES.map((z, i) => (
                <Wipe
                  key={i}
                  on={zones}
                  x={40}
                  y={40}
                  w={840}
                  h={580}
                  delay={i * 0.14}
                  dur={0.8}
                >
                  <path d={zoneD(z.lon)} fill={z.fill} />
                </Wipe>
              ))}
            </g>

            {/* border */}
            <Draw d={LAND} on={land} stroke={BASE} w={4.5} delay={0.15} dur={1.5} />

            {/* faults */}
            {TRACES.map((d, i) => (
              <Draw
                key={`f${i}`}
                d={d}
                on={zones}
                stroke={V.emerald}
                w={5}
                opacity={0.45}
                delay={0.25 + i * 0.06}
                dur={0.75}
              />
            ))}
            {TRACES.map((d, i) => (
              <FaultFlow key={`ff${i}`} d={d} on={zones} delay={0.7 + i * 0.06} />
            ))}
          </motion.g>
        </motion.g>
      </motion.g>

      {/* ── the city ─────────────────────────────────────────────────────────
          Outside the zooming group so the pin, the rings and the type stay
          crisp while the country scales behind them. */}
      <motion.g
        initial={false}
        animate={{ x: zoom ? FOCUS[0] - TX : 0, y: zoom ? FOCUS[1] - TY : 0 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <g transform={`translate(${r2(TX)} ${r2(TY)})`}>
          {/* halo — only on the marquee step */}
          <motion.g
            initial={false}
            animate={{ scale: zoom ? 1 : 0.4, opacity: zoom ? 1 : 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: zoom ? 0.25 : 0 }}
          >
            <circle cx={0} cy={0} r={112} fill="rgba(0,168,104,0.14)" />
            <circle cx={0} cy={0} r={112} fill="none" stroke="rgba(0,168,104,0.5)" strokeWidth={2} />
          </motion.g>

          <Pulse on={city} delay={0} />
          <Pulse on={city} delay={0.87} />
          <Pulse on={city} delay={1.74} />

          {/* pin: scale pop 1.25 → 1 */}
          <motion.g
            initial={false}
            animate={{ scale: city ? 1 : 1.25, opacity: city ? 1 : 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: city ? 0.1 : 0 }}
          >
            <circle cx={0} cy={0} r={13} fill={V.ember} />
            <circle cx={0} cy={0} r={22} fill="none" stroke={V.ember} strokeWidth={4} />
            <path d={CROSS} fill="none" stroke={V.ember} strokeWidth={4} strokeLinecap="round" />
          </motion.g>

          {/* label + magnitude chip — these are what scale up at step 4 */}
          <motion.g
            initial={false}
            animate={{ scale: zoom ? 1.35 : 1, opacity: city ? 1 : 0, y: city ? 0 : 12 }}
            transition={{
              scale: { duration: 0.9, ease: EASE },
              opacity: { duration: 0.4, ease: EASE, delay: city ? 0.3 : 0 },
              y: { duration: 0.4, ease: EASE, delay: city ? 0.3 : 0 },
            }}
          >
            <text
              x={0}
              y={-74}
              fill={BASE}
              fontSize={36}
              textAnchor="middle"
              className="font-display"
              style={{ fontWeight: 600, letterSpacing: "0.01em" }}
            >
              {t(q.legendCity, lang)}
            </text>
            <g transform={`translate(${-chip.w / 2} -58)`}>
              <rect x={0} y={0} width={chip.w} height={34} rx={17} fill={V.ember} />
              <text
                x={chip.w / 2}
                y={24}
                fill={V.night}
                fontSize={21}
                textAnchor="middle"
                className="font-mono tnum"
                style={{ fontWeight: 700, letterSpacing: "0.06em" }}
              >
                {chip.label}
              </text>
            </g>
          </motion.g>
        </g>
      </motion.g>

      {/* ── what 1966 cost, under the map. Clears for the marquee frame. ───── */}
      <motion.g
        initial={false}
        animate={{ opacity: zoom ? 0 : 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <Tally
          x={56}
          y={598}
          to={N.quake1966.homesDestroyed}
          on={city && !zoom}
          label={t(y66.statHomes, lang)}
          color={V.ember}
          delay={0.35}
        />
        <Tally
          x={462}
          y={598}
          to={N.quake1966.familiesHomeless}
          on={city && !zoom}
          label={t(y66.statFamilies, lang)}
          color={MID}
          delay={0.5}
        />
      </motion.g>
    </svg>
  );
}

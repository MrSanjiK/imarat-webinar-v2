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
  SketchArrow,
  SketchEllipse,
  SketchPath,
  hatch,
  rng,
  wobbleLine,
  wobbleRect,
} from "@/ui/sketch";

/**
 * Vibrodynamic test — chapter 1 ("Zilzila"), dark theme, slot 1000×230.
 *
 * An accelerogram, drawn as the instrument would draw it: exciter on the left,
 * the pen running away to the right, the MSK 8–9 demand band hatched across the
 * chart so the eye can see the record reach it. The trace is a strokeDashoffset
 * reveal gated on `step` — deliberately *not* slaved to `video.currentTime`,
 * which would couple the drawing to playback state and make going backwards
 * render something the forward pass never showed.
 *
 * Step choreography (the slot is not wrapped in a <Reveal>, so all gating lives
 * here; the slide has 4 steps).
 *   0 — empty.
 *   1 — the instrument: both axes, the zero datum, the MSK 8 and MSK 9
 *       envelopes, tick marks and axis labels.
 *   2 — the test: the demand band hatches in, the exciter fires, and the pen
 *       runs the full width over ~1.9 s. The peak is marked and labelled as the
 *       accelerometer's reading.
 *   3 — "SINOVDAN OʻTDI" lands across the tail, rubber-stamped at 4°.
 *
 * Pure function of `step`; no timers, no rAF, no state. Only transform,
 * opacity and strokeDashoffset animate.
 */

// ── Beats ────────────────────────────────────────────────────────────────────

const AT_FRAME = 1;
const AT_TRACE = 2;
const AT_STAMP = 3;

// ── Palette on dark ──────────────────────────────────────────────────────────

const PAPER = "rgba(244,241,234,0.86)";
const PAPER_DIM = "rgba(244,241,234,0.4)";
const ACC = C.leaf; // matches tone.ACCENT.dark, which the slide's legend uses
const GRID = "rgba(244,241,234,0.3)";

// ── Chart frame ──────────────────────────────────────────────────────────────

const BASE_Y = 120; // zero acceleration
const AXIS_X = 62;
const AXIS_TOP = 44;
const AXIS_BOT = 196;
const PLOT_X0 = 92;
const PLOT_X1 = 962;

/** Chart units: how far off the datum each MSK intensity sits. */
const A_MSK_HI = 52;
const A_MSK_LO = 34;
/** The record is scaled so its peak crosses the MSK 9 line by a few units. */
const A_PEAK = 58;
/** Hard ceiling on the opposite excursion, so the pen never touches the frame. */
const A_LIMIT = 68;

const AXIS_V = wobbleLine(AXIS_X, AXIS_TOP, AXIS_X, AXIS_BOT, 11, 1.2);
const AXIS_H = wobbleLine(AXIS_X, AXIS_BOT, PLOT_X1 + 6, AXIS_BOT, 12, 1.2);
const DATUM = wobbleLine(AXIS_X, BASE_Y, PLOT_X1, BASE_Y, 13, 1);

const envelope = (a: number, seed: number) =>
  [
    wobbleLine(AXIS_X, BASE_Y - a, PLOT_X1, BASE_Y - a, seed, 0.9),
    wobbleLine(AXIS_X, BASE_Y + a, PLOT_X1, BASE_Y + a, seed + 1, 0.9),
  ].join(" ");

const ENV_HI = envelope(A_MSK_HI, 21);
const ENV_LO = envelope(A_MSK_LO, 31);

/** Time graduations under the axis, plus amplitude stubs beside it. */
const TICKS = (() => {
  const parts: string[] = [];
  const stepX = (PLOT_X1 - PLOT_X0) / 10;
  for (let i = 0; i <= 10; i++) {
    const x = PLOT_X0 + i * stepX;
    parts.push(wobbleLine(x, AXIS_BOT, x, AXIS_BOT + 7, 200 + i, 0.5));
  }
  for (const a of [A_MSK_LO, A_MSK_HI]) {
    parts.push(wobbleLine(AXIS_X - 7, BASE_Y - a, AXIS_X, BASE_Y - a, 300 + a, 0.5));
    parts.push(wobbleLine(AXIS_X - 7, BASE_Y + a, AXIS_X, BASE_Y + a, 400 + a, 0.5));
  }
  return parts.join(" ");
})();

/** The shaker, straddling the datum where the pen starts. */
const EXCITER_X = 85;
const EXCITER = wobbleRect(70, 104, 30, 32, 61, 1, 1.5);

// ── The record ───────────────────────────────────────────────────────────────

/**
 * How many seconds of shaking the chart stands for. Only used to decide how
 * many carrier cycles fit across the plot, so the drawn wave is honest about
 * the stated frequency rather than decorative.
 */
const RECORD_S = 2.5;
const STEPS = 360;

/**
 * Chosen, not arbitrary: with this seed the record's strongest excursion is the
 * *upward* one and it lands at ~38 % of the chart — clear of the exciter label,
 * and with the opposite excursion comfortably inside the frame.
 */
const TRACE_SEED = 101;

type Trace = { d: string; peak: [number, number] };

/**
 * Seeded RNG × a decaying envelope, baked into one `d`. Never per-frame, never
 * `feTurbulence`: the whole point of pre-baking is that the only thing the
 * browser does at 60 fps is move a dash offset along a path it has already
 * flattened.
 */
function buildTrace(): Trace {
  const r = rng(TRACE_SEED);
  const cycles = N.testing.vibroFrequencyHz * RECORD_S;
  const span = PLOT_X1 - PLOT_X0;

  // Attack fast, decay slow — the shape of a real strong-motion record.
  const ATTACK = 0.1;
  const DECAY = 0.34;

  const raw: number[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const u = i / STEPS;
    const env = (1 - Math.exp(-u / ATTACK)) * Math.exp(-u / DECAY);
    const wave =
      0.72 * Math.sin(2 * Math.PI * cycles * u) +
      0.18 * Math.sin(2 * Math.PI * cycles * 1.7 * u + 0.9) +
      0.1 * Math.sin(2 * Math.PI * cycles * 0.37 * u + 0.4) +
      (r() * 2 - 1) * 0.16;
    raw.push(env * wave);
  }

  // Scale on the upward peak so it crosses MSK 9 by a known amount, but never
  // let the downward swing reach the frame.
  let up = 0;
  let down = 0;
  let peakIndex = 0;
  raw.forEach((v, i) => {
    if (v > up) {
      up = v;
      peakIndex = i;
    }
    if (-v > down) down = -v;
  });
  const k = up > 0 ? Math.min(A_PEAK / up, down > 0 ? A_LIMIT / down : Infinity) : 0;

  const parts: string[] = [];
  raw.forEach((v, i) => {
    const x = PLOT_X0 + (span * i) / STEPS;
    const y = BASE_Y - v * k;
    parts.push(`${i === 0 ? "M" : "L"} ${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`);
  });

  return {
    d: parts.join(" "),
    peak: [PLOT_X0 + (span * peakIndex) / STEPS, BASE_Y - up * k],
  };
}

/**
 * 45° hatch revealed by sliding an oversized mask rect across the box.
 *
 * Not a `scaleX` wipe: motion writes SVG transforms as CSS with
 * `transform-box: fill-box` and falls back to a `50% 50%` origin, so a scaled
 * mask opens from the middle of the box instead of from its edge. A translate
 * is origin-independent and therefore safe.
 */
function HatchWipe({
  x,
  y,
  w,
  h,
  on,
  gap = 8,
  seed = 1,
  stroke,
  width = 1.2,
  opacity = 0.45,
  delay = 0,
  duration = 0.6,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on: boolean;
  gap?: number;
  seed?: number;
  stroke: string;
  width?: number;
  opacity?: number;
  delay?: number;
  duration?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const boxId = `vo-box-${uid}`;
  const wipeId = `vo-wipe-${uid}`;
  const d = useMemo(() => hatch(x, y, w, h, gap, 45, seed), [x, y, w, h, gap, seed]);

  return (
    <g>
      <defs>
        {/* `hatch` overruns its box by design; this clips it back. */}
        <clipPath id={boxId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <clipPath id={wipeId}>
          <motion.rect
            x={x - w - 4}
            y={y - 4}
            width={w + 8}
            height={h + 8}
            initial={false}
            animate={{ x: on ? w + 4 : 0 }}
            transition={{ duration, ease: EASE, delay }}
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
 * The verdict, landing as rubber.
 *
 * The static `translate` lives on an outer `<g>` and only scale/rotate/opacity
 * are animated on the inner one: motion writes animated SVG transforms into
 * `style.transform`, which would otherwise override a `transform` attribute on
 * the same element and drop the stamp at the origin. With `transform-box:
 * fill-box` the inner group's own bounding-box centre is the pivot, which is
 * exactly where a stamp should pivot.
 */
function PassStamp({
  x,
  y,
  text,
  on,
  delay = 0,
  color = ACC,
  size = 28,
  rotate = -4,
}: {
  x: number;
  y: number;
  text: string;
  on: boolean;
  delay?: number;
  color?: string;
  size?: number;
  rotate?: number;
}) {
  const w = text.length * size * 0.66 + 44;
  const h = size + 24;
  const d = useMemo(() => wobbleRect(-w / 2, -h / 2, w, h, 91, 2.2, 4), [w, h]);

  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 1.22, rotate: on ? rotate : rotate - 5 }}
        transition={{ duration: 0.42, ease: EASE, delay }}
      >
        <path d={d} fill="none" stroke={color} strokeWidth={3} opacity={0.95} />
        {/* The stamp lands on the decayed tail of the record, so the trace runs
            straight through the letterforms. The box may keep its overprint —
            that is what a rubber stamp does — but the verdict itself has to
            survive, hence a knockout in the slide's own dark field under the
            glyphs. */}
        <text
          x={0}
          y={size * 0.36}
          fill={color}
          stroke="#1c1b19"
          strokeWidth={7}
          strokeLinejoin="round"
          paintOrder="stroke"
          fontSize={size}
          textAnchor="middle"
          className="font-sans"
          style={{ fontWeight: 800, letterSpacing: "0.05em" }}
        >
          {text}
        </text>
      </motion.g>
    </g>
  );
}

export function VibroOverlay({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.vibro;

  const trace = useMemo(() => buildTrace(), []);

  const frame = step >= AT_FRAME;
  const running = step >= AT_TRACE;
  const passed = step >= AT_STAMP;

  const [peakX, peakY] = trace.peak;

  return (
    <svg viewBox="0 0 1000 230" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* ── Instrument frame ── */}
      <SketchPath d={AXIS_V} on={frame} stroke={PAPER_DIM} width={1.6} duration={0.5} />
      <SketchPath d={AXIS_H} on={frame} stroke={PAPER_DIM} width={1.6} delay={0.12} duration={0.6} />
      <SketchPath d={DATUM} on={frame} stroke={GRID} width={1.2} delay={0.3} duration={0.5} />
      <SketchPath d={ENV_HI} on={frame} stroke={GRID} width={1.2} delay={0.45} duration={0.5} />
      <SketchPath d={ENV_LO} on={frame} stroke={GRID} width={1.1} opacity={0.7} delay={0.55} duration={0.5} />
      <SketchPath d={TICKS} on={frame} stroke={PAPER_DIM} width={1.2} delay={0.6} duration={0.4} />

      {/* Axis labels. The vertical one is rotated by a static attribute on a
          plain <g>, so nothing animated has to reason about the rotation. */}
      <g transform={`rotate(-90 30 ${BASE_Y})`}>
        <Annotation
          x={30}
          y={BASE_Y}
          anchor="middle"
          text={t(q.axisAmp, lang)}
          on={frame}
          delay={0.6}
          size={16}
          color={C.ash}
        />
      </g>
      <Annotation
        x={PLOT_X1}
        y={AXIS_BOT + 24}
        anchor="end"
        text={t(q.axisTime, lang)}
        on={frame}
        delay={0.68}
        size={16}
        color={C.ash}
      />

      {/* MSK levels. "MSK" and "Hz" are notation, not copy — the slide's own
          legend writes them the same way in both alphabets (01-quake.tsx). The
          band gets one label; the two envelopes are numbered at the axis. */}
      <Annotation
        x={PLOT_X1 - 6}
        y={BASE_Y - A_MSK_HI - 10}
        anchor="end"
        text={`MSK ${N.testing.mskFrom}–${N.testing.mskTo}`}
        on={frame}
        delay={0.7}
        size={15}
        color={C.ash}
      />
      <Annotation
        x={AXIS_X - 10}
        y={BASE_Y - A_MSK_HI + 5}
        anchor="end"
        text={String(N.testing.mskTo)}
        on={frame}
        delay={0.76}
        size={14}
        color={C.ash}
      />
      <Annotation
        x={AXIS_X - 10}
        y={BASE_Y - A_MSK_LO + 5}
        anchor="end"
        text={String(N.testing.mskFrom)}
        on={frame}
        delay={0.8}
        size={14}
        color={C.ash}
      />
      <Annotation
        x={AXIS_X + 4}
        y={AXIS_BOT + 24}
        anchor="start"
        text={`${N.testing.vibroFrequencyHz} Hz`}
        on={frame}
        delay={0.84}
        size={15}
        color={C.ash}
      />

      {/* ── Demand band: everything between MSK 8 and MSK 9 ── */}
      <HatchWipe
        x={AXIS_X}
        y={BASE_Y - A_MSK_HI}
        w={PLOT_X1 - AXIS_X}
        h={A_MSK_HI - A_MSK_LO}
        on={running}
        seed={5}
        stroke={C.gold}
        opacity={0.34}
        delay={0}
      />
      <HatchWipe
        x={AXIS_X}
        y={BASE_Y + A_MSK_LO}
        w={PLOT_X1 - AXIS_X}
        h={A_MSK_HI - A_MSK_LO}
        on={running}
        seed={9}
        stroke={C.gold}
        opacity={0.34}
        delay={0.08}
      />

      {/* ── Exciter ── */}
      <SketchPath d={EXCITER} on={running} stroke={C.gold} width={2} delay={0.15} duration={0.35} />
      <SketchArrow
        x1={EXCITER_X}
        y1={BASE_Y}
        x2={EXCITER_X}
        y2={BASE_Y - 13}
        on={running}
        stroke={C.gold}
        width={1.8}
        head={6}
        seed={71}
        delay={0.3}
        duration={0.18}
      />
      <SketchArrow
        x1={EXCITER_X}
        y1={BASE_Y}
        x2={EXCITER_X}
        y2={BASE_Y + 13}
        on={running}
        stroke={C.gold}
        width={1.8}
        head={6}
        seed={72}
        delay={0.34}
        duration={0.18}
      />
      <Annotation
        x={68}
        y={26}
        text={t(q.exciterLabel, lang)}
        on={running}
        delay={0.4}
        size={16}
        color={C.gold}
        leader={{ x: EXCITER_X, y: 99 }}
        seed={73}
      />

      {/* ── The record ── */}
      <SketchPath
        d={trace.d}
        on={running}
        stroke={PAPER}
        width={1.6}
        delay={0.45}
        duration={1.9}
        cap="butt"
      />

      <SketchEllipse
        cx={peakX}
        cy={peakY}
        rx={6}
        seed={77}
        on={running}
        stroke={ACC}
        width={2}
        delay={0.95}
        duration={0.3}
      />
      <Annotation
        x={peakX + 20}
        y={30}
        text={t(q.sensorLabel, lang)}
        on={running}
        delay={1}
        size={16}
        color={ACC}
        leader={{ x: peakX + 8, y: peakY - 10 }}
        seed={78}
      />

      {/* ── Verdict ── */}
      <PassStamp x={762} y={BASE_Y} text={t(q.stamp, lang)} on={passed} delay={0.15} />
    </svg>
  );
}

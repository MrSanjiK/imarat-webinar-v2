"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * VibroOverlay — chapter 1 (dark), slide 09 "Sunʼiy zilzila". Slot 1000 × 230.
 *
 * An accelerogram drawn the way the instrument draws it: exciter on the left,
 * the pen running away to the right, the MSK 8–9 demand band across the chart
 * so the eye can watch the record reach it.
 *
 * v2 "IMARAT Vivid": flat vector. The band is a solid emerald/gold plate wiped
 * in under a clip rect, the trace is a bold 3 px stroke revealed by
 * strokeDashoffset, the sensor pulses in emerald, and the verdict lands as a
 * bold emerald chip.
 *
 * VIDEO SYNC — the interface is unchanged. `step` is the only required prop and
 * it alone gates every build, exactly as today. `videoTime` stays optional: if
 * a caller feeds the playing clip's current time, a live playhead cursor rides
 * the trace on rAF; with nothing passed (today's call site) the diagram is a
 * pure function of `step` and renders identically.
 *
 * Step map (slide q-vibro has 4 steps, 0…3; the slot is NOT inside a <Reveal>,
 * so all gating lives here)
 *   0 — empty.
 *   1 — the instrument: both axes, the zero datum, the MSK 8 and MSK 9
 *       envelopes, graduations and axis labels.
 *   2 — the test. The demand band plates in, the exciter fires (its arrows
 *       pulse), and the pen runs the full width over ~1.9 s. The peak is ringed
 *       and labelled as the accelerometer's reading.
 *   3 — the verdict: a bold emerald chip lands across the tail with
 *       scale 1.25 → 1 and a 4° rotation.
 *
 * Only transform / opacity / strokeDashoffset / clip-path animate.
 */

// ── beats ────────────────────────────────────────────────────────────────────

const AT_FRAME = 1;
const AT_TRACE = 2;
const AT_STAMP = 3;

const BASE = "rgba(244,251,244,0.9)";
const DIM = "rgba(244,251,244,0.35)";
const MID = "rgba(244,251,244,0.6)";

// ── chart frame ──────────────────────────────────────────────────────────────

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

const AXIS_V = `M ${AXIS_X} ${AXIS_TOP} V ${AXIS_BOT}`;
const AXIS_H = `M ${AXIS_X} ${AXIS_BOT} H ${PLOT_X1 + 6}`;
const DATUM = `M ${AXIS_X} ${BASE_Y} H ${PLOT_X1}`;

const envelope = (a: number) =>
  `M ${AXIS_X} ${BASE_Y - a} H ${PLOT_X1} M ${AXIS_X} ${BASE_Y + a} H ${PLOT_X1}`;

const ENV_HI = envelope(A_MSK_HI);
const ENV_LO = envelope(A_MSK_LO);

/** Time graduations under the axis, plus amplitude stubs beside it. */
const TICKS = (() => {
  const parts: string[] = [];
  const stepX = (PLOT_X1 - PLOT_X0) / 10;
  for (let i = 0; i <= 10; i++) {
    const x = Math.round(PLOT_X0 + i * stepX);
    parts.push(`M ${x} ${AXIS_BOT} V ${AXIS_BOT + 8}`);
  }
  for (const a of [A_MSK_LO, A_MSK_HI]) {
    parts.push(`M ${AXIS_X - 8} ${BASE_Y - a} H ${AXIS_X}`);
    parts.push(`M ${AXIS_X - 8} ${BASE_Y + a} H ${AXIS_X}`);
  }
  return parts.join(" ");
})();

/** The shaker, straddling the datum where the pen starts. */
const EXCITER_X = 85;

// ── the record ───────────────────────────────────────────────────────────────

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
 * with the opposite excursion comfortably inside the frame.
 */
const TRACE_SEED = 101;

type Trace = { d: string; peak: [number, number]; pts: Array<[number, number]> };

/**
 * Seeded RNG × a decaying envelope, baked into one `d` at module load. Never
 * per-frame, never `feTurbulence`: the only thing the browser does at 60 fps is
 * move a dash offset along a path it has already flattened.
 */
const TRACE: Trace = (() => {
  let s = TRACE_SEED >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

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

  const pts: Array<[number, number]> = raw.map((v, i) => [
    Math.round((PLOT_X0 + (span * i) / STEPS) * 10) / 10,
    Math.round((BASE_Y - v * k) * 10) / 10,
  ]);

  return {
    d: pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" "),
    peak: [PLOT_X0 + (span * peakIndex) / STEPS, BASE_Y - up * k],
    pts,
  };
})();

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

/** Solid plate arriving by translating a clip rect. */
function PlateWipe({
  x,
  y,
  w,
  h,
  on,
  fill,
  delay = 0,
  dur = 0.6,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on: boolean;
  fill: string;
  delay?: number;
  dur?: number;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <clipPath id={`vo-${uid}`}>
          <motion.rect
            x={x - 1}
            y={y - 1}
            width={w + 2}
            height={h + 2}
            initial={false}
            animate={{ x: on ? 0 : -w - 2 }}
            transition={{ duration: dur, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={fill} clipPath={`url(#vo-${uid})`} />
    </g>
  );
}

function Label({
  x,
  y,
  text,
  on,
  color,
  size = 16,
  anchor = "start",
  leader,
  delay = 0,
  weight = 600,
}: {
  x: number;
  y: number;
  text: string;
  on: boolean;
  color: string;
  size?: number;
  anchor?: "start" | "end" | "middle";
  leader?: { x: number; y: number };
  delay?: number;
  weight?: number;
}) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 6 }}
      transition={{ duration: 0.34, ease: EASE, delay: on ? delay : 0 }}
    >
      {leader && (
        <path
          d={`M ${x + (anchor === "end" ? 6 : anchor === "middle" ? 0 : -6)} ${y - size * 0.34} L ${
            leader.x
          } ${leader.y}`}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          opacity={0.6}
        />
      )}
      <text
        x={x}
        y={y}
        fill={color}
        fontSize={size}
        textAnchor={anchor}
        className="font-mono"
        style={{ fontWeight: weight, letterSpacing: "0.06em" }}
      >
        {text}
      </text>
    </motion.g>
  );
}

/**
 * The verdict, landing as a bold emerald chip.
 *
 * The static translate lives on an outer `<g>` and only scale / rotate /
 * opacity animate on the inner one: Motion writes animated SVG transforms into
 * `style.transform`, which would otherwise override a `transform` attribute on
 * the same element and drop the chip at the origin.
 */
function VerdictChip({
  x,
  y,
  text,
  on,
  delay = 0,
  size = 28,
  rotate = -4,
}: {
  x: number;
  y: number;
  text: string;
  on: boolean;
  delay?: number;
  size?: number;
  rotate?: number;
}) {
  const w = text.length * size * 0.62 + 56;
  const h = size + 32;
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 1.25, rotate: on ? rotate : rotate + 6 }}
        transition={{ duration: 0.42, ease: EASE, delay: on ? delay : 0 }}
      >
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={V.emerald} />
        <text
          x={0}
          y={size * 0.36}
          fill={V.night}
          fontSize={size}
          textAnchor="middle"
          className="font-sans"
          style={{ fontWeight: 800, letterSpacing: "0.04em" }}
        >
          {text}
        </text>
      </motion.g>
    </g>
  );
}

/**
 * Live playhead. Only ever active when a caller feeds `videoTime`; rAF-smoothed
 * so a 4 Hz `timeupdate` does not make the cursor stutter. With no time
 * supplied the hook never schedules a frame and the component stays a pure
 * function of `step`.
 *
 * The target is mirrored into a ref *inside an effect*, not during render: the
 * rAF loop needs the newest value without re-subscribing on every tick.
 */
function usePlayhead(videoTime: number | undefined, on: boolean) {
  const live = videoTime !== undefined && on;
  const [u, setU] = useState(0);
  const target = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    target.current =
      videoTime === undefined ? 0 : Math.min(1, Math.max(0, (videoTime % RECORD_S) / RECORD_S));
  }, [videoTime]);

  useEffect(() => {
    if (!live) return;
    const tick = () => {
      setU((prev) => prev + (target.current - prev) * 0.24);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [live]);

  if (!live) return null;
  const i = Math.min(TRACE.pts.length - 1, Math.max(0, Math.round(u * (TRACE.pts.length - 1))));
  return TRACE.pts[i];
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function VibroOverlay({ step, videoTime }: { step: number; videoTime?: number }) {
  const lang = useLang();
  const q = S.quake.vibro;

  const frame = step >= AT_FRAME;
  const running = step >= AT_TRACE;
  const passed = step >= AT_STAMP;

  const [peakX, peakY] = TRACE.peak;
  const head = usePlayhead(videoTime, running);

  const bandH = A_MSK_HI - A_MSK_LO;
  const bandW = PLOT_X1 - AXIS_X;

  const stamp = useMemo(() => t(q.stamp, lang), [q.stamp, lang]);

  return (
    <svg viewBox="0 0 1000 230" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* ══ instrument frame ════════════════════════════════════════════════ */}
      <Draw d={AXIS_V} on={frame} stroke={MID} w={3} dur={0.5} />
      <Draw d={AXIS_H} on={frame} stroke={MID} w={3} delay={0.12} dur={0.6} />
      <Draw d={DATUM} on={frame} stroke={DIM} w={2} delay={0.3} dur={0.5} />
      <Draw d={ENV_HI} on={frame} stroke={DIM} w={2} delay={0.45} dur={0.5} />
      <Draw d={ENV_LO} on={frame} stroke={DIM} w={2} opacity={0.7} delay={0.55} dur={0.5} />
      <Draw d={TICKS} on={frame} stroke={DIM} w={2} delay={0.6} dur={0.4} />

      {/* Axis labels. The vertical one rotates by a static attribute on a plain
          <g>, so nothing animated has to reason about the rotation. */}
      <g transform={`rotate(-90 28 ${BASE_Y})`}>
        <Label x={28} y={BASE_Y} anchor="middle" text={t(q.axisAmp, lang)} on={frame} color={MID} delay={0.6} />
      </g>
      <Label
        x={PLOT_X1}
        y={AXIS_BOT + 26}
        anchor="end"
        text={t(q.axisTime, lang)}
        on={frame}
        color={MID}
        delay={0.68}
      />

      {/* MSK levels. "MSK" and "Hz" are notation, not copy — the slide's own
          legend writes them the same way in both alphabets. */}
      <Label
        x={PLOT_X1 - 6}
        y={BASE_Y - A_MSK_HI - 12}
        anchor="end"
        text={`MSK ${N.testing.mskFrom}–${N.testing.mskTo}`}
        on={frame}
        color={V.gold}
        size={16}
        delay={0.7}
        weight={700}
      />
      <Label
        x={AXIS_X - 12}
        y={BASE_Y - A_MSK_HI + 5}
        anchor="end"
        text={String(N.testing.mskTo)}
        on={frame}
        color={MID}
        size={15}
        delay={0.76}
      />
      <Label
        x={AXIS_X - 12}
        y={BASE_Y - A_MSK_LO + 5}
        anchor="end"
        text={String(N.testing.mskFrom)}
        on={frame}
        color={MID}
        size={15}
        delay={0.8}
      />
      <Label
        x={AXIS_X + 4}
        y={AXIS_BOT + 26}
        text={`${N.testing.vibroFrequencyHz} Hz`}
        on={frame}
        color={MID}
        size={15}
        delay={0.84}
      />

      {/* ══ demand band: everything between MSK 8 and MSK 9 ═════════════════ */}
      <PlateWipe
        x={AXIS_X}
        y={BASE_Y - A_MSK_HI}
        w={bandW}
        h={bandH}
        on={running}
        fill="rgba(240,178,62,0.22)"
      />
      <PlateWipe
        x={AXIS_X}
        y={BASE_Y + A_MSK_LO}
        w={bandW}
        h={bandH}
        on={running}
        fill="rgba(240,178,62,0.22)"
        delay={0.08}
      />

      {/* ══ exciter ═════════════════════════════════════════════════════════ */}
      <motion.g
        initial={false}
        animate={{ scale: running ? 1 : 1.25, opacity: running ? 1 : 0 }}
        transition={{ duration: 0.35, ease: EASE, delay: running ? 0.15 : 0 }}
      >
        {/* The block is centred on (EXCITER_X, BASE_Y), so motion's fill-box
            default already pops it about the shaker's own axis. */}
        <rect x={EXCITER_X - 16} y={BASE_Y - 18} width={32} height={36} rx={6} fill={V.gold} />
      </motion.g>
      {/* The shaker firing: one scaleY pulse per direction, transform only. */}
      {[-1, 1].map((s) => (
        <motion.g
          key={s}
          initial={false}
          animate={{ scaleY: running ? [0.5, 1.25, 0.5] : 0.5, opacity: running ? 1 : 0 }}
          transition={{
            scaleY: running
              ? { duration: 0.55, ease: "easeInOut", repeat: Infinity, delay: s === -1 ? 0.3 : 0.42 }
              : { duration: 0.2 },
            opacity: { duration: 0.25, delay: running ? 0.3 : 0 },
          }}
          // Each arrow must stretch AWAY from the shaker, so it pivots on the
          // edge of its own box nearest BASE_Y. motion sets
          // `transform-box: fill-box` on animated SVG, so that edge is 0% for
          // the arrow below and 100% for the one above.
          style={{ transformOrigin: s === 1 ? "50% 0%" : "50% 100%" }}
        >
          <path
            d={`M ${EXCITER_X} ${BASE_Y + s * 20} L ${EXCITER_X - 7} ${BASE_Y + s * 30} M ${EXCITER_X} ${
              BASE_Y + s * 20
            } L ${EXCITER_X + 7} ${BASE_Y + s * 30} M ${EXCITER_X} ${BASE_Y + s * 18} V ${BASE_Y + s * 32}`}
            fill="none"
            stroke={V.gold}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </motion.g>
      ))}
      <Label
        x={62}
        y={26}
        text={t(q.exciterLabel, lang)}
        on={running}
        color={V.gold}
        size={16}
        leader={{ x: EXCITER_X, y: BASE_Y - 22 }}
        delay={0.4}
      />

      {/* ══ the record ══════════════════════════════════════════════════════ */}
      <Draw d={TRACE.d} on={running} stroke={BASE} w={3} delay={0.45} dur={1.9} cap="butt" />

      {/* Sensor: a ringed peak with an emerald pulse. */}
      <g transform={`translate(${peakX} ${peakY})`}>
        <motion.g
          initial={false}
          animate={{ scale: running ? [0.4, 1.5] : 0.4, opacity: running ? [0.65, 0] : 0 }}
          transition={
            running ? { duration: 1.9, ease: EASE, repeat: Infinity, delay: 1.0 } : { duration: 0.2 }
          }
        >
          <circle cx={0} cy={0} r={18} fill="none" stroke={V.leaf} strokeWidth={3} />
        </motion.g>
        <motion.g
          initial={false}
          animate={{ scale: running ? 1 : 1.25, opacity: running ? 1 : 0 }}
          transition={{ duration: 0.35, ease: EASE, delay: running ? 0.95 : 0 }}
        >
          <circle cx={0} cy={0} r={8} fill={V.leaf} />
          <circle cx={0} cy={0} r={14} fill="none" stroke={V.leaf} strokeWidth={3} />
        </motion.g>
      </g>
      <Label
        x={peakX + 22}
        y={28}
        text={t(q.sensorLabel, lang)}
        on={running}
        color={V.leaf}
        size={16}
        leader={{ x: peakX + 10, y: peakY - 16 }}
        delay={1}
        weight={700}
      />

      {/* Live playhead — only ever rendered when a caller feeds `videoTime`. */}
      {head && (
        <g transform={`translate(${head[0]} 0)`}>
          <rect x={-1.5} y={AXIS_TOP} width={3} height={AXIS_BOT - AXIS_TOP} fill={V.leaf} opacity={0.45} />
          <circle cx={0} cy={head[1]} r={7} fill={V.leaf} />
        </g>
      )}

      {/* ══ verdict ═════════════════════════════════════════════════════════ */}
      <VerdictChip x={758} y={BASE_Y} text={stamp} on={passed} delay={0.15} />
    </svg>
  );
}

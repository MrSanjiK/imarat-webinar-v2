"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * DebtStory — v2 "IMARAT Vivid". Bold flat vector; no pencil, no sketch kit.
 *
 * One 1600×500 board with two halves that share the slide's argument: the
 * contract on the left (three duration bars), the people on the right (a
 * hundred buyers as a dot grid). The eye compares a promise to its outcome
 * without being told to.
 *
 * Step map (03-ready / ReadyDebt, 5 steps):
 *   0  empty board. The title is still landing above it.
 *   1  THE PLAN. Three bars draw left→right on a shared year scale, staggered:
 *      payment 4–4,5 y (gold — it is money), construction 2–2,5 y (ink),
 *      living-while-paying 2–2,5 y (emerald). Each carries its figure and its
 *      label from `S.ready.debt.planBars`.
 *   2  THE REALITY. The bars drop to 0.42 and a 10×10 grid lands on the right.
 *      85 of the 100 ink discs drain to hollow ember rings on a 12 ms stagger,
 *      then the ember tally under them. The 220 mlrd counter lives on the slide
 *      in gold — money is never ember, the default is.
 *   3  THE RESULT. The bars come back up, the grid sits back to 0.34, and the
 *      construction bar runs an ember tail past its plan. A dashed ash ghost
 *      holds the promised end so the overrun is measured, not just felt.
 *   4  TODAY. The ember tail retracts toward the ghost — toward, not to — and
 *      an emerald trend curve rises underneath. Recovery, not completion.
 *
 * Pure function of `step`: no timers, no state, every `on` monotonic. Arriving
 * backward renders exactly what arriving forward rendered. Only transform /
 * opacity / strokeDashoffset animate — all compositor-cheap under Zoom.
 */

// ── board ───────────────────────────────────────────────────────────────────
const W = 1600;
const H = 500;

/** Left half: the contract. Figure + label column, then the bars. */
const COL_X = 40;
const X0 = 380;
const U = 128; // px per year
const BAR_W = 46; // stroke width — the bars are round-capped strokes

/** Baseline of the figure in each row; the label sits 30 px under it. */
const FIG_Y = [88, 218, 348];
const BAR_Y = FIG_Y.map((y) => y + 2);

/** Right half: the hundred buyers. */
const G_X = 1250;
const G_Y = 96;
const G_GAP = 34;
const DISC_R = 12;
const RING_R = 11;

const YEARS = [
  N.debt.planPayYears[1],
  N.debt.planBuildYears[1],
  N.debt.planLiveYears[1],
] as const;

const BAR_COLOR = [V.gold, V.ink, V.emerald] as const;

/** Editorial, not sourced: the slip is drawn as double the promised build… */
const STRETCH = 2;
/** …and today about half of that overrun has been given back. */
const RECOVERED = 0.48;

const DEFAULTED = Math.round(N.debt.defaultShare * 100);

// ── primitives ──────────────────────────────────────────────────────────────

/** A stroke that draws itself on. pathLength=1, so dashoffset runs 1 → 0. */
function Draw({
  d,
  on,
  stroke,
  width = 5,
  delay = 0,
  duration = 0.7,
}: {
  d: string;
  on: boolean;
  stroke: string;
  width?: number;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      initial={false}
      animate={{ strokeDashoffset: on ? 0 : 1 }}
      transition={{ duration: on ? duration : 0.3, ease: EASE, delay: on ? delay : 0 }}
    />
  );
}

/**
 * One duration bar. Geometry is baked at its full length and revealed by
 * `strokeDashoffset`, so lengthening (step 3) and retracting (step 4) are the
 * same motion and nothing ever animates a width.
 */
function Bar({
  y,
  x,
  len,
  frac,
  color,
  delay = 0,
  duration = 0.8,
}: {
  y: number;
  x: number;
  len: number;
  /** 0 → hidden, 1 → drawn to `len`. */
  frac: number;
  color: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.line
      x1={x}
      y1={y}
      x2={x + len}
      y2={y}
      stroke={color}
      strokeWidth={BAR_W}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="1 1"
      initial={false}
      animate={{ strokeDashoffset: 1 - frac }}
      transition={{ duration: frac > 0 ? duration : 0.3, ease: EASE, delay: frac > 0 ? delay : 0 }}
    />
  );
}

/** Seeded shuffle so the same 85 buyers drain every run, forward or backward. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CELLS = Array.from({ length: 100 }, (_, i) => ({
  i,
  cx: G_X + (i % 10) * G_GAP,
  cy: G_Y + Math.floor(i / 10) * G_GAP,
}));

// ── the diagram ─────────────────────────────────────────────────────────────

export function DebtStory({ step }: { step: number }) {
  const lang = useLang();
  const d = S.ready.debt;

  const plan = step >= 1;
  const real = step >= 2;
  const slip = step >= 3;
  const back = step >= 4;

  // Which buyers drain, and in what order.
  const { out, order } = useMemo(() => {
    const idx = Array.from({ length: 100 }, (_, i) => i);
    const r = rng(20260809);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const out = new Array<boolean>(100).fill(false);
    const order = new Array<number>(100).fill(0);
    idx.slice(0, DEFAULTED).forEach((k, n) => {
      out[k] = true;
      order[k] = n;
    });
    return { out, order };
  }, []);

  const planLen = YEARS[1] * U;
  const overrun = planLen * (STRETCH - 1);
  const overrunFrac = back ? RECOVERED : slip ? 1 : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
    >
      {/* ── THE PLAN ──────────────────────────────────────────────────────── */}
      <motion.g
        initial={false}
        animate={{ opacity: !plan ? 0 : real && !slip ? 0.42 : 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {[0, 1, 2].map((i) => {
          const stagger = step === 1 ? i * 0.12 : 0;
          return (
            <g key={i}>
              {/* figure + label, left column */}
              <motion.g
                initial={false}
                animate={{ opacity: plan ? 1 : 0, x: plan ? 0 : -14 }}
                transition={{ duration: 0.45, ease: EASE, delay: stagger + 0.06 }}
              >
                <text
                  x={COL_X}
                  y={FIG_Y[i]}
                  fontSize={32}
                  fontWeight={600}
                  letterSpacing="-0.01em"
                  fill={V.ink}
                  className="font-display tnum"
                >
                  {t(d.planBars[i].v, lang)}
                </text>
                <text x={COL_X} y={FIG_Y[i] + 32} fontSize={20} fill={V.ash} className="font-sans">
                  {t(d.planBars[i].t, lang)}
                </text>
              </motion.g>

              {/* the ember overrun rides under the ink bar, so the round caps
                  meet cleanly and the tail reads as an extension of it */}
              {i === 1 && (
                <Bar
                  y={BAR_Y[i]}
                  x={X0 + planLen}
                  len={overrun}
                  frac={overrunFrac}
                  color={V.ember}
                  delay={slip ? 0.12 : 0}
                  duration={0.85}
                />
              )}

              <Bar
                y={BAR_Y[i]}
                x={X0}
                len={YEARS[i] * U}
                frac={plan ? 1 : 0}
                color={BAR_COLOR[i]}
                delay={stagger}
              />
            </g>
          );
        })}

        {/* the promise, held as a dashed memory once the bar runs past it */}
        <motion.line
          x1={X0 + planLen}
          y1={BAR_Y[1] - 46}
          x2={X0 + planLen}
          y2={BAR_Y[1] + 46}
          stroke={V.ash}
          strokeWidth={3}
          strokeDasharray="10 9"
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: slip ? 1 : 0, scaleY: slip ? 1 : 0.6 }}
          transition={{ duration: 0.4, ease: EASE, delay: slip ? 0.1 : 0 }}
          style={{ transformOrigin: `${X0 + planLen}px ${BAR_Y[1]}px` }}
        />
      </motion.g>

      {/* ── TODAY: the trend turns back up ────────────────────────────────── */}
      {/* Aimed at the ghost, not past it: the curve lands on the x where the
          construction bar was promised to end. */}
      <Draw
        d={`M ${COL_X + 20} 472 Q 400 480 ${X0 + planLen} 410`}
        on={back}
        stroke={V.emerald}
        width={5}
        delay={0.28}
        duration={0.9}
      />
      <Draw
        d={`M ${X0 + planLen} 410 l -22 20 M ${X0 + planLen} 410 l -29 -7`}
        on={back}
        stroke={V.emerald}
        width={5}
        delay={1.1}
        duration={0.24}
      />

      {/* ── THE REALITY: 100 buyers, 85 stop paying ───────────────────────── */}
      <motion.g
        initial={false}
        animate={{ opacity: slip ? 0.34 : real ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <motion.rect
          x={1214}
          y={60}
          width={378}
          height={378}
          rx={30}
          fill={V.paper2}
          initial={false}
          animate={{ opacity: real ? 1 : 0, scale: real ? 1 : 0.93 }}
          transition={{ duration: 0.55, ease: EASE }}
          style={{ transformOrigin: `${1214 + 189}px ${60 + 189}px` }}
        />

        {/* Hollow rings sit underneath, fully covered until their disc drains. */}
        {CELLS.map((c) =>
          out[c.i] ? (
            <circle
              key={`r${c.i}`}
              cx={c.cx}
              cy={c.cy}
              r={RING_R}
              fill="none"
              stroke={V.ember}
              strokeWidth={3}
            />
          ) : null,
        )}

        {CELLS.map((c) =>
          out[c.i] ? (
            <motion.circle
              key={`d${c.i}`}
              cx={c.cx}
              cy={c.cy}
              r={DISC_R}
              fill={V.ink}
              initial={false}
              animate={{ opacity: real ? 0 : 1, scale: real ? 0.3 : 1 }}
              transition={
                real
                  ? { duration: 0.34, ease: EASE, delay: 0.42 + order[c.i] * 0.012 }
                  : { duration: 0.01 }
              }
              style={{ transformOrigin: `${c.cx}px ${c.cy}px` }}
            />
          ) : (
            <circle key={`d${c.i}`} cx={c.cx} cy={c.cy} r={DISC_R} fill={V.ink} />
          ),
        )}

        <motion.text
          x={G_X + (G_GAP * 9) / 2}
          y={478}
          textAnchor="middle"
          fontSize={30}
          letterSpacing="0.1em"
          fill={V.ember}
          className="font-mono tnum"
          initial={false}
          animate={{ opacity: real ? 1 : 0, y: real ? 0 : 10 }}
          transition={{ duration: 0.44, ease: EASE, delay: real ? 1.34 : 0 }}
        >
          {`${DEFAULTED} / 100`}
        </motion.text>
      </motion.g>
    </svg>
  );
}

"use client";

import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { C, SketchArrow, SketchPath, SketchRect, hatch, rng, wobbleLine } from "@/ui/sketch";

/**
 * DebtStory — why the $9 700 apartments exist.
 *
 * Step choreography (slide 03-ready / ReadyDebt, 5 steps):
 *   0  nothing. The title and lead are still landing above.
 *   1  the promise: a year axis plus three plan bars (payment / construction /
 *      living-while-paying) draw in left to right, staggered, each with its
 *      label and duration. Ink and ash.
 *   2  reality: a 10x10 grid of buyers fades in and 85 of them drain from a
 *      solid ink disc to a hollow ember ring, staggered 12 ms apart. The bars
 *      dim so the eye goes right. (The 220 mlrd / 85% counters live on the
 *      slide, not here — deliberately not duplicated.)
 *   3  the result: the construction bar stretches right to 2x its promised
 *      length. A dashed ash ghost marks where it used to end; the slipped tail
 *      is hatched in ember.
 *   4  today: the bar retracts partway back toward the ghost — not to it — and
 *      a forest-green trend arrow rises. Recovery, not completion.
 *
 * Pure function of `step`: no timers, no state. Backward renders what forward
 * rendered. Only transform / opacity / strokeDashoffset ever animate.
 */

// ── Geometry ────────────────────────────────────────────────────────────────
const VW = 1090;
const VH = 464;

const X0 = 60; // bar origin / axis zero
const U = 122; // px per year
const AXIS_Y = 54;
const AXIS_MAX = 5.1; // years of ruled axis
const TICKS = [1, 2, 3, 4, 5];

const BAR_H = 42;
const LABEL_Y = [88, 180, 272]; // text baseline of each row
const BAR_Y = LABEL_Y.map((y) => y + 14);
const VALUE_X = 682; // right edge for the duration text

// Sample-of-100 grid, right hand side.
const G_X = 780;
const G_Y = 76;
const G_GAP = 30;
const RING_R = 9.5;
const DISC_R = 10.5;

const YEARS = {
  pay: N.debt.planPayYears[1],
  build: N.debt.planBuildYears[1],
  live: N.debt.planLiveYears[1],
} as const;

/** Editorial, not sourced: the slip is drawn as double the promised build. */
const STRETCHED = YEARS.build * 2;
/** …and today it has come back about half of that overrun. */
const RECOVERED = YEARS.build * 1.48;

export function DebtStory({ step }: { step: number }) {
  const lang = useLang();
  const d = S.ready.debt;

  const on1 = step >= 1;
  const on2 = step >= 2;
  const on3 = step >= 3;
  const on4 = step >= 4;

  // Current length of each bar, in px. Only the construction bar moves.
  const buildLen = (on4 ? RECOVERED : on3 ? STRETCHED : YEARS.build) * U;
  const lens = [YEARS.pay * U, buildLen, YEARS.live * U];
  const maxLens = [YEARS.pay * U, STRETCHED * U, YEARS.live * U];

  const ghostX = X0 + YEARS.build * U;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* ── Plan: axis, bars, labels ─────────────────────────────────────── */}
      <motion.g
        initial={false}
        animate={{ opacity: !on1 ? 0 : on2 && !on3 ? 0.5 : 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <YearAxis on={on1} />

        {[0, 1, 2].map((i) => {
          const delay = step === 1 ? i * 0.13 : 0;
          return (
            <g key={i}>
              <motion.g
                initial={false}
                animate={{ opacity: on1 ? 1 : 0, x: on1 ? 0 : -10 }}
                transition={{ duration: 0.4, ease: EASE, delay: delay + 0.06 }}
              >
                <text x={X0} y={LABEL_Y[i]} fontSize={27} fill={C.ink} className="font-sans">
                  {t(d.planBars[i].t, lang)}
                </text>
                <text
                  x={VALUE_X}
                  y={LABEL_Y[i]}
                  fontSize={26}
                  fill={C.ash}
                  textAnchor="end"
                  className="font-hand tnum"
                >
                  {t(d.planBars[i].v, lang)}
                </text>
              </motion.g>

              <PlanBar
                x={X0}
                y={BAR_Y[i]}
                h={BAR_H}
                maxLen={maxLens[i]}
                len={lens[i]}
                on={on1}
                seed={17 + i * 31}
                delay={delay}
                emberFrom={i === 1 ? YEARS.build * U : undefined}
                emberOn={on3}
              />
            </g>
          );
        })}

        {/* Ghost of the promised construction end. */}
        <Ghost x={ghostX} y={BAR_Y[1]} h={BAR_H} on={on3} />
      </motion.g>

      {/* ── Reality: 100 buyers, 85 stop paying ──────────────────────────── */}
      <BuyerGrid step={step} />

      {/* ── Today: the trend turns back up ───────────────────────────────── */}
      {/* Slow start, then a rise — "sekinlik bilan … qaytmoqda". Sits in the
          band under the bars, clear of the buyer grid on the right. */}
      <SketchArrow
        x1={120}
        y1={446}
        x2={640}
        y2={374}
        seed={71}
        curve={18}
        head={22}
        on={on4}
        stroke={C.forest}
        width={3.2}
        duration={0.8}
        delay={0.2}
      />
    </svg>
  );
}

// ── Year axis with faint verticals ──────────────────────────────────────────

function YearAxis({ on }: { on: boolean }) {
  const axis = useMemo(
    () => wobbleLine(X0 - 8, AXIS_Y, X0 + AXIS_MAX * U, AXIS_Y, 5, 1.2),
    [],
  );
  return (
    <g>
      <SketchPath d={axis} on={on} stroke={C.ash} width={1.5} opacity={0.7} duration={0.85} />
      {TICKS.map((n) => {
        const x = X0 + n * U;
        return (
          <motion.g
            key={n}
            initial={false}
            animate={{ opacity: on ? 1 : 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.2 + n * 0.05 }}
          >
            <line
              x1={x}
              y1={AXIS_Y}
              x2={x}
              y2={336}
              stroke="rgba(43,42,40,0.13)"
              strokeWidth={1.5}
            />
            <text
              x={x}
              y={42}
              fontSize={20}
              fill={C.ash}
              textAnchor="middle"
              className="font-mono tnum"
            >
              {n}
            </text>
          </motion.g>
        );
      })}
      <motion.line
        x1={X0}
        y1={AXIS_Y}
        x2={X0}
        y2={336}
        stroke="rgba(43,42,40,0.13)"
        strokeWidth={1.5}
        initial={false}
        animate={{ opacity: on ? 1 : 0 }}
        transition={{ duration: 0.3, ease: EASE, delay: 0.2 }}
      />
    </g>
  );
}

// ── One pencil bar that can lengthen without animating `width` ──────────────
/**
 * Geometry is baked once at `maxLen`. The visible length is driven by
 * `strokeDashoffset` on the two long edges, a `scaleX` on the hatch clip, and a
 * `translateX` on the end cap — so growing and shrinking are the same motion.
 */
function PlanBar({
  x,
  y,
  h,
  maxLen,
  len,
  on,
  seed,
  delay = 0,
  emberFrom,
  emberOn = false,
}: {
  x: number;
  y: number;
  h: number;
  maxLen: number;
  len: number;
  on: boolean;
  seed: number;
  delay?: number;
  /** Offset from `x` where the "slipped" ember tail begins. */
  emberFrom?: number;
  emberOn?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const wipeId = `bar-wipe-${uid}`;
  const boxId = `bar-box-${uid}`;
  const tailWipeId = `bar-tailwipe-${uid}`;
  const tailBoxId = `bar-tailbox-${uid}`;

  const g = useMemo(() => {
    const tailX = x + (emberFrom ?? 0);
    const tailW = Math.max(0, maxLen - (emberFrom ?? 0));
    return {
      top: wobbleLine(x, y, x + maxLen, y, seed + 1, 1.3),
      bottom: wobbleLine(x, y + h, x + maxLen, y + h, seed + 2, 1.3),
      capL: wobbleLine(x, y - 2, x, y + h + 2, seed + 3, 1.1),
      capR: wobbleLine(x + maxLen, y - 2, x + maxLen, y + h + 2, seed + 4, 1.1),
      ink: hatch(x, y, maxLen, h, 11, 45, seed + 5),
      tailX,
      tailW,
      tail: tailW > 0 ? hatch(tailX, y, tailW, h, 8, 45, seed + 6) : "",
    };
  }, [x, y, h, maxLen, seed, emberFrom]);

  const frac = maxLen > 0 ? len / maxLen : 0;
  const inkLen = emberFrom != null ? Math.min(len, emberFrom) : len;
  const tailFrac =
    emberFrom != null && emberOn && g.tailW > 0
      ? Math.min(1, Math.max(0, (len - emberFrom) / g.tailW))
      : 0;

  const grow = { duration: 0.75, ease: EASE, delay };

  return (
    <g>
      <defs>
        <clipPath id={boxId}>
          <rect x={x} y={y} width={maxLen} height={h} />
        </clipPath>
        {/* Sliding mask, not scaleX: motion overwrites `transform-origin` with
            50% 50% on SVG, so a scale wipe would open from the middle. */}
        <clipPath id={wipeId}>
          <motion.rect
            x={x}
            y={y - 4}
            width={maxLen}
            height={h + 8}
            initial={false}
            animate={{ x: (on ? inkLen : 0) - maxLen }}
            transition={{ ...grow, delay: delay + 0.1 }}
          />
        </clipPath>
        {g.tailW > 0 && (
          <>
            <clipPath id={tailBoxId}>
              <rect x={g.tailX} y={y} width={g.tailW} height={h} />
            </clipPath>
            <clipPath id={tailWipeId}>
              <motion.rect
                x={g.tailX}
                y={y - 4}
                width={g.tailW}
                height={h + 8}
                initial={false}
                animate={{ x: (tailFrac - 1) * g.tailW }}
                transition={{ ...grow, delay: delay + 0.1 }}
              />
            </clipPath>
          </>
        )}
      </defs>

      {/* Ink hatch — the promised span. */}
      <g clipPath={`url(#${boxId})`}>
        <g clipPath={`url(#${wipeId})`}>
          <path d={g.ink} fill="none" stroke={C.ink} strokeWidth={1.5} opacity={0.3} />
        </g>
      </g>

      {/* Ember hatch — the slip. */}
      {g.tailW > 0 && (
        <g clipPath={`url(#${tailBoxId})`}>
          <g clipPath={`url(#${tailWipeId})`}>
            <path d={g.tail} fill="none" stroke={C.ember} strokeWidth={1.6} opacity={0.55} />
          </g>
        </g>
      )}

      {/* Long edges: dashoffset stops the stroke exactly at the current length. */}
      <Edge d={g.top} frac={on ? frac : 0} delay={delay} />
      <Edge d={g.bottom} frac={on ? frac : 0} delay={delay + 0.05} />

      <SketchPath d={g.capL} on={on} stroke={C.ink} width={2.4} delay={delay} duration={0.3} />

      {/* End cap rides the edge instead of being redrawn. */}
      <motion.g
        initial={false}
        animate={{ x: on ? len - maxLen : -maxLen, opacity: on ? 1 : 0 }}
        transition={{
          x: grow,
          opacity: { duration: 0.25, delay: on ? delay + 0.5 : 0 },
        }}
      >
        <path
          d={g.capR}
          fill="none"
          stroke={C.ink}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>
    </g>
  );
}

/** A baked pencil edge revealed to an arbitrary fraction of its length. */
function Edge({ d, frac, delay }: { d: string; frac: number; delay: number }) {
  return (
    <motion.path
      d={d}
      pathLength={1}
      fill="none"
      stroke={C.ink}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={1}
      initial={false}
      animate={{ strokeDashoffset: 1 - frac }}
      transition={{ duration: 0.75, ease: EASE, delay }}
      style={{ strokeDasharray: 1 }}
    />
  );
}

// ── Dashed memory of where the bar used to end ──────────────────────────────

function Ghost({ x, y, h, on }: { x: number; y: number; h: number; on: boolean }) {
  // Asymmetric overhang: plenty of room above, but the next row's label sits
  // just below the bar.
  const d = useMemo(() => wobbleLine(x, y - 26, x, y + h + 8, 44, 1.1), [x, y, h]);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={C.ash}
      strokeWidth={2.2}
      strokeDasharray="8 7"
      strokeLinecap="round"
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={{ duration: 0.32, ease: EASE, delay: on ? 0.1 : 0 }}
    />
  );
}

// ── 100 buyers; 85 stop paying ──────────────────────────────────────────────

const CELLS = Array.from({ length: 100 }, (_, i) => ({
  i,
  cx: G_X + (i % 10) * G_GAP,
  cy: G_Y + Math.floor(i / 10) * G_GAP,
}));

function BuyerGrid({ step }: { step: number }) {
  const on = step >= 2;

  // Which dots drain, and in what order. Seeded, so it is identical every run
  // and identical going backwards.
  const { out, order } = useMemo(() => {
    const count = Math.round(N.debt.defaultShare * 100);
    const idx = Array.from({ length: 100 }, (_, i) => i);
    const r = rng(20260809);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const out = new Array<boolean>(100).fill(false);
    const order = new Array<number>(100).fill(0);
    idx.slice(0, count).forEach((k, n) => {
      out[k] = true;
      order[k] = n;
    });
    return { out, order };
  }, []);

  return (
    <motion.g
      initial={false}
      animate={{ opacity: step >= 3 ? 0.4 : on ? 1 : 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <SketchRect
        x={758}
        y={54}
        w={314}
        h={314}
        seed={63}
        amp={1.6}
        on={on}
        stroke={C.ash}
        width={1.5}
        opacity={0.4}
        duration={0.9}
      />

      {/* Rings sit underneath, fully covered by the discs until they drain. */}
      {CELLS.map((c) => (
        <circle
          key={`r${c.i}`}
          cx={c.cx}
          cy={c.cy}
          r={RING_R}
          fill="none"
          stroke={out[c.i] ? C.ember : C.ink}
          strokeWidth={1.6}
          opacity={out[c.i] ? 0.9 : 0.3}
        />
      ))}

      {/* Discs. Only the 85 that default carry an animation. */}
      {CELLS.map((c) =>
        out[c.i] ? (
          <motion.g
            key={`d${c.i}`}
            initial={false}
            animate={{ opacity: on ? 0 : 1, scale: on ? 0.3 : 1 }}
            transition={
              on
                ? { duration: 0.36, ease: EASE, delay: 0.5 + order[c.i] * 0.012 }
                : { duration: 0.01, delay: 0.4 }
            }
          >
            <circle cx={c.cx} cy={c.cy} r={DISC_R} fill={C.ink} />
          </motion.g>
        ) : (
          <circle key={`d${c.i}`} cx={c.cx} cy={c.cy} r={DISC_R} fill={C.ink} />
        ),
      )}
    </motion.g>
  );
}

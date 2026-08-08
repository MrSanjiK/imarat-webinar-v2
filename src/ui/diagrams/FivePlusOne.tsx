"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { CountUp, V } from "@/ui/vivid";

/**
 * FivePlusOne — chapter 4, the 5+1 offer. Slot is exactly 1020 × 580 stage px.
 *
 * Upper band: six apartment glyphs. Five draw on in emerald (`pathLength`); the
 * sixth waits as a dashed gold outline and then fills solid gold. Lower band:
 * the linked dial — the discount you get is the percentage you paid, so the two
 * rings sweep to the same fraction and the two counters run simultaneously.
 *
 * Step map (VipFivePlusOne, 4 steps)
 *   0 — six dashed ghosts and two empty dial tracks. Reserved, not blank.
 *   1 — the five paid units draw left to right, 0.06 apart; the "+" pops and
 *       the count lands under the group. The sixth stays dashed.
 *   2 — both rings sweep to `N.vip.ladder[0]` and both counters run at once:
 *       50 paid, 50 off.
 *   3 — both run on to `N.vip.ladder[1]` — 100 paid, 100 off — and the sixth
 *       unit fills gold under its label.
 *
 * The counter is one `CountUp` per rung, stacked and cross-faded: `CountUp`
 * only re-runs when its `on` flips, so a single instance whose `to` changed
 * from 50 to 100 would silently keep printing 50. Each rung owning its own
 * instance also means stepping backward lands on the earlier rung's final
 * value instantly, which is what arriving backward must look like.
 *
 * Only transform, opacity, pathLength and strokeDashoffset animate.
 */

const SLOT_W = 1020;
const SLOT_H = 580;

const LADDER = N.vip.ladder;

/** Which step each rung of the ladder belongs to. */
const RUNGS = LADDER.map((r, i) => ({ at: i + 2, paid: r.paid, discount: r.discount }));

// ── upper band: the units ────────────────────────────────────────────────────

const UNIT = { w: 120, h: 154 } as const;
/** Five in a row, a wide gap for the "+", then the sixth. */
const UNIT_X = [0, 138, 276, 414, 552, 822] as const;
const BONUS_I = UNIT_X.length - 1;
const FIVE_RIGHT = UNIT_X[4] + UNIT.w; // 672
const PLUS_X = (FIVE_RIGHT + UNIT_X[5]) / 2; // 747

/** A flat elevation: four windows over a door, in one stroke pass. */
const UNIT_D = (() => {
  const { w, h } = UNIT;
  const ww = 28;
  const wh = 24;
  const c1 = 22;
  const c2 = w - c1 - ww;
  const r1 = 24;
  const r2 = 68;
  const dw = 38;
  const dh = 46;
  const dx = (w - dw) / 2;
  const box = (x: number, y: number, bw: number, bh: number) =>
    `M${x} ${y}H${x + bw}V${y + bh}H${x}Z`;
  return [
    box(1.5, 1.5, w - 3, h - 3),
    box(c1, r1, ww, wh),
    box(c2, r1, ww, wh),
    box(c1, r2, ww, wh),
    box(c2, r2, ww, wh),
    `M${dx} ${h - 1.5}V${h - dh}H${dx + dw}V${h - 1.5}`,
  ].join(" ");
})();

// ── lower band: the linked dial ──────────────────────────────────────────────

/** The ring is sized around the widest reading — "100%" set in Unbounded, a
 *  very wide display face. At 54 px it measures ~187, and the chord across the
 *  glyph band has to clear that or the percent sign runs into the stroke. */
const DIAL_Y = 266;
const R = 124;
const STROKE = 18;
const SIZE = (R + STROKE) * 2; // 284
const CIRC = 2 * Math.PI * R;
const READING = 54;
const DIAL_X = [30, 606] as const;

function Dial({
  x,
  step,
  frac,
  color,
  readings,
  label,
}: {
  x: number;
  step: number;
  frac: number;
  color: string;
  readings: { at: number; value: number }[];
  label: string;
}) {
  const on = step >= readings[0].at;
  // The rung currently being read; -1 before the dial opens.
  let active = -1;
  readings.forEach((r, i) => {
    if (step >= r.at) active = i;
  });

  return (
    <div style={{ position: "absolute", left: x, top: DIAL_Y, width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <circle
          cx={R + STROKE}
          cy={R + STROKE}
          r={R}
          fill="none"
          stroke="rgba(10,31,20,0.09)"
          strokeWidth={STROKE}
        />
        {/* The twelve-o'clock start is a static transform attribute; only
            strokeDashoffset moves, so the sweep stays on the compositor. */}
        <motion.circle
          cx={R + STROKE}
          cy={R + STROKE}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          transform={`rotate(-90 ${R + STROKE} ${R + STROKE})`}
          initial={false}
          animate={{ strokeDashoffset: CIRC * (1 - frac), opacity: on ? 1 : 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      </svg>

      {readings.map((r, i) => (
        <motion.div
          key={r.at}
          initial={false}
          animate={{ opacity: active === i ? 1 : 0 }}
          transition={{ duration: 0.34, ease: EASE }}
          className="tnum font-display"
          style={{
            position: "absolute",
            left: 0,
            top: SIZE / 2 - 60,
            width: SIZE,
            textAlign: "center",
            fontSize: READING,
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            color,
          }}
        >
          <CountUp to={r.value} on={step >= r.at} duration={0.9} format={(n) => `${n}%`} />
        </motion.div>
      ))}

      <motion.div
        initial={false}
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : 8 }}
        transition={{ duration: 0.4, ease: EASE, delay: on ? 0.16 : 0 }}
        className="font-mono"
        style={{
          position: "absolute",
          left: 0,
          top: SIZE / 2 + 8,
          width: SIZE,
          textAlign: "center",
          fontSize: 19,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: V.ash,
        }}
      >
        {label}
      </motion.div>
    </div>
  );
}

export function FivePlusOne({ step }: { step: number }) {
  const lang = useLang();
  const v = S.vip.fivePlusOne;

  const counted = step >= 1;
  const geared = step >= RUNGS[0].at;
  const free = step >= RUNGS[1].at;

  const rung = free ? RUNGS[1] : geared ? RUNGS[0] : null;
  const paid = rung ? rung.paid : 0;
  const discount = rung ? rung.discount : 0;

  const paidReadings = RUNGS.map((r) => ({ at: r.at, value: Math.round(r.paid * 100) }));
  const discReadings = RUNGS.map((r) => ({ at: r.at, value: Math.round(r.discount * 100) }));

  return (
    <div style={{ position: "relative", width: SLOT_W, height: SLOT_H }}>
      {/* ── the six units ────────────────────────────────────────────────── */}
      <svg
        width={SLOT_W}
        height={UNIT.h + 4}
        viewBox={`0 0 ${SLOT_W} ${UNIT.h + 4}`}
        style={{ position: "absolute", left: 0, top: 0 }}
        aria-hidden
      >
        {UNIT_X.map((x, i) => {
          const bonus = i === BONUS_I;
          // The five paid units lose their ghost as they draw; the sixth keeps
          // its dashed outline right up until it turns gold at the last step.
          const ghost = bonus ? !free : !counted;
          return (
            <g key={x} transform={`translate(${x} 2)`}>
              <motion.path
                d={UNIT_D}
                fill="none"
                stroke={bonus ? "rgba(240,178,62,0.60)" : "rgba(10,31,20,0.18)"}
                strokeWidth={2}
                strokeDasharray="10 9"
                strokeLinejoin="round"
                initial={false}
                animate={{ opacity: ghost ? 1 : 0 }}
                transition={{ duration: 0.34, ease: EASE }}
              />

              {bonus ? (
                <>
                  <motion.rect
                    x={1.5}
                    y={1.5}
                    width={UNIT.w - 3}
                    height={UNIT.h - 3}
                    fill={V.gold}
                    initial={false}
                    animate={{ opacity: free ? 1 : 0, scale: free ? 1 : 0.84 }}
                    transition={{ duration: 0.52, ease: EASE, delay: free ? 0.12 : 0 }}
                    style={{ transformOrigin: "center" }}
                  />
                  <motion.path
                    d={UNIT_D}
                    fill="none"
                    stroke={V.ink}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    initial={false}
                    animate={{ opacity: free ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: free ? 0.3 : 0 }}
                  />
                </>
              ) : (
                <motion.path
                  d={UNIT_D}
                  fill="none"
                  stroke={V.emerald}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={false}
                  animate={{ pathLength: counted ? 1 : 0, opacity: counted ? 1 : 0 }}
                  transition={{ duration: 0.62, ease: EASE, delay: counted ? i * 0.06 : 0 }}
                />
              )}
            </g>
          );
        })}

        <motion.text
          x={PLUS_X}
          y={UNIT.h / 2 + 22}
          fill={V.ash}
          fontSize={62}
          fontWeight={300}
          textAnchor="middle"
          initial={false}
          animate={{ opacity: counted ? 1 : 0, scale: counted ? 1 : 0.6 }}
          transition={{ duration: 0.34, ease: EASE, delay: counted ? 0.34 : 0 }}
        >
          +
        </motion.text>
      </svg>

      {/* how many, under each group */}
      <motion.div
        initial={false}
        animate={{ opacity: counted ? 1 : 0, y: counted ? 0 : 10 }}
        transition={{ duration: 0.42, ease: EASE, delay: counted ? 0.42 : 0 }}
        className="tnum font-display"
        style={{
          position: "absolute",
          left: 0,
          top: UNIT.h + 24,
          width: FIVE_RIGHT,
          textAlign: "center",
          fontSize: 46,
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: V.emerald,
        }}
      >
        {N.vip.bundleSize}
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: free ? 1 : 0, y: free ? 0 : 10 }}
        transition={{ duration: 0.42, ease: EASE, delay: free ? 0.42 : 0 }}
        className="font-mono"
        style={{
          position: "absolute",
          left: UNIT_X[5] - 60,
          top: UNIT.h + 32,
          width: UNIT.w + 120,
          textAlign: "center",
          fontSize: 21,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: V.gold,
        }}
      >
        {t(v.giftLabel, lang)}
      </motion.div>

      {/* ── the linked dial ──────────────────────────────────────────────── */}
      <Dial
        x={DIAL_X[0]}
        step={step}
        frac={paid}
        color={V.emerald}
        readings={paidReadings}
        label={t(v.dialPaid, lang)}
      />

      {/* the gearing: one equals sign, because it is one number read twice */}
      <motion.div
        initial={false}
        animate={{ opacity: geared ? 1 : 0, scale: geared ? 1 : 0.6 }}
        transition={{ duration: 0.36, ease: EASE, delay: geared ? 0.4 : 0 }}
        className="font-display"
        style={{
          position: "absolute",
          left: DIAL_X[0] + SIZE,
          top: DIAL_Y + SIZE / 2 - 44,
          width: DIAL_X[1] - DIAL_X[0] - SIZE,
          textAlign: "center",
          fontSize: 72,
          lineHeight: "88px",
          fontWeight: 400,
          color: V.gold,
        }}
      >
        =
      </motion.div>

      <Dial
        x={DIAL_X[1]}
        step={step}
        frac={discount}
        color={V.gold}
        readings={discReadings}
        label={t(v.dialDiscount, lang)}
      />
    </div>
  );
}

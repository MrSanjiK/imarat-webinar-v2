"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { V } from "@/ui/vivid";

/**
 * EscrowFlow — v2 "IMARAT Vivid". Bold flat vector, no pencil, no sketch kit.
 *
 * One 1600×740 board, two stacked acts sharing the same left-to-right money
 * axis, so the eye compares the two routes without being told to.
 *
 *   step 0 — the cast, unlit: buyer, tower, crane on both rails; the vault
 *            sits ash-grey and closed. No money anywhere.
 *   step 1 — BEFORE. Gold tokens run buyer → builder in one straight shot with
 *            nothing in between.
 *   step 2 — the failure. That run overdraws in ember, the built floors gray
 *            out, the crane's jib tilts and dims, an ember bar strikes the
 *            tower. The only ember in the chapter.
 *   step 3 — AFTER. Act 1 drops to 0.34 and holds its failure state. Below it
 *            gold tokens arc into the vault, the money level wipes up, the
 *            vault turns emerald and its dial spins shut. Three checkpoints
 *            light emerald in sequence; each one releases a token onward, and
 *            each arriving token wipes one more floor emerald. The crane
 *            swings back to work.
 *
 * Every `on` is monotonic in `step`, so 3 → 2 leaves the failure exactly as
 * step 2 built it. Only transform / opacity / clip-path / strokeDashoffset
 * animate; motion's `x`/`y` on SVG nodes are transforms, not attributes.
 */

/** Authored 1:1 against the 1600×652 slot the slide gives it, so `meet`
 *  never letterboxes and the drawing keeps the full width of the stage. */
const W = 1600;
const H = 652;

/** Ground line of each act. */
const TOP = 250;
const BOT = 590;

/** Column centres, shared by both acts. */
const CX_BUYER = 150;
const CX_VAULT = 720;
const CX_BUILD = 1370;

/** Where a payment run starts and where its arrowhead lands. */
const RUN_FROM = CX_BUYER + 74;
const RUN_TO = CX_BUILD - 176;
const HEAD = CX_BUILD - 200;

const STAGGER = 0.06;

const CK_X = [900, 996, 1092];
/** Certification cadence: checkpoint i lights, then its token leaves. */
const LIT = [0, 0.8, 1.6];

// ── primitives ──────────────────────────────────────────────────────────────

/** A stroke that draws itself on. pathLength=1, so dashoffset runs 1 → 0. */
function Draw({
  d,
  on,
  stroke,
  width = 4,
  delay = 0,
  duration = 0.7,
  opacity = 1,
}: {
  d: string;
  on: boolean;
  stroke: string;
  width?: number;
  delay?: number;
  duration?: number;
  opacity?: number;
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
      opacity={opacity}
      initial={false}
      animate={{ strokeDashoffset: on ? 0 : 1 }}
      transition={{ duration: on ? duration : 0.3, ease: EASE, delay: on ? delay : 0 }}
    />
  );
}

/** Flat block that fills by clip-wipe rather than by growing a height. */
function FillBlock({
  x,
  y,
  w,
  h,
  on,
  fill,
  radius = 0,
  delay = 0,
  duration = 0.55,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on: boolean;
  fill: string;
  radius?: number;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={radius}
      fill={fill}
      initial={false}
      animate={{ clipPath: on ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
      transition={{ duration, ease: EASE, delay: on ? delay : 0 }}
    />
  );
}

/**
 * A gold money token carried along a run by transform keyframes only. `bend`
 * lifts the middle of the run so a deposit arcs instead of sliding.
 */
function Token({
  from,
  to,
  y,
  on,
  delay = 0,
  duration = 1,
  r = 17,
  bend = 0,
}: {
  from: number;
  to: number;
  y: number;
  on: boolean;
  delay?: number;
  duration?: number;
  r?: number;
  bend?: number;
}) {
  const N = 10;
  const xs: number[] = [];
  const ys: number[] = [];
  const ts: number[] = [];
  for (let i = 0; i <= N; i++) {
    const p = i / N;
    xs.push(from + (to - from) * p);
    ys.push(y + bend * 4 * p * (1 - p));
    ts.push(p);
  }
  return (
    <motion.g
      initial={false}
      animate={on ? { x: xs, y: ys, opacity: [0, 1, 1, 1, 0] } : { x: xs[0], y: ys[0], opacity: 0 }}
      transition={
        on
          ? {
              x: { duration, delay, times: ts, ease: "linear" },
              y: { duration, delay, times: ts, ease: "linear" },
              opacity: { duration, delay, times: [0, 0.1, 0.6, 0.9, 1], ease: "linear" },
            }
          : { duration: 0.24 }
      }
    >
      <circle r={r} fill={V.gold} />
      <path
        d={`M ${-r * 0.36} 0 H ${r * 0.36} M 0 ${-r * 0.52} V ${r * 0.52}`}
        stroke={V.ink}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.7}
      />
    </motion.g>
  );
}

/** Buyer: a filled disc over a shoulder arc. Flat silhouette, no outline. */
function Buyer({
  cx,
  cy,
  on,
  delay = 0,
  color,
}: {
  cx: number;
  cy: number;
  on: boolean;
  delay?: number;
  color: string;
}) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.86 }}
      transition={{ duration: 0.5, ease: EASE, delay: on ? delay : 0 }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <circle cx={cx} cy={cy - 30} r={21} fill={color} />
      <path d={`M ${cx - 36} ${cy + 32} a 36 36 0 0 1 72 0 Z`} fill={color} />
    </motion.g>
  );
}

/**
 * Tower: four stacked slabs sitting on `base`. The bottom `built` are solid,
 * the rest are dashed ghosts of what is still owed. `fillTo` slabs carry an
 * emerald clip-wipe on top, one per released payment.
 */
function Tower({
  cx,
  base,
  on,
  delay = 0,
  built,
  outline,
  frozen = false,
  fillTo = 0,
  fillDelays = [],
}: {
  cx: number;
  base: number;
  on: boolean;
  delay?: number;
  built: number;
  outline: string;
  frozen?: boolean;
  fillTo?: number;
  fillDelays?: number[];
}) {
  const w = 148;
  const x = cx - w / 2;
  const sh = 34;
  const gap = 6;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const y = base - (i + 1) * sh - i * gap;
        const done = i < built;
        return (
          <g key={i}>
            <motion.rect
              x={x}
              y={y}
              width={w}
              height={sh}
              rx={5}
              fill={done ? (frozen ? "#C6D3CB" : V.paper3) : "none"}
              stroke={done ? "none" : outline}
              strokeWidth={done ? 0 : 3}
              strokeDasharray={done ? undefined : "12 10"}
              strokeLinecap="round"
              initial={false}
              animate={{ opacity: on ? (done ? 1 : 0.5) : 0, scale: on ? 1 : 0.92 }}
              transition={{ duration: 0.5, ease: EASE, delay: on ? delay + i * STAGGER : 0 }}
              style={{ transformOrigin: `${cx}px ${base}px` }}
            />
            {i < fillTo && (
              <FillBlock
                x={x}
                y={y}
                w={w}
                h={sh}
                radius={5}
                on={on}
                fill={V.emerald}
                delay={fillDelays[i] ?? delay}
                duration={0.5}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Crane: mast plus a jib that can tilt and dim when the work stops. */
function Crane({
  mx,
  base,
  on,
  delay = 0,
  color,
  dim = false,
  jibDeg = 0,
  fxDelay = 0,
}: {
  mx: number;
  base: number;
  on: boolean;
  delay?: number;
  color: string;
  dim?: boolean;
  jibDeg?: number;
  fxDelay?: number;
}) {
  const topY = base - 226;
  return (
    /* Two nested groups on purpose: "has it appeared" and "has it stopped" are
       separate timelines, so a jump straight to step 2 does not hold the crane
       invisible until the dim delay has elapsed. */
    <motion.g
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: on ? delay : 0 }}
    >
      <motion.g
        initial={false}
        animate={{ opacity: dim ? 0.3 : 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: dim ? fxDelay : 0 }}
      >
        <Draw d={`M ${mx} ${base} V ${topY}`} on={on} stroke={color} width={5} delay={delay} duration={0.55} />
        <motion.g
          initial={false}
          animate={{ rotate: jibDeg }}
          transition={{ duration: 0.7, ease: EASE, delay: fxDelay }}
          style={{ transformOrigin: `${mx}px ${topY}px` }}
        >
          <Draw
            d={`M ${mx - 106} ${topY} H ${mx + 34}`}
            on={on}
            stroke={color}
            width={5}
            delay={delay + 0.18}
            duration={0.4}
          />
          <Draw
            d={`M ${mx - 74} ${topY} V ${topY + 48}`}
            on={on}
            stroke={color}
            width={3.5}
            delay={delay + 0.34}
            duration={0.25}
          />
          <motion.rect
            x={mx + 22}
            y={topY - 10}
            width={20}
            height={20}
            rx={4}
            fill={color}
            initial={false}
            animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.6 }}
            transition={{ duration: 0.3, ease: EASE, delay: on ? delay + 0.42 : 0 }}
            style={{ transformOrigin: `${mx + 32}px ${topY}px` }}
          />
        </motion.g>
      </motion.g>
    </motion.g>
  );
}

/** Checkpoint: ash outline square that flips to solid emerald with a tick. */
function Checkpoint({
  x,
  y,
  on,
  lit,
  delay = 0,
  litDelay = 0,
}: {
  x: number;
  y: number;
  on: boolean;
  lit: boolean;
  delay?: number;
  litDelay?: number;
}) {
  const s = 46;
  const o = `${x + s / 2}px ${y + s / 2}px`;
  return (
    <g>
      <motion.rect
        x={x}
        y={y}
        width={s}
        height={s}
        rx={12}
        fill="none"
        stroke={V.ash}
        strokeWidth={3}
        initial={false}
        animate={{ opacity: on ? 0.55 : 0, scale: on ? 1 : 0.78 }}
        transition={{ duration: 0.4, ease: EASE, delay: on ? delay : 0 }}
        style={{ transformOrigin: o }}
      />
      <motion.rect
        x={x}
        y={y}
        width={s}
        height={s}
        rx={12}
        fill={V.emerald}
        initial={false}
        animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.68 }}
        transition={{ duration: 0.42, ease: EASE, delay: lit ? litDelay : 0 }}
        style={{ transformOrigin: o }}
      />
      <Draw
        d={`M ${x + 13} ${y + 24} l 8 9 l 14 -18`}
        on={lit}
        stroke={V.paper}
        width={4.5}
        delay={litDelay + 0.16}
        duration={0.28}
      />
    </g>
  );
}

/** Mono column label. */
function Label({
  x,
  y,
  text,
  on,
  delay = 0,
  color = V.ash,
  size = 23,
}: {
  x: number;
  y: number;
  text: string;
  on: boolean;
  delay?: number;
  color?: string;
  size?: number;
}) {
  return (
    <motion.text
      x={x}
      y={y}
      textAnchor="middle"
      fill={color}
      fontSize={size}
      letterSpacing="0.14em"
      className="font-mono"
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 8 }}
      transition={{ duration: 0.42, ease: EASE, delay: on ? delay : 0 }}
      style={{ textTransform: "uppercase" }}
    >
      {text}
    </motion.text>
  );
}

// ── the diagram ─────────────────────────────────────────────────────────────

export function EscrowFlow({ step }: { step: number }) {
  const lang = useLang();
  const e = S.escrow.what;

  const cast = step >= 0;
  const before = step >= 1;
  const failed = step >= 2;
  const after = step >= 3;

  const arrowAt = (y: number) => `M ${HEAD} ${y} l -26 -15 M ${HEAD} ${y} l -26 15`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
    >
      {/* ── ACT 1 · money straight to the builder ────────────────────────── */}
      <motion.g
        initial={false}
        animate={{ opacity: after ? 0.34 : 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: after ? 0.15 : 0 }}
      >
        <Label x={CX_BUYER + 10} y={TOP - 154} text={t(e.beforeLabel, lang)} on={before} size={26} />

        <Draw d={`M 34 ${TOP} H ${CX_BUILD + 208}`} on={cast} stroke={V.paper3} width={4} delay={0.04} duration={0.8} />

        <Buyer cx={CX_BUYER} cy={TOP - 36} on={cast} delay={0.1} color={V.ink} />

        {/* the run, then the same stroke overdrawn in ember when it fails */}
        <Draw d={`M ${RUN_FROM} ${TOP - 128} H ${RUN_TO}`} on={before} stroke={V.ink} width={4} delay={0.1} duration={0.85} />
        <Draw d={arrowAt(TOP - 128)} on={before} stroke={V.ink} width={4} delay={0.82} duration={0.2} />
        <Draw d={`M ${RUN_FROM} ${TOP - 128} H ${RUN_TO}`} on={failed} stroke={V.ember} width={6} delay={0.1} duration={0.6} />
        <Draw d={arrowAt(TOP - 128)} on={failed} stroke={V.ember} width={6} delay={0.56} duration={0.2} />

        {[0, 1, 2].map((i) => (
          <Token
            key={i}
            from={RUN_FROM + 22}
            to={HEAD}
            y={TOP - 128}
            on={before}
            delay={0.34 + i * 0.34}
          />
        ))}

        <Tower cx={CX_BUILD} base={TOP} on={cast} delay={0.24} built={2} outline={V.ash} frozen={failed} />
        <Crane
          mx={CX_BUILD + 126}
          base={TOP}
          on={cast}
          delay={0.34}
          color={V.ash}
          dim={failed}
          jibDeg={failed ? 7 : 0}
          fxDelay={failed ? 0.75 : 0}
        />

        {/* the strike: one ember bar across the frozen floors */}
        <motion.rect
          x={CX_BUILD - 98}
          y={TOP - 84}
          width={196}
          height={20}
          rx={10}
          fill={V.ember}
          initial={false}
          animate={{ opacity: failed ? 1 : 0, scaleX: failed ? 1 : 0 }}
          transition={{ duration: 0.44, ease: EASE, delay: failed ? 1 : 0 }}
          style={{ transformOrigin: `${CX_BUILD}px ${TOP - 74}px` }}
        />

        <Label x={CX_BUYER} y={TOP + 52} text={t(e.buyer, lang)} on={cast} delay={0.3} />
        <Label x={CX_BUILD} y={TOP + 52} text={t(e.builder, lang)} on={cast} delay={0.4} />
      </motion.g>

      {/* ── ACT 2 · the vault holds it until a stage is certified ────────── */}
      <g>
        <Label
          x={CX_BUYER + 10}
          y={BOT - 232}
          text={t(e.afterLabel, lang)}
          on={after}
          color={V.emerald}
          size={24}
        />

        <Draw d={`M 34 ${BOT} H ${CX_BUILD + 208}`} on={cast} stroke={V.paper3} width={4} delay={0.08} duration={0.8} />

        <Buyer cx={CX_BUYER} cy={BOT - 36} on={cast} delay={0.16} color={V.ink} />

        {/* deposit: buyer → vault — curved to match the token arc (bend=-56) */}
        <motion.path
          d={`M ${RUN_FROM} ${BOT - 74} Q ${(RUN_FROM + CX_VAULT - 122) / 2} ${BOT - 74 - 56} ${CX_VAULT - 122} ${BOT - 74}`}
          fill="none"
          stroke={V.emerald}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
          initial={false}
          animate={{ strokeDashoffset: after ? 0 : 1 }}
          transition={{ duration: after ? 0.55 : 0.3, ease: EASE, delay: after ? 0.08 : 0 }}
        />
        {[0, 1, 2].map((i) => (
          <Token
            key={`d${i}`}
            from={RUN_FROM + 22}
            to={CX_VAULT - 126}
            y={BOT - 74}
            on={after}
            delay={0.26 + i * 0.26}
            duration={0.8}
            bend={-56}
          />
        ))}

        {/* the vault */}
        <motion.rect
          x={CX_VAULT - 104}
          y={BOT - 168}
          width={208}
          height={168}
          rx={22}
          fill={V.paper2}
          stroke={V.ash}
          strokeWidth={3}
          initial={false}
          animate={{ opacity: cast ? 1 : 0, scale: cast ? 1 : 0.9 }}
          transition={{ duration: 0.5, ease: EASE, delay: cast ? 0.3 : 0 }}
          style={{ transformOrigin: `${CX_VAULT}px ${BOT - 84}px` }}
        />

        {/* vault inner glow — gold rim that pulses in when money is inside */}
        <motion.rect
          x={CX_VAULT - 104}
          y={BOT - 168}
          width={208}
          height={168}
          rx={22}
          fill="none"
          stroke={V.gold}
          strokeWidth={14}
          initial={false}
          animate={{ opacity: after ? 0.15 : 0 }}
          transition={{ duration: 0.44, ease: EASE, delay: after ? 0.72 : 0 }}
        />

        {/* the money level rising inside it */}
        <FillBlock
          x={CX_VAULT - 92}
          y={BOT - 80}
          w={184}
          h={68}
          radius={12}
          on={after}
          fill={V.gold}
          delay={0.72}
          duration={0.7}
        />

        {/* protected: the shell goes emerald and the dial spins shut */}
        <motion.rect
          x={CX_VAULT - 104}
          y={BOT - 168}
          width={208}
          height={168}
          rx={22}
          fill="none"
          stroke={V.emerald}
          strokeWidth={6}
          initial={false}
          animate={{ opacity: after ? 1 : 0 }}
          transition={{ duration: 0.44, ease: EASE, delay: after ? 0.62 : 0 }}
        />
        <motion.g
          initial={false}
          animate={{ opacity: cast ? 1 : 0, rotate: after ? 90 : 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: after ? 0.72 : 0.42 }}
          style={{ transformOrigin: `${CX_VAULT}px ${BOT - 118}px` }}
        >
          {/* A six-spoke vault wheel with a hub. Two spokes on a ring read as
              a cancel glyph — the one thing this door must not say.
              Ash layer is always present; emerald layer fades in at after. */}

          {/* ash wheel — always rendered so back-navigation never flashes */}
          <circle cx={CX_VAULT} cy={BOT - 118} r={36} fill="none" stroke={V.ash} strokeWidth={5} />
          {[0, 60, 120].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const dx = Math.cos(a) * 30;
            const dy = Math.sin(a) * 30;
            return (
              <path
                key={deg}
                d={`M ${CX_VAULT - dx} ${BOT - 118 - dy} L ${CX_VAULT + dx} ${BOT - 118 + dy}`}
                stroke={V.ash}
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={CX_VAULT} cy={BOT - 118} r={10} fill={V.ash} />

          {/* emerald wheel — layered on top, fades in when after */}
          <motion.g
            initial={false}
            animate={{ opacity: after ? 1 : 0 }}
            transition={{ duration: 0.44, ease: EASE, delay: after ? 0.62 : 0 }}
          >
            <circle cx={CX_VAULT} cy={BOT - 118} r={36} fill="none" stroke={V.emerald} strokeWidth={5} />
            {[0, 60, 120].map((deg) => {
              const a = (deg * Math.PI) / 180;
              const dx = Math.cos(a) * 30;
              const dy = Math.sin(a) * 30;
              return (
                <path
                  key={deg}
                  d={`M ${CX_VAULT - dx} ${BOT - 118 - dy} L ${CX_VAULT + dx} ${BOT - 118 + dy}`}
                  stroke={V.emerald}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx={CX_VAULT} cy={BOT - 118} r={10} fill={V.emerald} />
          </motion.g>
        </motion.g>

        {/* release: only against a certified stage */}
        <Draw
          d={`M ${CX_VAULT + 122} ${BOT - 128} H ${RUN_TO}`}
          on={after}
          stroke={V.emerald}
          width={4}
          delay={1.45}
          duration={0.6}
        />
        <Draw d={arrowAt(BOT - 128)} on={after} stroke={V.emerald} width={4} delay={1.95} duration={0.2} />

        {CK_X.map((x, i) => (
          <Checkpoint
            key={x}
            x={x}
            y={BOT - 74}
            on={after}
            lit={after}
            delay={0.9 + i * STAGGER}
            litDelay={1.7 + LIT[i]}
          />
        ))}
        <Label
          x={CK_X[1] + 23}
          y={BOT + 52}
          text={t(e.milestone, lang)}
          on={after}
          delay={1.7}
          color={V.emerald}
          size={21}
        />

        {LIT.map((d, i) => (
          <Token
            key={`r${i}`}
            from={CX_VAULT + 130}
            to={HEAD}
            y={BOT - 128}
            on={after}
            delay={2.02 + d}
            duration={0.72}
            bend={-42}
            r={16}
          />
        ))}

        <Tower
          cx={CX_BUILD}
          base={BOT}
          on={cast}
          delay={0.4}
          built={2}
          outline={V.emerald}
          fillTo={4}
          fillDelays={[2.6, 2.6, 2.66 + LIT[1], 2.66 + LIT[2]]}
        />
        <Crane
          mx={CX_BUILD + 126}
          base={BOT}
          on={cast}
          delay={0.5}
          color={V.emerald}
          jibDeg={after ? -7 : 0}
          fxDelay={after ? 3.4 : 0}
        />

        <Label x={CX_BUYER} y={BOT + 52} text={t(e.buyer, lang)} on={cast} delay={0.44} />
        <Label
          x={CX_VAULT}
          y={BOT - 196}
          text={t(e.bank, lang)}
          on={cast}
          delay={0.52}
          color={after ? V.emerald : V.ash}
        />
        <Label x={CX_BUILD} y={BOT + 52} text={t(e.builder, lang)} on={cast} delay={0.6} />
      </g>
    </svg>
  );
}

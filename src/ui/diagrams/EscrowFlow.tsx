"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import {
  Annotation,
  C,
  Hatch,
  SketchEllipse,
  SketchLine,
  SketchPath,
  SketchPoly,
  SketchRect,
  wobbleEllipse,
  wobbleLine,
  wobbleRect,
  type Pt,
} from "@/ui/sketch";

/**
 * EscrowFlow — the mechanism, told as two halves of one drawing.
 *
 * The vertical rule at x=782 is the diagram's echo of the slide's own divider
 * at stage x=942 (slot origin is x=160, so 942 - 160 = 782). Left of it is the
 * old failure mode; right of it is escrow.
 *
 * step 0 — empty page.
 * step 1 — the cast draws in, pencil ink, no colour: buyer + half-built tower
 *          and crane on the left; buyer + bank vault + half-built tower and
 *          crane on the right. Ghost (dashed) outlines mark the unbuilt floors.
 * step 2 — OLDIN. Three gold coins run buyer → developer along a straight line.
 *          Then the failure lands: the line is overdrawn in ember, the built
 *          floors fill with grey hatching, an ember ✕ crosses the unbuilt
 *          floors, and the crane dims and its jib droops.
 * step 3 — KEYIN. The left half dims to 0.5 but keeps its failure state. Coins
 *          curve buyer → vault and the vault's money level rises in gold. Three
 *          milestone boxes draw in; each tick turns forest green in sequence and
 *          releases one coin along an arc to the developer, and each arriving
 *          coin completes one floor. Roof closes, crane jib swings back to work.
 *
 * Pure function of `step`: every `on` is monotonic in `step`, so 3 → 2 leaves the
 * failure state exactly as step 2 built it.
 */

// ── geometry, baked at module scope so every array ref is stable ────────────

type P = [number, number];

/** Quadratic bezier sampled to points — a polyline dense enough to read curved. */
function qpts(p0: P, c: P, p1: P, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
    ]);
  }
  return out;
}

type Lane = { xs: number[]; ys: number[]; ts: number[] };

/** The same sampling, split into transform keyframe lists for a travelling coin. */
function lane(p0: P, c: P, p1: P, n = 12): Lane {
  const pts = qpts(p0, c, p1, n);
  return {
    xs: pts.map((p) => p[0]),
    ys: pts.map((p) => p[1]),
    ts: pts.map((_, i) => i / n),
  };
}

function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, n = 8): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

const GROUND = 272;
const SPLIT = 782;

// left half
const B1 = 128; // buyer
const T1 = 590; // tower centre
const M1 = 686; // crane mast
// right half
const B2 = 862;
const V2 = 1128; // vault centre
const T2 = 1462;
const M2 = 1552;

const STRAIGHT = lane([176, 205], [338, 205], [500, 205], 8);
const DEPOSIT_P: [P, P, P] = [[914, 205], [983, 268], [1052, 212]];
const RELEASE_P: [P, P, P] = [[1204, 200], [1298, 96], [1392, 206]];
const DEPOSIT = lane(...DEPOSIT_P);
const RELEASE = lane(...RELEASE_P);
const DEPOSIT_PTS = qpts(...DEPOSIT_P, 10);
const RELEASE_PTS = qpts(...RELEASE_P, 10);

const SHOULDER1 = arcPts(B1, GROUND, 36, 180, 360);
const SHOULDER2 = arcPts(B2, GROUND, 36, 180, 360);

const FADE = [0, 1, 1, 1, 0];
const FADE_T = [0, 0.08, 0.55, 0.88, 1];

const TICKS = [1231, 1287, 1343];
const TICK_Y = 222;

/** Head of the straight before-arrow. Drawn twice: ink, then ember on top. */
const STRAIGHT_HEAD = [
  wobbleLine(500, 205, 484.5, 198.6, 44, 0.7),
  wobbleLine(500, 205, 484.5, 211.4, 45, 0.7),
].join(" ");

/** The ember ✕ over the floors that will never be built. */
const CROSS_A = wobbleLine(T1 - 26, 126, T1 + 26, 178, 71, 1.4);
const CROSS_B = wobbleLine(T1 + 26, 126, T1 - 26, 178, 72, 1.4);

/** Vault dial: two spokes crossing the hub, like the handle on a safe. */
const SPOKES = [45, 135]
  .map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    return wobbleLine(
      V2 - Math.cos(a) * 22,
      186 - Math.sin(a) * 22,
      V2 + Math.cos(a) * 22,
      186 + Math.sin(a) * 22,
      61 + i,
      0.7,
    );
  })
  .join(" ");

// ── small local primitives ─────────────────────────────────────────────────

/** A gold coin carried along a lane by transform keyframes only. */
function Coin({
  path,
  on,
  delay = 0,
  duration = 0.95,
  seed = 5,
  r = 13,
}: {
  path: Lane;
  on: boolean;
  delay?: number;
  duration?: number;
  seed?: number;
  r?: number;
}) {
  const outer = useMemo(() => wobbleEllipse(0, 0, r, r, seed, 1.1), [r, seed]);
  const inner = useMemo(() => wobbleEllipse(0, 0, r * 0.42, r * 0.42, seed + 5, 0.7), [r, seed]);

  return (
    <motion.g
      initial={false}
      animate={
        on
          ? { x: path.xs, y: path.ys, opacity: FADE }
          : { x: path.xs[0], y: path.ys[0], opacity: 0 }
      }
      transition={
        on
          ? {
              x: { duration, delay, times: path.ts, ease: "linear" },
              y: { duration, delay, times: path.ts, ease: "linear" },
              opacity: { duration, delay, times: FADE_T, ease: "linear" },
            }
          : { duration: 0.25 }
      }
    >
      <path d={outer} fill="none" stroke={C.gold} strokeWidth={2.6} strokeLinecap="round" />
      <path d={inner} fill="none" stroke={C.gold} strokeWidth={1.6} strokeLinecap="round" opacity={0.75} />
    </motion.g>
  );
}

/** Dashed outline for what has not been built yet. Fades, never draws on. */
function GhostRect({
  x,
  y,
  w,
  h,
  on,
  delay = 0,
  outDelay = 0,
  seed = 7,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on: boolean;
  delay?: number;
  outDelay?: number;
  seed?: number;
}) {
  const d = useMemo(() => wobbleRect(x, y, w, h, seed, 1.6), [x, y, w, h, seed]);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={C.ash}
      strokeWidth={1.8}
      strokeDasharray="9 8"
      strokeLinecap="round"
      initial={false}
      animate={{ opacity: on ? 0.7 : 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: on ? delay : outDelay }}
    />
  );
}

/** A curved arrow: sampled bezier as a wobbled polyline, plus a wobbled head. */
function CurveArrow({
  pts,
  on,
  stroke = C.ink,
  width = 2.4,
  delay = 0,
  duration = 0.8,
  seed = 5,
  head = 15,
}: {
  pts: Pt[];
  on: boolean;
  stroke?: string;
  width?: number;
  delay?: number;
  duration?: number;
  seed?: number;
  head?: number;
}) {
  const wings = useMemo(() => {
    const a = pts[pts.length - 1];
    const b = pts[pts.length - 2];
    const ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
    const w1 = ang + Math.PI - 0.42;
    const w2 = ang + Math.PI + 0.42;
    return [
      wobbleLine(a[0], a[1], a[0] + Math.cos(w1) * head, a[1] + Math.sin(w1) * head, seed + 11, 0.7),
      wobbleLine(a[0], a[1], a[0] + Math.cos(w2) * head, a[1] + Math.sin(w2) * head, seed + 12, 0.7),
    ].join(" ");
  }, [pts, head, seed]);

  return (
    <>
      <SketchPoly
        pts={pts}
        seed={seed}
        amp={1.1}
        on={on}
        stroke={stroke}
        width={width}
        delay={delay}
        duration={duration}
      />
      <SketchPath
        d={wings}
        on={on}
        stroke={stroke}
        width={width}
        delay={delay + duration * 0.75}
        duration={0.2}
      />
    </>
  );
}

/** Head + shoulders. */
function Buyer({
  cx,
  shoulder,
  on,
  delay = 0,
  seed = 11,
}: {
  cx: number;
  shoulder: Pt[];
  on: boolean;
  delay?: number;
  seed?: number;
}) {
  return (
    <g>
      <SketchEllipse cx={cx} cy={210} rx={18} ry={19} seed={seed} on={on} delay={delay} duration={0.45} width={2.2} />
      <SketchPoly pts={shoulder} seed={seed + 4} amp={1.2} on={on} delay={delay + 0.12} duration={0.5} width={2.2} />
    </g>
  );
}

/** Built floors + the dashed ghost of the floors still owed. */
function TowerShell({
  cx,
  on,
  ghostOn = true,
  delay = 0,
  ghostOutDelay = 0,
  seed = 21,
}: {
  cx: number;
  on: boolean;
  ghostOn?: boolean;
  delay?: number;
  ghostOutDelay?: number;
  seed?: number;
}) {
  const x = cx - 64;
  return (
    <g>
      <SketchRect x={x} y={196} w={128} h={76} seed={seed} on={on} delay={delay} duration={0.6} width={2.2} />
      <SketchLine x1={x} y1={221} x2={x + 128} y2={221} seed={seed + 7} on={on} delay={delay + 0.24} duration={0.35} width={1.5} opacity={0.5} />
      <SketchLine x1={x} y1={247} x2={x + 128} y2={247} seed={seed + 8} on={on} delay={delay + 0.32} duration={0.35} width={1.5} opacity={0.5} />
      <GhostRect
        x={x}
        y={120}
        w={128}
        h={74}
        on={on && ghostOn}
        delay={delay + 0.4}
        outDelay={ghostOutDelay}
        seed={seed + 9}
      />
    </g>
  );
}

/** Mast, jib, tie-backs, hook. The jib is its own group so it can droop. */
function Crane({
  mx,
  on,
  delay = 0,
  seed = 41,
  dim = false,
  jibDeg = 0,
  fxDelay = 0,
}: {
  mx: number;
  on: boolean;
  delay?: number;
  seed?: number;
  dim?: boolean;
  jibDeg?: number;
  fxDelay?: number;
}) {
  return (
    /* Two nested groups on purpose: "has it appeared" and "has it stopped" are
       separate opacity timelines. Folded into one node, a jump straight to
       step 2 would hold the crane at 0 until the dim delay elapsed. */
    <motion.g
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={{ duration: 0.3, ease: EASE, delay: on ? delay : 0 }}
    >
      <motion.g
        initial={false}
        animate={{ opacity: dim ? 0.28 : 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: dim ? fxDelay : 0 }}
      >
      {/* mast, with two lattice ticks so it does not read as a flagpole */}
      <SketchLine x1={mx} y1={GROUND} x2={mx} y2={104} seed={seed} on={on} delay={delay} duration={0.55} width={2.2} />
      <SketchLine x1={mx - 7} y1={214} x2={mx + 7} y2={214} seed={seed + 6} on={on} delay={delay + 0.3} duration={0.2} width={1.5} opacity={0.6} />
      <SketchLine x1={mx - 7} y1={160} x2={mx + 7} y2={160} seed={seed + 7} on={on} delay={delay + 0.34} duration={0.2} width={1.5} opacity={0.6} />
      <SketchLine x1={mx} y1={104} x2={mx} y2={70} seed={seed + 8} on={on} delay={delay + 0.16} duration={0.25} width={2} />
      <motion.g
        initial={false}
        animate={{ rotate: jibDeg }}
        transition={{ duration: 0.7, ease: EASE, delay: fxDelay }}
        style={{ transformOrigin: `${mx}px 104px` }}
      >
        {/* long working jib to the left, short counter-jib with a weight right */}
        <SketchLine x1={mx - 78} y1={104} x2={mx + 26} y2={104} seed={seed + 1} on={on} delay={delay + 0.2} duration={0.45} width={2.2} />
        <SketchLine x1={mx} y1={70} x2={mx - 70} y2={104} seed={seed + 2} on={on} delay={delay + 0.3} duration={0.3} width={1.6} opacity={0.75} />
        <SketchLine x1={mx} y1={70} x2={mx + 22} y2={104} seed={seed + 3} on={on} delay={delay + 0.34} duration={0.3} width={1.6} opacity={0.75} />
        <SketchRect x={mx + 12} y={97} w={15} h={13} seed={seed + 9} amp={0.7} on={on} delay={delay + 0.4} duration={0.25} width={1.8} />
        <SketchLine x1={mx - 56} y1={104} x2={mx - 56} y2={146} seed={seed + 4} on={on} delay={delay + 0.42} duration={0.3} width={1.6} />
        <SketchRect x={mx - 62} y={146} w={12} h={10} seed={seed + 5} amp={0.7} on={on} delay={delay + 0.5} duration={0.25} width={1.6} />
        </motion.g>
      </motion.g>
    </motion.g>
  );
}

/** Milestone checkbox: ash outline, then a forest box + check when certified. */
function Milestone({
  x,
  on,
  boxDelay,
  litDelay,
  seed,
}: {
  x: number;
  on: boolean;
  boxDelay: number;
  litDelay: number;
  seed: number;
}) {
  const check = useMemo(
    () =>
      [
        wobbleLine(x + 6, TICK_Y + 14, x + 11, TICK_Y + 20, seed + 21, 0.8),
        wobbleLine(x + 11, TICK_Y + 20, x + 20, TICK_Y + 6, seed + 22, 0.8),
      ].join(" "),
    [x, seed],
  );
  return (
    <g>
      <SketchRect x={x} y={TICK_Y} w={26} h={26} seed={seed} amp={1.1} on={on} delay={boxDelay} duration={0.35} width={1.8} stroke={C.ash} />
      <SketchRect x={x} y={TICK_Y} w={26} h={26} seed={seed} amp={1.1} on={on} delay={litDelay} duration={0.3} width={2.8} stroke={C.forest} />
      <SketchPath d={check} on={on} stroke={C.leaf} width={3.4} delay={litDelay + 0.12} duration={0.3} />
    </g>
  );
}

// ── the diagram ────────────────────────────────────────────────────────────

export function EscrowFlow({ step }: { step: number }) {
  const lang = useLang();
  const e = S.escrow.what;

  const cast = step >= 1;
  const before = step >= 2;
  const after = step >= 3;

  return (
    <svg viewBox="0 0 1600 340" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* the split, echoing the slide's own divider at stage x=942 */}
      <SketchLine
        x1={SPLIT}
        y1={26}
        x2={SPLIT}
        y2={318}
        seed={31}
        amp={1.4}
        on={cast}
        stroke="rgba(43,42,40,0.16)"
        width={1.5}
        delay={0.05}
        duration={0.7}
      />

      {/* ─────────── OLDIN — money goes straight to the developer ─────────── */}
      <motion.g
        initial={false}
        animate={{ opacity: after ? 0.5 : 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: after ? 0.2 : 0 }}
      >
        <SketchLine x1={54} y1={GROUND} x2={742} y2={GROUND} seed={5} on={cast} stroke={C.ash} width={1.5} opacity={0.4} delay={0.05} duration={0.8} />

        <Annotation x={390} y={48} text={t(e.beforeLabel, lang)} on={before} delay={0.05} color={C.ash} size={32} anchor="middle" />

        <Buyer cx={B1} shoulder={SHOULDER1} on={cast} delay={0.12} seed={11} />
        <TowerShell cx={T1} on={cast} delay={0.3} seed={21} />
        <Crane mx={M1} on={cast} delay={0.42} seed={41} dim={before} jibDeg={before ? 5 : 0} fxDelay={before ? 2.8 : 0} />

        {/* the payment run, then the same stroke overdrawn in ember */}
        <SketchLine x1={176} y1={205} x2={500} y2={205} seed={33} on={before} width={2.4} delay={0.15} duration={0.9} />
        <SketchPath d={STRAIGHT_HEAD} on={before} width={2.4} delay={0.8} duration={0.2} />
        <SketchLine x1={176} y1={205} x2={500} y2={205} seed={33} on={before} stroke={C.ember} width={3.4} delay={2.55} duration={0.55} />
        <SketchPath d={STRAIGHT_HEAD} on={before} stroke={C.ember} width={3.4} delay={3.0} duration={0.2} />

        <Coin path={STRAIGHT} on={before} delay={0.4} duration={1.0} seed={71} />
        <Coin path={STRAIGHT} on={before} delay={0.85} duration={1.0} seed={73} />
        <Coin path={STRAIGHT} on={before} delay={1.3} duration={1.0} seed={75} />

        {/* frozen: grey hatching over what was built, ember ✕ over what was not */}
        <Hatch x={528} y={198} w={124} h={72} on={before} gap={10} seed={81} stroke={C.ash} width={1.5} opacity={0.6} delay={2.75} duration={0.7} direction="up" />
        <SketchPath d={CROSS_A} on={before} stroke={C.ember} width={4} delay={2.95} duration={0.28} />
        <SketchPath d={CROSS_B} on={before} stroke={C.ember} width={4} delay={3.15} duration={0.28} />

        <Annotation x={B1} y={306} text={t(e.buyer, lang)} on={cast} delay={0.5} color={C.ash} size={26} anchor="middle" />
        <Annotation x={T1} y={306} text={t(e.builder, lang)} on={cast} delay={0.58} color={C.ash} size={26} anchor="middle" />
      </motion.g>

      {/* ─────────── KEYIN — the vault holds it until a stage is certified ── */}
      <g>
        <SketchLine x1={818} y1={GROUND} x2={1586} y2={GROUND} seed={9} on={cast} stroke={C.ash} width={1.5} opacity={0.4} delay={0.1} duration={0.8} />

        <Annotation x={1191} y={48} text={t(e.afterLabel, lang)} on={after} delay={0.05} color={C.forest} size={32} anchor="middle" />

        <Buyer cx={B2} shoulder={SHOULDER2} on={cast} delay={0.5} seed={13} />

        {/* the vault: ink at step 1, overdrawn forest once escrow is the story */}
        <SketchRect x={1058} y={140} w={140} h={132} seed={51} on={cast} delay={0.62} duration={0.7} width={2.4} />
        <SketchLine x1={1058} y1={168} x2={1076} y2={168} seed={57} on={cast} delay={0.9} duration={0.25} width={1.8} opacity={0.7} />
        <SketchLine x1={1058} y1={244} x2={1076} y2={244} seed={58} on={cast} delay={0.96} duration={0.25} width={1.8} opacity={0.7} />

        {/* money level rising inside the vault */}
        <Hatch x={1068} y={214} w={120} h={50} on={after} gap={11} seed={59} stroke={C.gold} width={1.8} opacity={0.7} delay={0.9} duration={1.3} direction="up" />

        <SketchRect x={1058} y={140} w={140} h={132} seed={51} on={after} delay={0.15} duration={0.7} width={3.4} stroke={C.forest} />
        <SketchEllipse cx={V2} cy={186} rx={27} ry={27} seed={53} on={cast} delay={0.86} duration={0.45} width={2.2} />
        <SketchEllipse cx={V2} cy={186} rx={27} ry={27} seed={53} on={after} delay={0.5} duration={0.4} width={3.2} stroke={C.forest} />
        <SketchPath d={SPOKES} on={cast} width={2} delay={1.0} duration={0.35} opacity={0.85} />

        <TowerShell cx={T2} on={cast} ghostOn={!after} delay={0.74} ghostOutDelay={4.2} seed={23} />
        <Crane mx={M2} on={cast} delay={0.86} seed={43} jibDeg={after ? -6 : 0} fxDelay={after ? 4.3 : 0} />

        {/* deposit: buyer → vault, curved, and the coins pile up as hatching */}
        <CurveArrow pts={DEPOSIT_PTS} on={after} stroke={C.forest} width={2.4} delay={0.15} duration={0.75} seed={63} />
        <Coin path={DEPOSIT} on={after} delay={0.45} duration={0.9} seed={77} />
        <Coin path={DEPOSIT} on={after} delay={0.8} duration={0.9} seed={79} />
        <Coin path={DEPOSIT} on={after} delay={1.15} duration={0.9} seed={83} />

        {/* release: only against a certified stage */}
        <CurveArrow pts={RELEASE_PTS} on={after} stroke={C.forest} width={2.4} delay={1.9} duration={0.7} seed={65} />
        {TICKS.map((x, i) => (
          <Milestone
            key={x}
            x={x}
            on={after}
            boxDelay={1.6 + i * 0.08}
            litDelay={2.1 + i * 0.6}
            seed={91 + i * 3}
          />
        ))}
        {TICKS.map((x, i) => (
          <Coin key={`c${x}`} path={RELEASE} on={after} delay={2.25 + i * 0.6} duration={0.7} seed={101 + i * 4} r={12} />
        ))}

        {/* each released payment finishes one floor */}
        <SketchRect x={T2 - 64} y={171} w={128} h={25} seed={111} amp={1.2} on={after} delay={2.85} duration={0.4} width={2.6} stroke={C.forest} />
        <SketchRect x={T2 - 64} y={146} w={128} h={25} seed={114} amp={1.2} on={after} delay={3.45} duration={0.4} width={2.6} stroke={C.forest} />
        <SketchRect x={T2 - 64} y={121} w={128} h={25} seed={117} amp={1.2} on={after} delay={4.05} duration={0.4} width={2.6} stroke={C.forest} />
        <SketchLine x1={T2 - 72} y1={117} x2={T2 + 72} y2={117} seed={121} on={after} delay={4.4} duration={0.4} width={3.2} stroke={C.forest} />

        <Annotation x={B2} y={306} text={t(e.buyer, lang)} on={cast} delay={0.66} color={C.ash} size={26} anchor="middle" />
        <Annotation x={V2} y={306} text={t(e.bank, lang)} on={cast} delay={0.74} color={C.ash} size={26} anchor="middle" />
        <Annotation x={1300} y={306} text={t(e.milestone, lang)} on={after} delay={1.7} color={C.forest} size={23} anchor="middle" />
        <Annotation x={T2} y={306} text={t(e.builder, lang)} on={cast} delay={0.82} color={C.ash} size={26} anchor="middle" />
      </g>
    </svg>
  );
}

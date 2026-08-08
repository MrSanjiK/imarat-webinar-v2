"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { t } from "@/content/i18n";
import { useLang } from "@/content/lang";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * RebarCollapse — CHAPTER CLIMAX. Chapter 1 (dark), slide 07. Slot 1600 × 420.
 *
 * The argument that a building is not killed by the earthquake but by what
 * somebody did to it on a Tuesday. Two views at two scales on one sheet: a
 * 400 mm column section on the left, the frame it belongs to on the right. The
 * section starts near the middle and slides to its left home when the frame
 * arrives — the camera stepping back, not a jump cut.
 *
 * v2 "IMARAT Vivid": flat vector, solid fills wiped in under clip rects, bold
 * 3–6 px strokes, no pencil and no filters anywhere.
 *
 * Step map (slide q-rebar has 5 steps, 0…4)
 *   0 — empty sheet.
 *   1 — COLUMN SECTION. Concrete body fills, outline draws, the stirrup ring
 *       draws, then twelve longitudinal bars pop in on a 0.06 stagger. A500S
 *       is called out on the ring.
 *   2 — THE DRILL ENTERS and the strands are CUT. A bit travels in from the
 *       left carrying a black mask disc, so the hole is *bored* — fill, outline
 *       and cover are removed by the tool rather than faded under it. The two
 *       bars on its axis go with it; ember ghost rings and crosses mark where
 *       they were, and the bore rim spalls ember.
 *   3 — LOAD PATH RE-ROUTES. The section walks left, a rule splits the sheet,
 *       and the four-storey frame draws on the right. Emerald load rails run
 *       down every column; the drilled one stops dead at the bore. The orphaned
 *       load area fills, an arrow walks it sideways, and the neighbour's rail
 *       THICKENS (scaleX on a group) as it inherits.
 *   4 — PROGRESSIVE COLLAPSE. The whole load apparatus goes out first — it is
 *       describing a path that no longer exists — then every shaft goes ember
 *       and sinks below grade behind a static clip, and the slabs pancake
 *       bottom-up on a 0.1 s stagger with a heavy 0.55 s fall, each landing
 *       with a dust bloom. What is left is a rubble stack over buried stubs.
 *
 * Rules kept: pure function of `step` (every gate is `step >= n`, so 4 → 3
 * renders exactly what 3 → 4 rendered); only transform / opacity /
 * strokeDashoffset / clip-path animate; all geometry is baked at module load.
 */

const BASE = "rgba(244,251,244,0.9)";
const DIM = "rgba(244,251,244,0.35)";
const MID = "rgba(244,251,244,0.6)";

/** Emerald carries load. Ember carries failure. Nothing else is coloured. */
const LOAD = V.emerald;
const FAIL = V.ember;

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const rectD = (x: number, y: number, w: number, h: number) =>
  `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;

// ── left view · column section ───────────────────────────────────────────────

/** Where the section sits once the frame exists. */
const SEC = { x: 150, y: 60, s: 288 };
/** Cover, ~10 % of the section — the ratio of a real 400 mm column. */
const COVER = 32;
const RING = { x: SEC.x + COVER, y: SEC.y + COVER, s: SEC.s - COVER * 2 };
const PITCH = RING.s / 3;

/** Steps 1–2 park the section near the middle; step 3 brings it home. */
const SHIFT = 470;

const HOLE = { x: RING.x, y: SEC.y + SEC.s / 2, r: 40 };

const SEC_OUTLINE = rectD(SEC.x, SEC.y, SEC.s, SEC.s);
const SEC_STIRRUP = rectD(RING.x, RING.y, RING.s, RING.s);

type Bar = { x: number; y: number; cut: boolean };

/** Twelve longitudinal bars: four corners plus two intermediates per face. */
const BARS: Bar[] = (() => {
  const out: Bar[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (i > 0 && i < 3 && j > 0 && j < 3) continue;
      const x = RING.x + PITCH * i;
      const y = RING.y + PITCH * j;
      out.push({ x, y, cut: Math.hypot(x - HOLE.x, y - HOLE.y) < HOLE.r });
    }
  }
  return out;
})();

const LIVE_BARS = BARS.filter((b) => !b.cut);
const CUT_BARS = BARS.filter((b) => b.cut);

const cross = (x: number, y: number) =>
  `M ${x - 10} ${y - 10} L ${x + 10} ${y + 10} M ${x + 10} ${y - 10} L ${x - 10} ${y + 10}`;

/** The bit. Tip past the bore centre — it has gone through, not stopped politely. */
const BIT = {
  shaft: rectD(34, 192, 138, 28),
  tip: `M 172 192 L 202 206 L 172 220 Z`,
  chuck: rectD(-4, 180, 38, 52),
  flutes: [0, 1, 2, 3].map((i) => `M ${52 + i * 30} 220 L ${74 + i * 30} 192`).join(" "),
};

// ── right view · frame elevation ─────────────────────────────────────────────

const COL_X = [790, 990, 1190, 1390] as const;
/** The column the workman drilled, and the one that inherits its load. */
const DAMAGED = 1;
const NEIGHBOUR = 2;

const COL_W = 26;
const GRADE = 344;
const ROOF = 84;
const SLAB_H = 14;
/** Slab tops, roof last — index 0 is the storey that lands first. */
const LEVELS = [284, 218, 152, ROOF] as const;
const SLAB_X = COL_X[0] - 26;
const SLAB_W = COL_X[3] + 26 - SLAB_X;

/** Where the AC hole went: ground storey, the height a man drills standing up. */
const FRAME_HOLE = { x: COL_X[DAMAGED], y: 318, r: 9 };

const SLABS = (() => {
  const r = lcg(9931);
  return LEVELS.map((y, i) => ({
    y,
    /**
     * Pancake target: a rubble stack on grade, lowest slab first. The pitch is
     * a little wider than the slab so the four bands stay four bands, but the
     * slide and the tilt are small — past about a degree and a half the plates
     * cross each other and the pile reads as scattered planks rather than as
     * four floors that came down on top of one another.
     */
    dy: GRADE - SLAB_H - y - i * (SLAB_H + 6),
    dx: (r() * 2 - 1) * 20,
    rot: (r() * 2 - 1) * 1.2,
  }));
})();

/** The envelope the building used to fill. Drawn once it no longer does. */
const ENVELOPE = rectD(SLAB_X, ROOF, SLAB_W, GRADE - ROOF);

const GROUND = `M ${SLAB_X - 48} ${GRADE} H ${SLAB_X + SLAB_W + 48}`;
const EARTH = (() => {
  const parts: string[] = [];
  for (let x = SLAB_X - 32; x <= SLAB_X + SLAB_W + 48; x += 34) {
    parts.push(`M ${x} ${GRADE} L ${x - 12} ${GRADE + 13}`);
  }
  return parts.join(" ");
})();

/** Load rail down a shaft. The drilled one stops at the bore; that is the point. */
const RAILS = COL_X.map(
  (x, i) => `M ${x} ${ROOF + SLAB_H + 6} V ${i === DAMAGED ? FRAME_HOLE.y - 14 : GRADE - 4}`,
);
/** The stub below the severed section: still there, no longer connected. */
const DEAD_STUB = `M ${COL_X[DAMAGED]} ${FRAME_HOLE.y + 14} V ${GRADE - 4}`;
/** The neighbour's shaft, over-drawn — the load it just inherited. */
const NEIGHBOUR_RAIL = `M ${COL_X[NEIGHBOUR]} ${LEVELS[0] + SLAB_H} V ${GRADE - 4}`;

/** Impact marks where the frame meets grade under the failed column. */
const IMPACT = (() => {
  const r = lcg(1723);
  const parts: string[] = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i / 6) * Math.PI;
    const len = 18 + r() * 18;
    parts.push(
      `M ${Math.round(COL_X[DAMAGED] + Math.cos(a) * 16)} ${GRADE + 2} L ${Math.round(
        COL_X[DAMAGED] + Math.cos(a) * (16 + len),
      )} ${Math.round(GRADE + 2 - Math.abs(Math.sin(a)) * len * 0.5)}`,
    );
  }
  return parts.join(" ");
})();

const DIVIDER = `M 630 62 V 356`;

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

/** Solid fill arriving by translating a clip rect. Never a fill-opacity ramp. */
function FillWipe({
  x,
  y,
  w,
  h,
  on,
  fill,
  delay = 0,
  dur = 0.75,
  from = "up",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on: boolean;
  fill: string;
  delay?: number;
  dur?: number;
  from?: "up" | "left";
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <clipPath id={`rc-${uid}`}>
          <motion.rect
            x={x - 1}
            y={y - 1}
            width={w + 2}
            height={h + 2}
            initial={false}
            animate={from === "up" ? { y: on ? 0 : h + 2 } : { x: on ? 0 : -w - 2 }}
            transition={{ duration: dur, ease: EASE, delay: on ? delay : 0 }}
          />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={fill} clipPath={`url(#rc-${uid})`} />
    </g>
  );
}

/** A leader-and-label callout. Text is flat; only opacity and y animate. */
function Note({
  x,
  y,
  text,
  on,
  color,
  size = 25,
  anchor = "start",
  leader,
  delay = 0,
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
}) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 8 }}
      transition={{ duration: 0.38, ease: EASE, delay: on ? delay : 0 }}
    >
      {leader && (
        <path
          d={`M ${x + (anchor === "end" ? 8 : anchor === "middle" ? 0 : -8)} ${y - size * 0.3} L ${
            leader.x
          } ${leader.y}`}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.55}
        />
      )}
      <text
        x={x}
        y={y}
        fill={color}
        fontSize={size}
        textAnchor={anchor}
        className="font-sans"
        style={{ fontWeight: 700, letterSpacing: "0.01em" }}
      >
        {text}
      </text>
    </motion.g>
  );
}

// ── diagram ──────────────────────────────────────────────────────────────────

export function RebarCollapse({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.rebar;
  const uid = useId().replace(/:/g, "");
  const holeMask = `rc-hole-${uid}`;
  const gradeClip = `rc-grade-${uid}`;

  const section = step >= 1;
  const cut = step >= 2;
  const frame = step >= 3;
  const collapse = step >= 4;
  /** The load path is only true while the frame is still standing. */
  const live = frame && !collapse;

  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      <defs>
        {/* The bore. A black disc rides in with the bit, so concrete and cover
            are removed by the tool rather than faded out under it. */}
        <mask
          id={holeMask}
          maskUnits="userSpaceOnUse"
          x={SEC.x - 140}
          y={SEC.y - 140}
          width={SEC.s + 280}
          height={SEC.s + 280}
        >
          <rect x={SEC.x - 140} y={SEC.y - 140} width={SEC.s + 280} height={SEC.s + 280} fill="#fff" />
          <motion.g
            initial={false}
            animate={{ x: cut ? 0 : -340 }}
            transition={{ duration: 0.62, ease: EASE, delay: cut ? 0.06 : 0 }}
          >
            <circle cx={HOLE.x} cy={HOLE.y} r={HOLE.r} fill="#000" />
          </motion.g>
        </mask>

        {/* Grade is a floor, not a suggestion: the shafts sink through it and
            are gone. Static, so nothing about the clip itself animates. */}
        <clipPath id={gradeClip} clipPathUnits="userSpaceOnUse">
          <rect x={640} y={0} width={960} height={GRADE + 2} />
        </clipPath>
      </defs>

      {/* ══ left view · the section ═════════════════════════════════════════ */}
      <motion.g
        initial={false}
        animate={{ x: frame ? 0 : SHIFT }}
        transition={{ duration: 0.85, ease: EASE }}
      >
        <g mask={`url(#${holeMask})`}>
          <FillWipe
            x={SEC.x}
            y={SEC.y}
            w={SEC.s}
            h={SEC.s}
            on={section}
            fill="rgba(244,251,244,0.1)"
            delay={0.35}
            dur={0.85}
          />
          <Draw d={SEC_OUTLINE} on={section} stroke={BASE} w={5} dur={0.85} />
          <Draw d={SEC_STIRRUP} on={section} stroke={MID} w={3} delay={0.5} dur={0.7} />
        </g>

        {/* Bars that survive. */}
        {LIVE_BARS.map((b, i) => (
          <motion.g
            key={`lb${i}`}
            initial={false}
            animate={{ scale: section ? 1 : 1.25, opacity: section ? 1 : 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: section ? 0.8 + i * 0.06 : 0 }}
          >
            {/* One centred disc: motion's `transform-box: fill-box` default
                (50% 50%) is already the bar's own centre. */}
            <circle cx={b.x} cy={b.y} r={9} fill={BASE} />
          </motion.g>
        ))}

        {/* Bars the bit takes with it. Outside the mask so no crumb of arc can
            survive at the lip of the bore; they go out on opacity, timed to the
            moment the tip reaches them. */}
        {CUT_BARS.map((b, i) => (
          <motion.circle
            key={`cb${i}`}
            cx={b.x}
            cy={b.y}
            r={9}
            fill={BASE}
            initial={false}
            animate={{ opacity: cut ? 0 : section ? 1 : 0 }}
            transition={{
              duration: cut ? 0.16 : 0.24,
              delay: cut ? 0.52 : section ? 0.8 + i * 0.06 : 0,
            }}
          />
        ))}

        {/* What is left of them. */}
        {CUT_BARS.map((b, i) => (
          <g key={`gb${i}`}>
            <motion.circle
              cx={b.x}
              cy={b.y}
              r={9}
              fill="none"
              stroke={FAIL}
              strokeWidth={3}
              initial={false}
              animate={{ opacity: cut ? 0.85 : 0, scale: cut ? 1 : 1.3 }}
              transition={{ duration: 0.3, ease: EASE, delay: cut ? 0.72 + i * 0.08 : 0 }}
            />
            <Draw d={cross(b.x, b.y)} on={cut} stroke={FAIL} w={3.5} delay={0.86 + i * 0.08} dur={0.22} />
          </g>
        ))}

        {/* The bore's edge — spalled where it breaks the face. */}
        <motion.circle
          cx={HOLE.x}
          cy={HOLE.y}
          r={HOLE.r}
          fill="none"
          stroke={FAIL}
          strokeWidth={4}
          pathLength={1}
          strokeDasharray={1}
          initial={false}
          animate={{ strokeDashoffset: cut ? 0 : 1, opacity: cut ? 1 : 0 }}
          transition={{
            strokeDashoffset: { duration: 0.5, ease: EASE, delay: cut ? 0.66 : 0 },
            opacity: { duration: 0.2, delay: cut ? 0.66 : 0 },
          }}
        />

        {/* The tool. It arrives, and it stays: the column is like this now. */}
        <motion.g
          initial={false}
          animate={{ x: cut ? 0 : -340, opacity: cut ? 1 : 0 }}
          transition={{
            x: { duration: 0.62, ease: EASE, delay: cut ? 0.06 : 0 },
            opacity: { duration: 0.18, delay: cut ? 0.06 : 0 },
          }}
        >
          <path d={BIT.chuck} fill={MID} />
          <path d={BIT.shaft} fill="rgba(244,251,244,0.75)" />
          <path d={BIT.flutes} fill="none" stroke={V.night} strokeWidth={3} strokeLinecap="round" />
          <path d={BIT.tip} fill={BASE} />
        </motion.g>

        {/* Callouts. */}
        <Note
          x={SEC.x + SEC.s + 40}
          y={SEC.y + 46}
          text={N.materials.modernRebar}
          on={section}
          color={MID}
          size={23}
          leader={{ x: RING.x + PITCH * 3 + 14, y: RING.y + 2 }}
          delay={1.2}
        />
        <Note
          x={16}
          y={140}
          text={t(q.drillLabel, lang)}
          on={cut}
          color={MID}
          size={24}
          leader={{ x: 58, y: 180 }}
          delay={0.8}
        />
        <Note
          x={SEC.x + 154}
          y={396}
          text={t(q.cutLabel, lang)}
          on={cut}
          color={FAIL}
          size={26}
          leader={{ x: HOLE.x + 30, y: HOLE.y + 54 }}
          delay={1.0}
        />
      </motion.g>

      {/* Scale break: two views, two scales, one sheet. */}
      <Draw d={DIVIDER} on={frame} stroke={DIM} w={2} dur={0.6} />

      {/* ══ right view · the frame ══════════════════════════════════════════ */}

      <Draw d={GROUND} on={frame} stroke={MID} w={3} dur={0.7} />
      <Draw d={EARTH} on={frame} stroke={DIM} w={2} delay={0.4} dur={0.5} />

      {/* The load the drilled column can no longer carry, drawn as area. It is
          a statement about a standing frame, so it leaves with the frame. */}
      <motion.g
        initial={false}
        animate={{ opacity: live ? 1 : 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <FillWipe
          x={COL_X[DAMAGED] - 104}
          y={ROOF + SLAB_H}
          w={208}
          h={LEVELS[0] - ROOF - SLAB_H}
          on={frame}
          fill="rgba(0,168,104,0.18)"
          delay={1.0}
          dur={0.8}
        />
      </motion.g>

      {/* What the building used to fill. Without it the right half of the sheet
          just goes empty and reads as a layout fault instead of as an absence. */}
      <motion.path
        d={ENVELOPE}
        fill="none"
        stroke={DIM}
        strokeWidth={2}
        strokeDasharray="14 12"
        initial={false}
        animate={{ opacity: collapse ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: collapse ? 0.7 : 0 }}
      />

      {/* Columns. Everything above grade sinks below it and is clipped away. */}
      <g clipPath={`url(#${gradeClip})`}>
        {COL_X.map((cx, i) => {
          const failed = i === DAMAGED;
          return (
            <motion.g
              key={`col${i}`}
              initial={false}
              animate={{
                y: collapse ? (failed ? 248 : 198 + i * 9) : 0,
                rotate: collapse ? (failed ? 5.4 : i === 0 ? 2.6 : i === NEIGHBOUR ? -3 : -1.8) : 0,
                opacity: collapse && failed ? 0.4 : 1,
              }}
              transition={{
                duration: failed ? 0.5 : 0.72,
                ease: EASE,
                delay: collapse ? (failed ? 0.05 : 0.3 + i * 0.09) : 0,
              }}
              // The shaft goes out of plumb about its BASE, the way a real column
              // hinges at grade. motion sets `transform-box: fill-box` on animated
              // SVG, so the origin must be expressed against this group's own box
              // — whose bottom edge is exactly GRADE and whose horizontal centre
              // is exactly cx. A px origin would be re-based into that same box
              // and land far below the drawing.
              style={{ transformOrigin: "50% 100%" }}
            >
              <FillWipe
                x={cx - COL_W / 2}
                y={ROOF}
                w={COL_W}
                h={GRADE - ROOF}
                on={frame}
                fill="rgba(244,251,244,0.1)"
                delay={0.5 + i * 0.06}
                dur={0.6}
              />
              <Draw
                d={rectD(cx - COL_W / 2, ROOF, COL_W, GRADE - ROOF)}
                on={frame}
                stroke={BASE}
                w={3}
                delay={0.16 + i * 0.06}
                dur={0.6}
              />

              {/* Rails, bore and stub all describe a load path. They live inside
                  the shaft's own group so they stay welded to it, and they go
                  out together the moment that path stops existing. */}
              <motion.g
                initial={false}
                animate={{ opacity: live ? 1 : 0 }}
                transition={{ duration: 0.26, ease: EASE }}
              >
                {i === NEIGHBOUR && (
                  <motion.g
                    initial={false}
                    animate={{ scaleX: frame ? 1 : 0.3 }}
                    transition={{ duration: 0.55, ease: EASE, delay: frame ? 1.7 : 0 }}
                  >
                    {/* The rail is a vertical stroke centred on cx, so the fill-box
                        default puts the scaleX pivot on its own axis — which is the
                        only pivot that reads as "this rail got thicker". */}
                    <Draw
                      d={NEIGHBOUR_RAIL}
                      on={frame}
                      stroke={LOAD}
                      w={11}
                      opacity={0.6}
                      delay={1.7}
                      dur={0.5}
                      cap="butt"
                    />
                  </motion.g>
                )}

                <Draw
                  d={RAILS[i]}
                  on={frame}
                  stroke={LOAD}
                  w={failed ? 4 : 3}
                  opacity={failed ? 1 : 0.65}
                  delay={0.9 + i * 0.06}
                  dur={0.55}
                />

                {failed && (
                  <>
                    {/* Below the bore the shaft is standing and no longer carrying:
                        a stub, not a column. */}
                    <Draw d={DEAD_STUB} on={frame} stroke={DIM} w={3} delay={1.1} dur={0.35} />
                    <motion.circle
                      cx={FRAME_HOLE.x}
                      cy={FRAME_HOLE.y}
                      r={FRAME_HOLE.r}
                      fill={V.night}
                      stroke={FAIL}
                      strokeWidth={3.5}
                      initial={false}
                      animate={{ opacity: frame ? 1 : 0, scale: frame ? 1 : 1.25 }}
                      transition={{ duration: 0.3, ease: EASE, delay: frame ? 0.95 : 0 }}
                    />
                  </>
                )}
              </motion.g>

              {/* Ember over-draw: the shaft failing, not a stroke swap. */}
              <Draw
                d={rectD(cx - COL_W / 2, ROOF, COL_W, GRADE - ROOF)}
                on={collapse}
                stroke={FAIL}
                w={3.5}
                delay={0.15 + i * 0.09}
                dur={0.55}
              />
            </motion.g>
          );
        })}
      </g>

      {/* Slabs. Bottom-up on a 0.1 s stagger — the chain in "zanjirli qulash".
          Heavy: 0.55 s of fall on the deck's ease, and each landing blooms. */}
      {SLABS.map((s, i) => (
        <g key={`slab${i}`}>
          <motion.g
            initial={false}
            animate={{ x: collapse ? s.dx : 0, y: collapse ? s.dy : 0, rotate: collapse ? s.rot : 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: collapse ? 0.12 + i * 0.1 : 0 }}
          >
            {/* The slab's own bbox centre is the pivot the tilt wants, and it is
                what motion's `transform-box: fill-box` default already gives. */}
            <FillWipe
              x={SLAB_X}
              y={s.y}
              w={SLAB_W}
              h={SLAB_H}
              on={frame}
              fill={collapse ? "rgba(255,90,60,0.45)" : "rgba(244,251,244,0.16)"}
              delay={0.55 + i * 0.06}
              dur={0.7}
            />
            <Draw
              d={rectD(SLAB_X, s.y, SLAB_W, SLAB_H)}
              on={frame}
              stroke={BASE}
              w={3}
              delay={0.3 + i * 0.06}
              dur={0.55}
            />
            <Draw
              d={rectD(SLAB_X, s.y, SLAB_W, SLAB_H)}
              on={collapse}
              stroke={FAIL}
              w={3}
              delay={0.12 + i * 0.1}
              dur={0.45}
            />
          </motion.g>

          {/* Dust bloom at the landing height — a scaling disc, never a blur. */}
          <motion.g
            initial={false}
            animate={{
              scale: collapse ? [0.3, 1.5] : 0.3,
              opacity: collapse ? [0.4, 0] : 0,
            }}
            transition={{ duration: 0.9, ease: EASE, delay: collapse ? 0.5 + i * 0.1 : 0 }}
          >
            {/* The bloom is one ellipse centred on the landing point, so the
                fill-box default expands it from that landing point. */}
            <ellipse
              cx={SLAB_X + SLAB_W / 2}
              cy={s.y + s.dy}
              rx={SLAB_W / 2}
              ry={20}
              fill="rgba(244,251,244,0.2)"
            />
          </motion.g>
        </g>
      ))}

      {/* Load arriving at the roof. */}
      {COL_X.map((x, i) => (
        <motion.g
          key={`in${i}`}
          initial={false}
          animate={{ opacity: live ? 1 : 0, y: frame ? 0 : -14 }}
          transition={{ duration: 0.35, ease: EASE, delay: live ? 0.75 + i * 0.06 : 0 }}
        >
          <rect
            x={x - (i === DAMAGED ? 3.5 : 2)}
            y={38}
            width={i === DAMAGED ? 7 : 4}
            height={26}
            fill={i === DAMAGED ? LOAD : DIM}
          />
          <path
            d={`M ${x - 10} 62 L ${x} ${ROOF - 8} L ${x + 10} 62 Z`}
            fill={i === DAMAGED ? LOAD : DIM}
          />
        </motion.g>
      ))}

      {/* The transfer itself: the load walking sideways into the neighbour. */}
      <motion.g
        initial={false}
        animate={{ opacity: live ? 1 : 0 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
        <Draw
          d={`M ${COL_X[DAMAGED] + 24} ${LEVELS[0] - 14} C ${COL_X[DAMAGED] + 80} ${
            LEVELS[0] - 44
          } ${COL_X[NEIGHBOUR] - 80} ${LEVELS[0] - 44} ${COL_X[NEIGHBOUR] - 30} ${LEVELS[0] - 14}`}
          on={frame}
          stroke={LOAD}
          w={5}
          delay={1.35}
          dur={0.5}
        />
        <motion.path
          d={`M ${COL_X[NEIGHBOUR] - 30} ${LEVELS[0] - 14} L ${COL_X[NEIGHBOUR] - 48} ${
            LEVELS[0] - 28
          } M ${COL_X[NEIGHBOUR] - 30} ${LEVELS[0] - 14} L ${COL_X[NEIGHBOUR] - 46} ${LEVELS[0] - 4}`}
          fill="none"
          stroke={LOAD}
          strokeWidth={5}
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: frame ? 1 : 0 }}
          transition={{ duration: 0.25, delay: frame ? 1.8 : 0 }}
        />
      </motion.g>

      <Draw d={IMPACT} on={collapse} stroke={FAIL} w={3} opacity={0.85} delay={0.62} dur={0.45} />

      {/* Callouts. */}
      <Note
        x={COL_X[DAMAGED] - 36}
        y={396}
        anchor="end"
        text={t(q.colDamaged, lang)}
        on={frame}
        color={FAIL}
        leader={{ x: COL_X[DAMAGED] - 6, y: GRADE + 16 }}
        delay={1.15}
      />
      <Note
        x={COL_X[NEIGHBOUR] + 34}
        y={396}
        text={t(q.colNeighbour, lang)}
        on={frame}
        color={collapse ? FAIL : LOAD}
        leader={{ x: COL_X[NEIGHBOUR] + 6, y: GRADE + 16 }}
        delay={1.55}
      />
      <Note
        x={COL_X[DAMAGED] - 112}
        y={ROOF - 28}
        anchor="end"
        text={t(q.loadLabel, lang)}
        on={live}
        color={LOAD}
        size={26}
        delay={1.45}
      />
      {/* The overload belongs to the re-route, not to the rubble: it is the
          sentence that explains why the next step happens. */}
      <Note
        x={COL_X[3] + 48}
        y={ROOF + 46}
        text={t(q.overloadLabel, lang)}
        on={live}
        color={FAIL}
        size={26}
        leader={{ x: COL_X[NEIGHBOUR] + 26, y: LEVELS[1] - 10 }}
        delay={1.95}
      />
    </svg>
  );
}

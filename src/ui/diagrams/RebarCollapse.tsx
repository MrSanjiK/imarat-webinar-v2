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
  SketchPath,
  hatch,
  rng,
  wobbleEllipse,
  wobbleLine,
  wobblePoly,
  wobbleRect,
} from "@/ui/sketch";

/**
 * RebarCut → ProgressiveCollapse — chapter 1 ("Zilzila"), dark theme, slot
 * 1600×420. The climax of the chapter: the argument that a building is not
 * killed by the earthquake but by what somebody did to it on a Tuesday.
 *
 * The drawing is two views side by side, at two different scales, because the
 * argument crosses scales: a 400 mm column section on the left, the frame it
 * belongs to on the right. Cutting between them would read as a glitch, so the
 * section starts near the middle of the sheet and slides to its left home when
 * the frame arrives — the camera stepping back, not a jump cut.
 *
 * Step choreography
 *   0 — empty sheet.
 *   1 — the section draws: concrete outline, 45° hatch wiped in, the stirrup,
 *       twelve longitudinal bars. Spec note A500S on the ring.
 *   2 — a drill bit travels in from the left. Riding with it is the black
 *       circle of a mask, so the hole is *bored*, not faded in: hatch, outline
 *       and cover disappear where the bit passes. The two bars on the drill's
 *       axis go out with it; ember ghost rings and cross marks are left where
 *       they were.
 *   3 — the section slides left, a rule splits the sheet, and the four-storey
 *       frame draws on the right. Gold load lines run down every column; the
 *       drilled column's line stops dead at the hole. The load above it is
 *       hatched, then an arrow walks it sideways into the neighbour, whose
 *       ground-storey shaft is over-drawn heavy.
 *   4 — the neighbour takes more than it has. Slabs pancake bottom-up on a
 *       90 ms stagger, the drilled column sinks and dims, every shaft is
 *       over-drawn in ember, impact marks strike the grade.
 *
 * Rules this file keeps
 *   · Pure function of `step`. No timers, no state, no effects. Every `on` is
 *     `step >= n`, so 4 → 3 renders exactly what 3 → 4 rendered.
 *   · Only `transform`, `opacity` and `strokeDashoffset` animate.
 *   · All pencil jitter is seeded and baked into the `d` strings at module load
 *     — one evaluation for the whole deck, never per frame.
 *   · Every wipe translates an oversized mask rect rather than scaling it:
 *     motion overwrites pixel `transform-origin` with 50% 50% on SVG, so a
 *     scale wipe would open from the middle instead of the edge.
 */

// ── palette ──────────────────────────────────────────────────────────────────

const PAPER = "rgba(244,241,234,0.86)";
const DIM = "rgba(244,241,234,0.52)";
const FAINT = "rgba(244,241,234,0.26)";

/** Gold carries load. Ember carries failure. Nothing else is coloured. */
const LOAD = C.gold;
const FAIL = C.ember;

// ── left view · column section ───────────────────────────────────────────────

/** The section's home, i.e. where it sits once the frame exists. */
const SEC = { x: 150, y: 64, s: 284 };
/** Cover thickness, ~10% of the section — the same ratio as a real 400 mm column. */
const COVER = 30;
const RING = { x: SEC.x + COVER, y: SEC.y + COVER, s: SEC.s - COVER * 2 };
const PITCH = RING.s / 3;

/** Steps 1–2 park the section near the middle of the sheet; step 3 brings it home. */
const SHIFT = 480;

const HOLE = { x: RING.x, y: SEC.y + SEC.s / 2, r: 38 };

const SEC_OUTLINE = wobbleRect(SEC.x, SEC.y, SEC.s, SEC.s, 211, 1.5, 3);
const SEC_STIRRUP = wobbleRect(RING.x, RING.y, RING.s, RING.s, 307, 1.2, 2);
const HOLE_RIM = wobbleEllipse(HOLE.x, HOLE.y, HOLE.r, HOLE.r, 419, 2.2);

type Bar = { x: number; y: number; d: string; cut: boolean };

/** Twelve longitudinal bars: four corners plus two intermediates per face. */
const BARS: Bar[] = (() => {
  const out: Bar[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (i > 0 && i < 3 && j > 0 && j < 3) continue;
      const x = RING.x + PITCH * i;
      const y = RING.y + PITCH * j;
      out.push({
        x,
        y,
        d: wobbleEllipse(x, y, 7, 7, 521 + i * 13 + j * 5, 0.9),
        cut: Math.hypot(x - HOLE.x, y - HOLE.y) < HOLE.r,
      });
    }
  }
  return out;
})();

/** The cross struck through each lost bar, so the void reads as a subtraction. */
const cross = (x: number, y: number, seed: number) =>
  wobbleLine(x - 8, y - 8, x + 8, y + 8, seed, 0.8) + " " + wobbleLine(x + 8, y - 8, x - 8, y + 8, seed + 1, 0.8);

/**
 * The bit. Tip past the hole centre, so it has visibly gone through the bars
 * rather than stopped politely at the face.
 */
const BIT = {
  shaft: wobbleRect(40, 194, 130, 24, 601, 1.0, 1.5),
  tip: wobblePoly(
    [
      [170, 194],
      [196, 206],
      [170, 218],
    ],
    631,
    0.9,
    true,
  ),
  chuck: wobbleRect(4, 184, 36, 44, 661, 1.1, 2),
  flutes: [0, 1, 2, 3]
    .map((i) => wobbleLine(56 + i * 28, 218, 76 + i * 28, 194, 691 + i, 0.7))
    .join(" "),
};

// ── right view · frame elevation ─────────────────────────────────────────────

const COL_X = [790, 990, 1190, 1390] as const;
/** The column the workman drilled, and the one that inherits its load. */
const DAMAGED = 1;
const NEIGHBOUR = 2;

const COL_W = 22;
const GRADE = 344;
const ROOF = 86;
const SLAB_H = 12;
/** Slab tops, roof first — index 0 is the storey that lands first. */
const LEVELS = [284, 218, 152, ROOF] as const;
const SLAB_X = COL_X[0] - 24;
const SLAB_W = COL_X[3] + 24 - SLAB_X;

/** Where the AC hole went: ground storey, the height a man drills standing up. */
const FRAME_HOLE = { x: COL_X[DAMAGED], y: 320, r: 7 };

const COLUMNS = COL_X.map((x, i) => ({
  x,
  outline: wobbleRect(x - COL_W / 2, ROOF, COL_W, GRADE - ROOF, 811 + i * 17, 1.1, 2),
}));

const SLABS = (() => {
  const r = rng(9931);
  return LEVELS.map((y, i) => ({
    y,
    outline: wobbleRect(SLAB_X, y, SLAB_W, SLAB_H, 907 + i * 23, 1.0, 2),
    /**
     * Pancake targets: a rubble stack on grade, lowest slab first. The pitch is
     * wider than the slab and every plate slides sideways, because stacked
     * flush the four hatched 12 px bands merge into one solid ember bar and
     * "zanjirli qulash" stops reading as four separate floors.
     */
    dy: GRADE - SLAB_H - y - i * (SLAB_H + 9),
    dx: (r() * 2 - 1) * 26,
    rot: (r() * 2 - 1) * 2.6,
  }));
})();

const GROUND = wobbleLine(SLAB_X - 44, GRADE, SLAB_X + SLAB_W + 44, GRADE, 55, 1.6);
const EARTH = (() => {
  const parts: string[] = [];
  for (let x = SLAB_X - 30; x <= SLAB_X + SLAB_W + 44; x += 34) {
    parts.push(wobbleLine(x, GRADE, x - 11, GRADE + 12, x, 0.7));
  }
  return parts.join(" ");
})();

const FRAME_HOLE_RIM = wobbleEllipse(FRAME_HOLE.x, FRAME_HOLE.y, FRAME_HOLE.r, FRAME_HOLE.r, 1013, 0.8);

/** Load line down a shaft. The drilled one stops at the hole; that is the point. */
const LOAD_LINES = COL_X.map((x, i) =>
  wobbleLine(x, ROOF + SLAB_H + 4, x, i === DAMAGED ? FRAME_HOLE.y - 10 : GRADE - 3, 1103 + i * 7, 1.0),
);
/** The stub below the severed section: still there, no longer connected. */
const DEAD_STUB = wobbleLine(
  COL_X[DAMAGED],
  FRAME_HOLE.y + 10,
  COL_X[DAMAGED],
  GRADE - 3,
  1151,
  1.0,
);
/** The neighbour's ground storey, over-drawn heavy — the load it just inherited. */
const NEIGHBOUR_HEAVY = wobbleLine(
  COL_X[NEIGHBOUR],
  LEVELS[0] + SLAB_H,
  COL_X[NEIGHBOUR],
  GRADE - 3,
  1181,
  0.9,
);

/** Impact marks where the frame meets grade under the failed column. */
const IMPACT = (() => {
  const r = rng(1723);
  const parts: string[] = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i / 6) * Math.PI;
    const len = 16 + r() * 16;
    parts.push(
      wobbleLine(
        COL_X[DAMAGED] + Math.cos(a) * 14,
        GRADE + 2,
        COL_X[DAMAGED] + Math.cos(a) * (14 + len),
        GRADE + 2 + Math.abs(Math.sin(a)) * -len * 0.5,
        1801 + i,
        0.8,
      ),
    );
  }
  return parts.join(" ");
})();

const DIVIDER = wobbleLine(636, 70, 636, 352, 1901, 1.2);

// ── hatch, wiped by a translating mask ───────────────────────────────────────

/**
 * The deck's signature fill. Identical in spirit to `<Hatch>`, but the reveal
 * translates the clip rect instead of scaling it, which is transform-origin
 * independent and therefore safe on SVG under motion v13.
 */
function HatchWipe({
  x,
  y,
  w,
  h,
  on,
  gap = 10,
  seed = 1,
  stroke = PAPER,
  width = 1.5,
  opacity = 0.18,
  delay = 0,
  duration = 0.75,
}: {
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
  const boxId = `rc-box-${uid}`;
  const wipeId = `rc-wipe-${uid}`;
  const d = useMemo(() => hatch(x, y, w, h, gap, 45, seed), [x, y, w, h, gap, seed]);

  return (
    <g>
      <defs>
        <clipPath id={boxId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <clipPath id={wipeId}>
          <motion.rect
            x={x}
            y={y - 4}
            width={w}
            height={h + 8}
            initial={false}
            animate={{ x: on ? 0 : -w - 8 }}
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

// ── diagram ──────────────────────────────────────────────────────────────────

export function RebarCollapse({ step }: { step: number }) {
  const lang = useLang();
  const q = S.quake.rebar;
  const uid = useId().replace(/:/g, "");
  const holeMask = `rc-hole-${uid}`;

  const section = step >= 1;
  const cut = step >= 2;
  const frame = step >= 3;
  const collapse = step >= 4;

  return (
    <svg viewBox="0 0 1600 420" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* The bore. A black disc rides in with the bit, so concrete, hatch and
            cover are removed by the tool rather than faded out under it. */}
        <mask
          id={holeMask}
          maskUnits="userSpaceOnUse"
          x={SEC.x - 120}
          y={SEC.y - 120}
          width={SEC.s + 240}
          height={SEC.s + 240}
        >
          <rect
            x={SEC.x - 120}
            y={SEC.y - 120}
            width={SEC.s + 240}
            height={SEC.s + 240}
            fill="#fff"
          />
          <motion.g
            initial={false}
            animate={{ x: cut ? 0 : -340 }}
            transition={{ duration: 0.62, ease: EASE, delay: cut ? 0.06 : 0 }}
          >
            <path d={HOLE_RIM} fill="#000" />
          </motion.g>
        </mask>
      </defs>

      {/* ══ left view · the section ═══════════════════════════════════════════
          Steps 1–2 hold it near the middle of the sheet; step 3 walks it left
          to make room for the frame. One translate, no cut. */}
      <motion.g
        initial={false}
        animate={{ x: frame ? 0 : SHIFT }}
        transition={{ duration: 0.85, ease: EASE }}
      >
        <g mask={`url(#${holeMask})`}>
          <HatchWipe
            x={SEC.x}
            y={SEC.y}
            w={SEC.s}
            h={SEC.s}
            on={section}
            gap={13}
            seed={31}
            stroke={C.paper}
            opacity={0.16}
            delay={0.45}
            duration={0.85}
          />
          <SketchPath d={SEC_OUTLINE} on={section} stroke={PAPER} width={2.6} duration={0.8} />
          <SketchPath d={SEC_STIRRUP} on={section} stroke={DIM} width={1.8} delay={0.5} duration={0.7} />

          {/* Bars that survive. */}
          {BARS.filter((b) => !b.cut).map((b, i) => (
            <g key={i}>
              <SketchPath d={b.d} on={section} stroke={PAPER} width={1.8} delay={0.85 + i * 0.03} duration={0.3} />
              <motion.circle
                cx={b.x}
                cy={b.y}
                r={3.4}
                fill={C.paper}
                initial={false}
                animate={{ opacity: section ? 0.8 : 0 }}
                transition={{ duration: 0.22, delay: section ? 0.95 + i * 0.03 : 0 }}
              />
            </g>
          ))}
        </g>

        {/* Bars the bit takes with it. Outside the mask so no crumb of arc can
            survive at the edge of the bore; they go out on opacity, timed to
            the moment the tip reaches them. */}
        {BARS.filter((b) => b.cut).map((b, i) => (
          <motion.g
            key={i}
            initial={false}
            animate={{ opacity: cut ? 0 : section ? 1 : 0 }}
            transition={{ duration: cut ? 0.16 : 0.22, delay: cut ? 0.52 : section ? 0.85 + i * 0.03 : 0 }}
          >
            <SketchPath d={b.d} on={section} stroke={PAPER} width={1.8} delay={0.85 + i * 0.03} duration={0.3} />
            <circle cx={b.x} cy={b.y} r={3.4} fill={C.paper} opacity={0.8} />
          </motion.g>
        ))}

        {/* What is left of them. */}
        {BARS.filter((b) => b.cut).map((b, i) => (
          <g key={i}>
            <SketchPath
              d={b.d}
              on={cut}
              stroke={FAIL}
              width={1.6}
              opacity={0.75}
              delay={0.72 + i * 0.07}
              duration={0.3}
            />
            <SketchPath
              d={cross(b.x, b.y, 1201 + i * 3)}
              on={cut}
              stroke={FAIL}
              width={2}
              delay={0.86 + i * 0.07}
              duration={0.22}
            />
          </g>
        ))}

        {/* The bore's edge — spalled where it breaks the face. */}
        <SketchPath d={HOLE_RIM} on={cut} stroke={FAIL} width={2.2} delay={0.66} duration={0.5} />

        {/* The tool. It arrives, and it stays: the column is like this now. */}
        <motion.g
          initial={false}
          animate={{ x: cut ? 0 : -340, opacity: cut ? 1 : 0 }}
          transition={{
            x: { duration: 0.62, ease: EASE, delay: cut ? 0.06 : 0 },
            opacity: { duration: 0.18, delay: cut ? 0.06 : 0 },
          }}
        >
          <SketchPath d={BIT.chuck} on={cut} stroke={DIM} width={2} delay={0.1} duration={0.3} />
          <SketchPath d={BIT.shaft} on={cut} stroke={PAPER} width={2} delay={0.14} duration={0.35} />
          <SketchPath d={BIT.flutes} on={cut} stroke={DIM} width={1.4} delay={0.24} duration={0.3} />
          <SketchPath d={BIT.tip} on={cut} stroke={PAPER} width={2} delay={0.3} duration={0.25} />
        </motion.g>

        {/* Callouts. */}
        <Annotation
          x={SEC.x + SEC.s + 36}
          y={SEC.y + 44}
          text={N.materials.modernRebar}
          on={section}
          delay={1.25}
          size={22}
          color={DIM}
          leader={{ x: RING.x + PITCH * 3 + 12, y: RING.y + 2 }}
          seed={77}
        />
        {/* Leaders always leave the anchor away from the text: `start` labels
            are pointed at from the left, `end` labels from the right. */}
        <Annotation
          x={16}
          y={142}
          text={t(q.drillLabel, lang)}
          on={cut}
          delay={0.8}
          size={24}
          color={DIM}
          leader={{ x: 56, y: 182 }}
          seed={83}
        />
        <Annotation
          x={SEC.x + 150}
          y={392}
          text={t(q.cutLabel, lang)}
          on={cut}
          delay={1.0}
          size={26}
          color={FAIL}
          leader={{ x: HOLE.x + 36, y: HOLE.y + 56 }}
          seed={89}
        />
      </motion.g>

      {/* Scale break: two views, two scales, one sheet. */}
      <SketchPath d={DIVIDER} on={frame} stroke={FAINT} width={1.5} duration={0.6} />

      {/* ══ right view · the frame ════════════════════════════════════════════ */}

      <SketchPath d={GROUND} on={frame} stroke={DIM} width={2} duration={0.7} />
      <SketchPath d={EARTH} on={frame} stroke={FAINT} width={1.5} delay={0.4} duration={0.5} />

      {/* The load the drilled column can no longer carry, drawn as area. */}
      <HatchWipe
        x={COL_X[DAMAGED] - 100}
        y={ROOF + SLAB_H}
        w={200}
        h={LEVELS[0] - ROOF - SLAB_H}
        on={frame}
        gap={14}
        seed={53}
        stroke={LOAD}
        width={1.5}
        opacity={0.22}
        delay={1.0}
        duration={0.8}
      />

      {/* Columns. The drilled one sinks and dims when it finally lets go. */}
      {COLUMNS.map((c, i) => {
        const failed = i === DAMAGED;
        return (
          <motion.g
            key={i}
            initial={false}
            animate={{
              y: collapse && failed ? 30 : 0,
              rotate: collapse ? (failed ? 5 : i === 0 ? 1.3 : i === NEIGHBOUR ? -1.2 : -0.5) : 0,
              opacity: collapse && failed ? 0.28 : 1,
            }}
            transition={{
              duration: failed ? 0.5 : 0.7,
              ease: EASE,
              delay: collapse ? (failed ? 0.05 : 0.3 + i * 0.09) : 0,
            }}
            style={{ transformOrigin: `${c.x}px ${GRADE}px` }}
          >
            <HatchWipe
              x={c.x - COL_W / 2}
              y={ROOF}
              w={COL_W}
              h={GRADE - ROOF}
              on={frame}
              gap={9}
              seed={61 + i * 9}
              stroke={C.paper}
              opacity={0.14}
              delay={0.55 + i * 0.07}
              duration={0.6}
            />
            <SketchPath
              d={c.outline}
              on={frame}
              stroke={PAPER}
              width={2}
              delay={0.18 + i * 0.07}
              duration={0.6}
            />
            {/* The load line lives inside the shaft's own group, so it stays
                welded to the column when the frame goes out of plumb. */}
            {i === NEIGHBOUR && (
              <>
                {/* Over-drawn heavy: more load arriving on the same steel. */}
                <SketchPath
                  d={NEIGHBOUR_HEAVY}
                  on={frame}
                  stroke={LOAD}
                  width={7}
                  opacity={0.5}
                  delay={1.7}
                  duration={0.5}
                  cap="butt"
                />
                <SketchPath
                  d={NEIGHBOUR_HEAVY}
                  on={collapse}
                  stroke={FAIL}
                  width={7}
                  opacity={0.55}
                  delay={0.45}
                  duration={0.45}
                  cap="butt"
                />
              </>
            )}
            <SketchPath
              d={LOAD_LINES[i]}
              on={frame}
              stroke={LOAD}
              width={failed ? 2.6 : 2}
              opacity={failed ? 0.95 : 0.6}
              delay={0.9 + i * 0.06}
              duration={0.55}
            />
            {failed && (
              <>
                {/* Below the bore the shaft is still standing and no longer
                    carrying: a stub, not a column. */}
                <SketchPath d={DEAD_STUB} on={frame} stroke={FAINT} width={2} delay={1.1} duration={0.35} />
                <SketchPath d={FRAME_HOLE_RIM} on={frame} stroke={FAIL} width={2.4} delay={0.95} duration={0.3} />
              </>
            )}

            {/* Ember over-draw: the shaft failing, not a stroke swap. */}
            <SketchPath
              d={c.outline}
              on={collapse}
              stroke={FAIL}
              width={2.2}
              delay={0.15 + i * 0.09}
              duration={0.55}
            />
          </motion.g>
        );
      })}

      {/* Slabs. Bottom-up on a 90 ms stagger — the chain in "zanjirli qulash". */}
      {SLABS.map((s, i) => (
        <motion.g
          key={i}
          initial={false}
          animate={{ x: collapse ? s.dx : 0, y: collapse ? s.dy : 0, rotate: collapse ? s.rot : 0 }}
          transition={{
            duration: 0.52,
            ease: EASE,
            delay: collapse ? 0.12 + i * 0.09 : 0,
          }}
          style={{ transformOrigin: `${SLAB_X + SLAB_W / 2}px ${s.y + SLAB_H / 2}px` }}
        >
          <HatchWipe
            x={SLAB_X}
            y={s.y}
            w={SLAB_W}
            h={SLAB_H}
            on={frame}
            gap={11}
            seed={131 + i * 11}
            stroke={C.paper}
            opacity={0.2}
            delay={0.6 + i * 0.06}
            duration={0.7}
          />
          <SketchPath
            d={s.outline}
            on={frame}
            stroke={PAPER}
            width={2}
            delay={0.32 + i * 0.06}
            duration={0.55}
          />
          <SketchPath
            d={s.outline}
            on={collapse}
            stroke={FAIL}
            width={2}
            delay={0.12 + i * 0.09}
            duration={0.45}
          />
        </motion.g>
      ))}

      {/* Load arriving at the roof. */}
      {COL_X.map((x, i) => (
        <SketchArrow
          key={i}
          x1={x}
          y1={44}
          x2={x}
          y2={ROOF - 8}
          seed={1301 + i * 5}
          head={11}
          on={frame}
          stroke={i === DAMAGED ? LOAD : DIM}
          width={i === DAMAGED ? 2.4 : 1.6}
          delay={0.75 + i * 0.06}
          duration={0.35}
        />
      ))}

      {/* The transfer itself. */}
      <SketchArrow
        x1={COL_X[DAMAGED] + 22}
        y1={LEVELS[0] - 14}
        x2={COL_X[NEIGHBOUR] - 22}
        y2={LEVELS[0] - 14}
        seed={1409}
        head={16}
        on={frame}
        stroke={LOAD}
        width={3}
        delay={1.35}
        duration={0.5}
        curve={-22}
      />
      {/* Over-draw rather than a stroke swap: the same load, now lethal. */}
      <SketchArrow
        x1={COL_X[DAMAGED] + 22}
        y1={LEVELS[0] - 14}
        x2={COL_X[NEIGHBOUR] - 22}
        y2={LEVELS[0] - 14}
        seed={1409}
        head={16}
        on={collapse}
        stroke={FAIL}
        width={3}
        delay={0.3}
        duration={0.45}
        curve={-22}
      />

      <SketchPath d={IMPACT} on={collapse} stroke={FAIL} width={2} opacity={0.8} delay={0.62} duration={0.45} />

      {/* Callouts. */}
      <Annotation
        x={COL_X[DAMAGED] - 34}
        y={396}
        anchor="end"
        text={t(q.colDamaged, lang)}
        on={frame}
        delay={1.15}
        size={25}
        color={FAIL}
        leader={{ x: COL_X[DAMAGED] - 4, y: GRADE + 14 }}
        seed={151}
      />
      <Annotation
        x={COL_X[NEIGHBOUR] + 32}
        y={396}
        text={t(q.colNeighbour, lang)}
        on={frame}
        delay={1.55}
        size={25}
        color={collapse ? FAIL : LOAD}
        leader={{ x: COL_X[NEIGHBOUR] + 4, y: GRADE + 14 }}
        seed={157}
      />
      <Annotation
        x={COL_X[DAMAGED] - 108}
        y={ROOF - 30}
        anchor="end"
        text={t(q.loadLabel, lang)}
        on={frame}
        delay={1.45}
        size={26}
        color={LOAD}
      />
      <Annotation
        x={COL_X[3] + 46}
        y={ROOF + 44}
        text={t(q.overloadLabel, lang)}
        on={collapse}
        delay={0.95}
        size={26}
        color={FAIL}
        leader={{ x: COL_X[NEIGHBOUR] + 24, y: LEVELS[1] - 8 }}
        seed={163}
      />
    </svg>
  );
}

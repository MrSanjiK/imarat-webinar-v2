"use client";

import { useMemo } from "react";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { Annotation, C, Hatch, SketchLine, SketchPoly, SketchRect } from "@/ui/sketch";

/**
 * FloorPriceLadder — a building section, drawn side-on, that says one thing:
 * the higher you go, the cheaper it gets.
 *
 * Step choreography
 *   0 — empty paper.
 *   1 — the section draws itself from the ground up: ground line and its hatch,
 *       then the outline (up the left wall, across the roof, down the right),
 *       then fifteen floor slabs stacking upward. Sixteen floors in all.
 *   2 — the hero band lights: floors 13–16, gold hatching, gold band outline.
 *   3 — floors 9–12 light, ink hatching, fainter.
 *   4 — floors 4–8 and then 2–3 light, fainter still.
 *
 * Lighting runs top-down on purpose: 13–16 is the $9 700 tier and the eye must
 * land there first. Prices themselves are printed by the slide, not here.
 */

// ── section geometry ─────────────────────────────────────────────────────────

const BASE_Y = 660; // ground line
const FLOOR_H = 36; // 16 floors × 36 = 576
const X = 60;
const W = 196;
const TOP_Y = BASE_Y - 16 * FLOOR_H; // 84

/** Top edge of floor `n`, counting 1 as the ground floor. */
const yOf = (n: number) => BASE_Y - n * FLOOR_H;

/** "13–16" → [13, 16]; the range comes from figures.ts, never retyped. */
const parseFloors = (s: string): [number, number] => {
  const [lo, hi] = s.split(/\D+/).filter(Boolean).map(Number);
  return [lo, hi ?? lo];
};

/** Top-down: index 0 is the hero band, so it lights first. */
const BAND_STEP = [2, 3, 4, 4];

const BAND = [
  { color: C.gold, hatchOpacity: 0.55, gap: 10, label: C.gold },
  { color: C.ink, hatchOpacity: 0.3, gap: 12, label: C.ink2 },
  { color: C.ink, hatchOpacity: 0.2, gap: 15, label: C.ash },
  { color: C.ink, hatchOpacity: 0.14, gap: 18, label: C.ash },
] as const;

export function FloorPriceLadder({ step }: { step: number }) {
  const lang = useLang();
  const floorsLabel = t(S.offer.ladder.floorsLabel, lang);

  const built = step >= 1;

  const bands = useMemo(
    () =>
      N.studio.tiers.map((tier, i) => {
        const [lo, hi] = parseFloors(tier.floors);
        const y = yOf(hi);
        return { floors: tier.floors, y, h: yOf(lo - 1) - y, i };
      }),
    [],
  );

  // 15 interior slabs; the roof is the 16th floor line and belongs to the outline.
  const slabs = useMemo(() => Array.from({ length: 15 }, (_, k) => yOf(k + 1)), []);

  return (
    <svg viewBox="0 0 420 720" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {/* ground */}
      <SketchLine
        x1={16}
        y1={BASE_Y}
        x2={404}
        y2={BASE_Y}
        seed={7}
        amp={1.6}
        on={built}
        stroke={C.ink}
        width={2.4}
        duration={0.7}
      />
      <Hatch
        x={16}
        y={BASE_Y + 2}
        w={388}
        h={14}
        gap={13}
        angle={45}
        seed={23}
        on={built}
        stroke={C.ink}
        width={1.5}
        opacity={0.22}
        delay={0.24}
        duration={0.6}
      />

      {/* outline — drawn bottom-left up, over the roof, and back down */}
      <SketchPoly
        pts={[
          [X, BASE_Y],
          [X, TOP_Y],
          [X + W, TOP_Y],
          [X + W, BASE_Y],
        ]}
        seed={13}
        amp={1.5}
        on={built}
        stroke={C.ink}
        width={2.2}
        delay={0.12}
        duration={1.15}
      />

      {/* floor slabs, stacking upward */}
      {slabs.map((y, k) => (
        <SketchLine
          key={y}
          x1={X}
          y1={y}
          x2={X + W}
          y2={y}
          seed={31 + k * 3}
          amp={1.2}
          on={built}
          stroke={C.ink}
          width={1.5}
          opacity={0.55}
          delay={0.28 + k * 0.06}
          duration={0.42}
        />
      ))}

      {/* tier bands — top-down, hero first */}
      {bands.map(({ floors, y, h, i }) => {
        const on = step >= BAND_STEP[i];
        const b = BAND[i];
        // 4–8 and 2–3 share step 4; the lower one trails so they cascade.
        const lead = i === 3 ? 0.2 : 0;

        return (
          <g key={floors}>
            {i === 0 && (
              <SketchRect
                x={X}
                y={y}
                w={W}
                h={h}
                seed={71}
                amp={1.5}
                on={on}
                stroke={C.gold}
                width={2.4}
                duration={0.85}
              />
            )}

            <Hatch
              x={X + 3}
              y={y + 3}
              w={W - 6}
              h={h - 6}
              gap={b.gap}
              angle={45}
              seed={101 + i * 17}
              on={on}
              stroke={b.color}
              width={1.5}
              opacity={b.hatchOpacity}
              delay={lead + (i === 0 ? 0.3 : 0.08)}
              duration={0.75}
            />

            <Annotation
              x={276}
              y={y + h / 2 + 7}
              text={`${floors} ${floorsLabel}`}
              on={on}
              color={b.label}
              size={i === 0 ? 24 : 21}
              seed={5 + i}
              leader={{ x: X + W + 8, y: y + h / 2 }}
              delay={lead + (i === 0 ? 0.5 : 0.24)}
            />
          </g>
        );
      })}
    </svg>
  );
}

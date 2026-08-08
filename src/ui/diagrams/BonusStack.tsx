"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { V } from "@/ui/vivid";

/**
 * BonusStack — chapter 4, "Keyingi xarid uchun bonuslar". Slot is exactly
 * 1160 × 690 stage pixels.
 *
 * Four bonus plates stack bottom-to-top, one per beat, each landing with a
 * scale pop (1.25 → 1). Two of them — "bepul taʼmir" and "bepul jihozlash" —
 * carry a gold threshold chip whose number comes from
 * `N.vip.freeRenovationFrom` / `N.vip.freeFurnishingFrom`.
 *
 * Step map (VipBonuses, 6 steps)
 *   0 — the empty rack: four dashed ghost plates and the ground rule.
 *   1 — plate 01 lands (bottom).
 *   2 — plate 02.
 *   3 — plate 03.
 *   4 — plate 04 (top). The stack is complete.
 *   5 — the two gold threshold chips pop in on the plates the figures name,
 *       and those plates settle to their gold treatment. No loop — the settled
 *       state is a state, not an animation.
 *
 * Only transform and opacity animate. Shadows and borders are static.
 */

const SLOT_W = 1060;
const SLOT_H = 690;

/** Only four plates fit the stack; the fifth string is carried by the slide. */
const PLATES = 4;

const PLATE_H = 128;
const PITCH = 152;
const BASE_TOP = SLOT_H - PLATE_H - 18; // bottom plate's top edge

/** Left-aligned and widening upward: a staircase, so "more back" reads first.
 *  The top plate plus its chip (28 gap + 108) has to stay inside SLOT_W. */
const WIDTHS = [640, 730, 820, 910] as const;

/**
 * Which plate carries which gold threshold chip. Keyed by the bonus's own index
 * in `S.vip.bonuses.items` — item 01 is "bepul taʼmir", item 02 "bepul
 * jihozlash" — and labelled from the figures, never retyped: change
 * `freeFurnishingFrom` and the chip's number changes with it.
 */
const CHIP_AT = new Map<number, string>([
  [1, `${N.vip.freeRenovationFrom}+`],
  [2, `${N.vip.freeFurnishingFrom}+`],
]);

export function BonusStack({ step }: { step: number }) {
  const lang = useLang();
  const items = S.vip.bonuses.items;
  const marked = step >= 5;

  return (
    <div style={{ position: "relative", width: SLOT_W, height: SLOT_H }}>
      {/* ground */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: SLOT_H - 6,
          width: 940,
          height: 4,
          borderRadius: 4,
          background: "rgba(10,31,20,0.14)",
        }}
      />

      {Array.from({ length: PLATES }, (_, i) => {
        const item = items[i];
        const on = step >= i + 1;
        const w = WIDTHS[i];
        const top = BASE_TOP - i * PITCH;
        const chip = marked ? CHIP_AT.get(i) : undefined;
        const lit = chip !== undefined;

        return (
          <div key={i} style={{ position: "absolute", left: 0, top, width: SLOT_W, height: PLATE_H }}>
            {/* ghost of a plate not yet earned */}
            <motion.div
              initial={false}
              animate={{ opacity: on ? 0 : 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: w,
                height: PLATE_H,
                borderRadius: 26,
                border: "1.5px dashed rgba(10,31,20,0.20)",
              }}
            />

            <motion.div
              initial={false}
              animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 1.25, y: on ? 0 : -18 }}
              transition={{ duration: 0.5, ease: EASE, delay: on ? i * 0.06 : 0 }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: w,
                height: PLATE_H,
                borderRadius: 26,
                transformOrigin: "left center",
                background: lit ? V.gold : V.paper,
                border: `1.5px solid ${lit ? V.gold : "rgba(10,31,20,0.09)"}`,
                boxShadow: "0 18px 46px rgba(10,31,20,0.10)",
                display: "flex",
                alignItems: "center",
                gap: 26,
                padding: "0 32px",
              }}
            >
              <div
                className="tnum font-mono"
                style={{
                  flexShrink: 0,
                  fontSize: 22,
                  letterSpacing: "0.08em",
                  color: lit ? V.ink : V.emerald,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 2,
                  height: 62,
                  borderRadius: 2,
                  background: lit ? "rgba(10,31,20,0.28)" : "rgba(10,31,20,0.10)",
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 600,
                    lineHeight: 1.12,
                    letterSpacing: "-0.012em",
                    color: V.ink,
                  }}
                >
                  {t(item.t, lang)}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 22,
                    fontWeight: 300,
                    lineHeight: 1.3,
                    color: lit ? "rgba(10,31,20,0.62)" : V.ash,
                  }}
                >
                  {t(item.d, lang)}
                </div>
              </div>
            </motion.div>

            {/* threshold chip, popped in beside its own plate */}
            {CHIP_AT.has(i) && (
              <motion.div
                initial={false}
                animate={{ opacity: marked ? 1 : 0, scale: marked ? 1 : 0.6 }}
                transition={{
                  duration: 0.42,
                  ease: EASE,
                  delay: marked ? Array.from(CHIP_AT.keys()).indexOf(i) * 0.12 : 0,
                }}
                className="tnum font-display"
                style={{
                  position: "absolute",
                  left: w + 28,
                  top: (PLATE_H - 84) / 2,
                  width: 108,
                  height: 84,
                  borderRadius: 24,
                  background: V.ink,
                  color: V.gold,
                  fontSize: 40,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {CHIP_AT.get(i)}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

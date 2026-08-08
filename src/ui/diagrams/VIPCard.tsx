"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { V } from "@/ui/vivid";

/**
 * VIPCard — chapter 4, hosted by `VipPerks`. Slot is exactly 1600 × 620 stage
 * pixels; every coordinate below is authored against that box.
 *
 * A flat-vector membership card: night/forest face, gold edge, IMARAT issuer
 * line, and one gold sheen that sweeps across on arrival. The perks then land
 * beside it as bold white rows, one per click.
 *
 * Step map (VipPerks, 6 steps)
 *   0 — the card is here. It flips in on `rotateY` inside a perspective wrapper
 *       (a mount animation, so it plays once per visit and never re-fires when
 *       the presenter steps back into step 0), and a single masked gold sheen
 *       translates across the face. One pass only.
 *   1 — perk 01 lands.
 *   2 — perk 02.
 *   3 — perk 03.
 *   4 — perk 04.
 *   5 — perk 05.
 *
 * Only transform and opacity animate. The sheen is a gradient bar moved by
 * translateX — never a filter. Shadows are static.
 */

const SLOT_W = 1600;
const SLOT_H = 620;

const CARD = { x: 0, y: 78, w: 640, h: 400 } as const;
const RAIL = { x: 720, w: 880 } as const;

const ROW_H = 114;
const ROW_GAP = 12;

/** Frozen keyframe lists: an inline array is a new reference every render and
 *  would restart the sweep on an unrelated re-render. */
const SHEEN_X = [-420, 1020];
const SHEEN_O = [0, 0.5, 0.5, 0];
const SHEEN_T = [0, 0.16, 0.68, 1];

/** The card's contact chip, as flat vector. */
function ChipGlyph() {
  return (
    <svg width={86} height={64} viewBox="0 0 86 64" aria-hidden>
      <rect x={1} y={1} width={84} height={62} rx={12} fill={V.gold} opacity={0.92} />
      <path
        d="M0 22H86M0 42H86M31 0V64M55 0V64"
        stroke={V.night}
        strokeWidth={2}
        opacity={0.42}
      />
    </svg>
  );
}

export function VIPCard({ step }: { step: number }) {
  const lang = useLang();
  const perks = S.vip.perks.items;

  return (
    <div style={{ position: "relative", width: SLOT_W, height: SLOT_H }}>
      {/* ── the card ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          perspective: 1500,
        }}
      >
        <motion.div
          initial={{ rotateY: -74, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{
            rotateY: { duration: 0.95, ease: EASE },
            opacity: { duration: 0.34, ease: EASE },
          }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 34,
            overflow: "hidden",
            background:
              "linear-gradient(138deg, #0A2418 0%, #0B5C3F 54%, #051810 100%)",
            border: `2px solid ${V.gold}`,
            boxShadow:
              "inset 0 0 0 1px rgba(240,178,62,0.30), 0 34px 78px rgba(10,31,20,0.30)",
          }}
        >
          {/* issuer */}
          <div
            className="font-mono"
            style={{
              position: "absolute",
              left: 44,
              top: 42,
              fontSize: 18,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: V.gold,
            }}
          >
            {t(S.brand.company, lang)}
          </div>

          <div style={{ position: "absolute", left: 44, top: 118 }}>
            <ChipGlyph />
          </div>

          <div
            className="font-display"
            style={{
              position: "absolute",
              left: 44,
              top: 226,
              fontSize: 60,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: V.paper,
            }}
          >
            {t(S.chapters.c4.title, lang)}
          </div>

          <div
            style={{
              position: "absolute",
              left: 44,
              top: 316,
              width: 214,
              height: 4,
              borderRadius: 4,
              background: V.gold,
            }}
          />

          <div
            className="font-mono"
            style={{
              position: "absolute",
              left: 44,
              top: 344,
              fontSize: 18,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: V.leaf,
            }}
          >
            {t(S.vip.intro.badge, lang)}
          </div>

          {/* the sheen: a masked gradient bar, moved by translateX alone. The
              tilt lives on a static parent so motion owns the whole transform
              on the animated node and cannot drop the rotation mid-sweep. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: -160,
              width: CARD.w,
              height: CARD.h + 320,
              transform: "rotate(18deg)",
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ x: SHEEN_X[0], opacity: 0 }}
              animate={{ x: SHEEN_X, opacity: SHEEN_O }}
              transition={{ duration: 1.15, delay: 0.72, times: SHEEN_T, ease: "linear" }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 170,
                height: "100%",
                background:
                  "linear-gradient(90deg, rgba(240,178,62,0) 0%, rgba(255,236,196,0.55) 50%, rgba(240,178,62,0) 100%)",
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* ── the perks ────────────────────────────────────────────────────── */}
      {perks.map((p, i) => {
        const on = step >= i + 1;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: on ? 1 : 0, x: on ? 0 : 34, scale: on ? 1 : 0.97 }}
            transition={{ duration: 0.46, ease: EASE, delay: on ? i * 0.06 : 0 }}
            style={{
              position: "absolute",
              left: RAIL.x,
              top: i * (ROW_H + ROW_GAP),
              width: RAIL.w,
              height: ROW_H,
              borderRadius: 22,
              background: V.paper,
              border: "1.5px solid rgba(10,31,20,0.09)",
              boxShadow: "0 16px 40px rgba(10,31,20,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "0 28px",
            }}
          >
            <div
              className="tnum font-mono"
              style={{
                flexShrink: 0,
                width: 50,
                height: 50,
                borderRadius: 14,
                background: V.gold,
                color: V.ink,
                fontSize: 21,
                display: "grid",
                placeItems: "center",
                letterSpacing: "0.02em",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 600,
                  lineHeight: 1.14,
                  letterSpacing: "-0.012em",
                  color: V.ink,
                }}
              >
                {t(p.t, lang)}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 21,
                  fontWeight: 300,
                  lineHeight: 1.3,
                  color: V.ash,
                }}
              >
                {t(p.d, lang)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

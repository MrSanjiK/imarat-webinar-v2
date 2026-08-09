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
 * Landscape membership pass: an ivory left panel carrying the IMARAT mark and
 * the gold "VIP Pass" lockup, split by a diagonal seam from a solid forest
 * right panel holding the five perk rows.
 *
 * The right panel carries perks and nothing else. It used to repeat the
 * project mark above them, which cost 90 px of the card's only 480 and pushed
 * the last two rows into each other; the branding already lives on the ivory
 * half, so the rows now own the whole green field and are centred in it.
 *
 * Step map (VipPerks, 6 steps)
 *   0 — card flips in on rotateY (mount animation, one-shot); gold sheen
 *       sweeps the ivory panel. 1…5 — one perk row each.
 *
 * Only transform and opacity animate. The sheen is a gradient bar moved by
 * translateX — never a filter. Shadows are static.
 */

const SLOT_W = 1600;
const SLOT_H = 620;

const CARD = { x: 20, y: 58, w: 1560, h: 482, r: 34 } as const;
/** Ivory half. The seam is a 92 px diagonal cut starting at this edge. */
const LEFT_W = 496;
const SEAM = 92;

/** Five rows, centred: 5 × ROW_H + 4 × ROW_GAP = 396 in a 482 card. */
const ROW_H = 72;
const ROW_GAP = 9;
const ROWS_TOP = Math.round((CARD.h - (5 * ROW_H + 4 * ROW_GAP)) / 2);
const ROW_X = LEFT_W + 28;

/** Frozen keyframe arrays — inline arrays are new refs every render and would
 *  restart the sweep on any unrelated re-render. */
const SHEEN_X = [-240, 760];
const SHEEN_O = [0, 0.5, 0.5, 0];
const SHEEN_T = [0, 0.14, 0.66, 1];

const ICONS: Record<number, React.ReactNode> = {
  0: (
    // paper plane — the VIP Telegram group
    <g fill="none" stroke={V.gold} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 3 10.5 14.2" />
      <path d="M21 3 14.4 21l-3.9-6.8L3.6 10.3 21 3Z" />
    </g>
  ),
  1: (
    // key — exclusive listings opened only to members
    <g fill="none" stroke={V.gold} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={8} cy={8} r={4.4} />
      <path d="M11.2 11.2 20 20" />
      <path d="M17 17l-2.2 2.2M19.4 14.6l-2.2 2.2" />
    </g>
  ),
  2: (
    // percent — discounts not available in open sale
    <g fill="none" stroke={V.gold} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19 19 5" />
      <circle cx={7.5} cy={7.5} r={2.5} />
      <circle cx={16.5} cy={16.5} r={2.5} />
    </g>
  ),
  3: (
    // ticket — closed events and site visits
    <g fill="none" stroke={V.gold} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8V6h18v2a2.4 2.4 0 0 0 0 4.8V18H3v-5.2A2.4 2.4 0 0 0 3 8Z" />
      <path d="M14 6v1.6M14 11.2v1.6M14 16.4V18" />
    </g>
  ),
  4: (
    // headset — a dedicated manager, no queue
    <g fill="none" stroke={V.gold} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x={2.5} y={13.5} width={4} height={6} rx={1.6} />
      <rect x={17.5} y={13.5} width={4} height={6} rx={1.6} />
      <path d="M19.5 19.5v.5a2.5 2.5 0 0 1-2.5 2.5h-2.5" />
    </g>
  ),
};

export function VIPCard({ step }: { step: number }) {
  const lang = useLang();
  const perks = S.vip.perks.items;

  return (
    <div style={{ position: "relative", width: SLOT_W, height: SLOT_H }}>
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          perspective: 2000,
        }}
      >
        <motion.div
          initial={{ rotateY: -74, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{
            rotateY: { duration: 1.0, ease: EASE },
            opacity: { duration: 0.36, ease: EASE },
          }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: CARD.r,
            overflow: "hidden",
            background: V.paper,
            border: "1px solid rgba(10,31,20,0.08)",
            boxShadow: "0 46px 96px rgba(10,31,20,0.24)",
          }}
        >
          {/* ── right panel: solid forest, cut by a diagonal seam ──────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              left: LEFT_W - SEAM,
              background: V.forest,
              clipPath: `polygon(${SEAM}px 0, 100% 0, 100% 100%, 0 100%)`,
            }}
          >
            {/* gold hairline along the seam */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: SEAM,
                top: 0,
                bottom: 0,
                width: 2,
                background: `linear-gradient(180deg, transparent, ${V.gold}, transparent)`,
                opacity: 0.55,
                transform: "translateX(-1px) skewX(-10.9deg)",
                transformOrigin: "top",
              }}
            />
          </div>

          {/* perk rows — outside the clipped panel so the diagonal cannot eat
              a descender, positioned against the card instead */}
          {perks.map((p, i) => {
            const on = step >= i + 1;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{ opacity: on ? 1 : 0, x: on ? 0 : 30 }}
                transition={{ duration: 0.44, ease: EASE, delay: on ? 0.04 : 0 }}
                style={{
                  position: "absolute",
                  left: ROW_X,
                  right: 56,
                  top: ROWS_TOP + i * (ROW_H + ROW_GAP),
                  height: ROW_H,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                }}
              >
                {/* index — gives the five rows a spine the eye can count */}
                <div
                  className="font-mono tnum"
                  style={{
                    width: 34,
                    flexShrink: 0,
                    fontSize: 15,
                    letterSpacing: "0.1em",
                    color: V.gold,
                    opacity: 0.75,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div
                  aria-hidden
                  style={{
                    width: 46,
                    height: 46,
                    flexShrink: 0,
                    borderRadius: 12,
                    border: `1px solid rgba(240,178,62,0.42)`,
                    background: "rgba(240,178,62,0.09)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg width={23} height={23} viewBox="0 0 24 24">
                    {ICONS[i]}
                  </svg>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 25,
                      fontWeight: 600,
                      color: V.paper,
                      letterSpacing: "-0.012em",
                      lineHeight: 1.1,
                    }}
                  >
                    {t(p.t, lang)}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 17,
                      fontWeight: 300,
                      color: "rgba(244,251,244,0.66)",
                      lineHeight: 1.2,
                    }}
                  >
                    {t(p.d, lang)}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* ── left panel: ivory, IMARAT + VIP Pass ───────────────────────── */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: LEFT_W - SEAM,
              padding: "40px 0 40px 46px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: 13,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: V.ink,
                opacity: 0.8,
                whiteSpace: "nowrap",
              }}
            >
              {t(S.brand.company, lang)}
            </div>

            {/* Two lines, not one: "VIPPass" set inline overran the ivory half
                and was clipped by the seam. Stacked, it also reads as a mark. */}
            <div>
              <div
                className="font-display"
                style={{
                  fontSize: 96,
                  fontWeight: 700,
                  lineHeight: 0.86,
                  letterSpacing: "-0.035em",
                  color: V.gold,
                }}
              >
                VIP
              </div>
              <div
                className="font-display"
                style={{
                  fontSize: 62,
                  fontWeight: 500,
                  fontStyle: "italic",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: V.gold,
                  opacity: 0.92,
                  marginTop: 2,
                }}
              >
                Pass
              </div>
              <div
                style={{ marginTop: 20, width: 118, height: 3, borderRadius: 2, background: V.gold }}
              />
            </div>

            <div>
              <div
                className="font-display"
                style={{ fontSize: 21, fontWeight: 600, color: V.ink, lineHeight: 1.1 }}
              >
                {t(S.brand.project, lang)}
              </div>
              <div
                className="font-mono"
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: V.ash,
                }}
              >
                VIP Club
              </div>
            </div>
          </div>

          {/* Sheen sweep, clipped to the card */}
          <div
            aria-hidden
            style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
          >
            <motion.div
              initial={{ x: SHEEN_X[0], opacity: 0 }}
              animate={{ x: SHEEN_X, opacity: SHEEN_O }}
              transition={{ duration: 1.15, delay: 0.7, times: SHEEN_T, ease: "linear" }}
              style={{
                position: "absolute",
                left: 0,
                top: -90,
                width: 110,
                height: CARD.h + 180,
                transform: "rotate(13deg)",
                background:
                  "linear-gradient(90deg, rgba(240,178,62,0) 0%, rgba(255,236,196,0.5) 50%, rgba(240,178,62,0) 100%)",
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

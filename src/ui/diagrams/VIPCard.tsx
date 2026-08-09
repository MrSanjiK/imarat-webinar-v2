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
 * Landscape membership pass, matching the client's own VIP.png reference:
 * an ivory left panel carrying the IMARAT mark and a gold "VIP Pass" script,
 * split by a diagonal seam from a solid forest-green right panel that holds
 * the Sergeli City VIP Club mark and the five perk rows.
 *
 * Step map (VipPerks, 6 steps)
 *   0 — card flips in on rotateY (mount animation, one-shot). Gold sheen
 *       sweeps across the ivory panel.
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

const CARD = { x: 0, y: 80, w: 1400, h: 460, r: 32 } as const;
const LEFT_W = 440;

const ROW_H = 58;
const ROW_GAP = 9;
const ROWS_TOP = 96;

/** Frozen keyframe arrays — inline arrays are new refs every render and would
 *  restart the sweep on any unrelated re-render. */
const SHEEN_X = [-220, 700];
const SHEEN_O = [0, 0.5, 0.5, 0];
const SHEEN_T = [0, 0.14, 0.66, 1];

const ICONS: Record<number, React.ReactNode> = {
  0: (
    // gift — VIP promos & offers
    <g fill="none" stroke={V.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={9} width={18} height={12} rx={1.5} />
      <path d="M3 13h18" />
      <path d="M12 9v12" />
      <path d="M12 9c-1.2-3-6-3.4-6-1s3.6 1.6 6 1c2.4.6 6 1.4 6-1s-4.8-2-6 1Z" />
    </g>
  ),
  1: (
    // shield — priority service
    <g fill="none" stroke={V.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </g>
  ),
  2: (
    // handshake — trusted partnership
    <g fill="none" stroke={V.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l4-3 3 1.5 3-1.5 4 3" />
      <path d="M7 8v6l3 2.4a1.6 1.6 0 0 0 2.2-.3l.3-.4" />
      <path d="M17 8v6l-3 2.4" />
    </g>
  ),
  3: (
    // diamond — curated projects
    <g fill="none" stroke={V.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12l3 5-9 11L3 9l3-5Z" />
      <path d="M3 9h18M9 4l-1.5 5L12 20l4.5-11L15 4" />
    </g>
  ),
  4: (
    // percent — special discounts
    <g fill="none" stroke={V.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19L19 5" />
      <circle cx={7.5} cy={7.5} r={2.5} />
      <circle cx={16.5} cy={16.5} r={2.5} />
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
          perspective: 1800,
        }}
      >
        <motion.div
          initial={{ rotateY: -76, opacity: 0 }}
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
            boxShadow: "0 44px 90px rgba(10,31,20,0.22)",
          }}
        >
          {/* ── right panel: solid forest, cut by a diagonal seam ──────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              left: LEFT_W - 90,
              background: V.forest,
              clipPath: "polygon(90px 0, 100% 0, 100% 100%, 0 100%)",
            }}
          >
            {/* faint gold hairline along the seam */}
            <div
              style={{
                position: "absolute",
                left: 90,
                top: 0,
                bottom: 0,
                width: 2,
                background: `linear-gradient(180deg, transparent, ${V.gold}, transparent)`,
                opacity: 0.5,
                transform: "translateX(-1px) skewX(-11deg)",
                transformOrigin: "top",
              }}
            />

            {/* Sergeli City mark */}
            <div
              style={{
                position: "absolute",
                left: 78,
                top: 34,
                right: 32,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width={26} height={26} viewBox="0 0 26 26" fill="none">
                <path
                  d="M13 2c5 4 8 8.5 8 13a8 8 0 0 1-16 0c0-4.5 3-9 8-13Z"
                  stroke={V.gold}
                  strokeWidth={1.6}
                />
                <path d="M13 8v14" stroke={V.gold} strokeWidth={1.6} strokeLinecap="round" />
              </svg>
              <div>
                <div
                  className="font-display"
                  style={{ fontSize: 20, fontWeight: 600, color: V.paper, lineHeight: 1.05 }}
                >
                  {t(S.brand.project, lang)}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: V.gold,
                    opacity: 0.85,
                    marginTop: 2,
                  }}
                >
                  VIP Club
                </div>
              </div>
            </div>

            {/* perk rows */}
            <div style={{ position: "absolute", left: 78, top: ROWS_TOP, right: 40 }}>
              {perks.map((p, i) => {
                const on = step >= i + 1;
                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{ opacity: on ? 1 : 0, x: on ? 0 : 26 }}
                    transition={{ duration: 0.42, ease: EASE, delay: on ? i * 0.07 : 0 }}
                    style={{
                      position: "absolute",
                      top: i * (ROW_H + ROW_GAP),
                      left: 0,
                      right: 0,
                      height: ROW_H,
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      borderLeft: `2.5px solid ${V.gold}`,
                      paddingLeft: 18,
                    }}
                  >
                    <div
                      aria-hidden
                      style={{
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <svg width={22} height={22} viewBox="0 0 24 24">
                        {ICONS[i]}
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="font-display"
                        style={{
                          fontSize: 19,
                          fontWeight: 600,
                          color: V.paper,
                          letterSpacing: "-0.01em",
                          lineHeight: 1.15,
                        }}
                      >
                        {t(p.t, lang)}
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 14,
                          fontWeight: 300,
                          color: "rgba(244,251,244,0.62)",
                          lineHeight: 1.25,
                        }}
                      >
                        {t(p.d, lang)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── left panel: ivory, IMARAT + VIP Pass ───────────────────────── */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: LEFT_W,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "36px 0 32px 40px",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: 13,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: V.ink,
                opacity: 0.85,
              }}
            >
              {t(S.brand.company, lang)}
            </div>

            <div>
              <div
                className="font-display"
                style={{
                  fontSize: 88,
                  fontWeight: 700,
                  lineHeight: 0.92,
                  letterSpacing: "-0.03em",
                  color: V.gold,
                }}
              >
                VIP
                <span style={{ fontStyle: "italic", fontWeight: 500 }}>Pass</span>
              </div>
              <div
                style={{
                  marginTop: 22,
                  width: 130,
                  height: 3,
                  borderRadius: 2,
                  background: V.gold,
                }}
              />
              <div
                className="font-mono"
                style={{
                  marginTop: 18,
                  fontSize: 14,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: V.ash,
                }}
              >
                Exclusive Member
              </div>
            </div>

            <div style={{ height: 1 }} />

            {/* Sheen sweep, clipped to the ivory panel */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <motion.div
                initial={{ x: SHEEN_X[0], opacity: 0 }}
                animate={{ x: SHEEN_X, opacity: SHEEN_O }}
                transition={{ duration: 1.1, delay: 0.7, times: SHEEN_T, ease: "linear" }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: -80,
                  width: 100,
                  height: CARD.h + 160,
                  transform: "rotate(14deg)",
                  background:
                    "linear-gradient(90deg, rgba(240,178,62,0) 0%, rgba(255,236,196,0.55) 50%, rgba(240,178,62,0) 100%)",
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

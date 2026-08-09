"use client";

import { motion } from "motion/react";
import { EASE } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { V } from "@/ui/vivid";

/**
 * InfraMap — v2 "IMARAT Vivid". A bold flat-vector locality plate: Sergeli City
 * is one solid emerald block in the middle, and the four things being built
 * around it are numbered discs on the ends of drawn routes.
 *
 * Step map (the slide passes its own `step` straight through, 0–4):
 *   0 — the Sergeli City node lands.
 *   1 — the four POI discs drop in, staggered, with a 1.25 → 1 scale pop.
 *   2 — the routes draw out of the node (pathLength), emerald, round caps.
 *   3 — the name plates settle under each disc with their proximity chip.
 *   4 — focus beat: the airport route and disc go gold, the rest sit back.
 *
 * On the missing numbers: the client supplied no kilometres and no drive times
 * for any of the four, so there is nothing here to count up. The map states
 * adjacency and quotes the qualitative descriptors verbatim out of
 * `S.city.infra.pins[i].d` — inventing "12 km" for the stage would be the one
 * unrecoverable mistake this slide could make.
 *
 * Pure function of `step`: every `on` below is a monotonic comparison, so
 * arriving at 4 backwards renders exactly what arriving forwards renders. Only
 * transform / opacity / pathLength animate.
 */

// ── geometry, in the 1000 × 620 viewBox ──────────────────────────────────────

const HUB = { x: 280, y: 240, w: 300, h: 140, r: 30 } as const;
const HUB_C = { x: HUB.x + HUB.w / 2, y: HUB.y + HUB.h / 2 } as const;

type Poi = {
  /** Disc centre. */
  at: readonly [number, number];
  /** Route: start on the node's edge, one control point, end short of the disc. */
  route: readonly [number, number, number, number, number, number];
  icon: "plane" | "metro" | "road" | "park";
};

/**
 * Routes start *inside* the node — routes paint before the node does, so the
 * block covers the stub and each line appears to leave its rounded edge. Each
 * control point is chosen so the curve clears the destination's own name plate:
 * the plate hangs below the disc, which on the left-hand pins is exactly where
 * an unconsidered route would run.
 */
const POIS: readonly Poi[] = [
  // 01 · airport — upper right, the longest reach and the focus beat's subject
  { at: [840, 180], route: [540, 255, 690, 195, 793, 185], icon: "plane" },
  // 02 · metro — lower right
  { at: [830, 440], route: [540, 365, 690, 425, 783, 435], icon: "metro" },
  // 03 · highway — upper left
  { at: [150, 150], route: [340, 255, 250, 170, 195, 158], icon: "road" },
  // 04 · eco park — lower left, the existing neighbour
  { at: [160, 436], route: [340, 365, 250, 410, 204, 423], icon: "park" },
];

const DISC_R = 42;
const PLATE_W = 268;
const PLATE_H = 104;

const curve = (r: Poi["route"]) => `M ${r[0]} ${r[1]} Q ${r[2]} ${r[3]} ${r[4]} ${r[5]}`;

// ── icons, drawn around a local 0,0 so the disc's scale pop stays centred ────

function Icon({ kind }: { kind: Poi["icon"] }) {
  const s = { fill: "none", stroke: V.paper, strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "plane":
      return (
        <g fill="none" stroke={V.paper} strokeLinecap="round" strokeLinejoin="round">
          {/* Fuselage — nose up */}
          <path d="M 0 -17 C 4 -11 4 -1 3 7 L 0 16 L -3 7 C -4 -1 -4 -11 0 -17" strokeWidth={2.2} />
          {/* Left main wing */}
          <path d="M -3 0 L -20 9 L -18 13 L -3 6" strokeWidth={2} />
          {/* Right main wing */}
          <path d="M 3 0 L 20 9 L 18 13 L 3 6" strokeWidth={2} />
          {/* Left tail stabiliser */}
          <path d="M -3 10 L -11 17 L -3 17" strokeWidth={1.8} />
          {/* Right tail stabiliser */}
          <path d="M 3 10 L 11 17 L 3 17" strokeWidth={1.8} />
        </g>
      );
    case "metro":
      return (
        <g {...s}>
          <rect x={-11} y={-14} width={22} height={20} rx={6} />
          <path d="M -11 -4 L 11 -4 M -8 12 L -4 6 M 8 12 L 4 6" />
          <circle cx={-5.5} cy={1} r={0.9} fill={V.paper} stroke="none" />
          <circle cx={5.5} cy={1} r={0.9} fill={V.paper} stroke="none" />
        </g>
      );
    case "road":
      return (
        <g {...s}>
          <path d="M -13 14 L -5 -14 M 13 14 L 5 -14" />
          <path d="M 0 -12 L 0 -5 M 0 -1 L 0 6 M 0 10 L 0 14" strokeWidth={3} />
        </g>
      );
    case "park":
      return (
        <g {...s}>
          <path d="M 0 -14 L 11 4 L -11 4 Z" />
          <path d="M 0 4 L 0 14" strokeWidth={3} />
        </g>
      );
  }
}

// ── the plate ────────────────────────────────────────────────────────────────

export function InfraMap({ step }: { step: number }) {
  const lang = useLang();
  const pins = S.city.infra.pins;

  const focus = step >= 4;

  return (
    <svg viewBox="0 0 1000 620" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* ── routes: drawn out of the node, then a gold overlay for the focus ──*/}
      {POIS.map((p, i) => (
        <g key={`route-${i}`}>
          <motion.path
            d={curve(p.route)}
            fill="none"
            stroke={V.emerald}
            strokeWidth={5}
            strokeLinecap="round"
            initial={false}
            animate={{
              pathLength: step >= 2 ? 1 : 0,
              opacity: step < 2 ? 0 : focus && i !== 0 ? 0.26 : 1,
            }}
            transition={{ duration: 0.62, ease: EASE, delay: step >= 2 ? i * 0.09 : 0 }}
          />
          {i === 0 && (
            // A second path rather than a stroke tween: paint properties are not
            // compositor-safe, pathLength is.
            <motion.path
              d={curve(p.route)}
              fill="none"
              stroke={V.gold}
              strokeWidth={6}
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: focus ? 1 : 0, opacity: focus ? 1 : 0 }}
              transition={{ duration: 0.66, ease: EASE }}
            />
          )}
        </g>
      ))}

      {/* ── the node ─────────────────────────────────────────────────────────*/}
      <g transform={`translate(${HUB_C.x} ${HUB_C.y})`}>
        <motion.g
          initial={false}
          animate={{ scale: step >= 0 ? 1 : 0.82, opacity: step >= 0 ? 1 : 0 }}
          transition={{ duration: 0.62, ease: EASE, delay: 0.16 }}
        >
          <rect
            x={-HUB.w / 2}
            y={-HUB.h / 2}
            width={HUB.w}
            height={HUB.h}
            rx={HUB.r}
            fill={V.emerald}
          />
          <rect
            x={-HUB.w / 2 + 9}
            y={-HUB.h / 2 + 9}
            width={HUB.w - 18}
            height={HUB.h - 18}
            rx={HUB.r - 9}
            fill="none"
            stroke="rgba(255,255,255,0.34)"
            strokeWidth={1.8}
          />
          {/* 31 px, not the display scale's 34: `Сергели Сити` sets ~11%
              wider than `Sergeli City` and `<text>` cannot wrap, so the
              Cyrillic form is what sizes this. */}
          <text
            y={-4}
            textAnchor="middle"
            fill={V.paper}
            className="font-display"
            fontSize={31}
            fontWeight={600}
            letterSpacing="-0.01em"
          >
            {t(S.brand.project, lang)}
          </text>
          <rect x={-28} y={18} width={56} height={4} rx={2} fill={V.lime} />
        </motion.g>
      </g>

      {/* ── discs ────────────────────────────────────────────────────────────*/}
      {POIS.map((p, i) => {
        const on = step >= 1;
        const dim = focus && i !== 0;
        return (
          <g key={`poi-${i}`} transform={`translate(${p.at[0]} ${p.at[1]})`}>
            <motion.g
              initial={false}
              animate={{
                scale: on ? 1 : 1.25,
                opacity: on ? (dim ? 0.34 : 1) : 0,
              }}
              transition={{ duration: 0.44, ease: EASE, delay: on && step === 1 ? i * 0.08 : 0 }}
            >
              {/* Static shadow, pre-drawn as a solid disc — never a filter. */}
              <circle cx={0} cy={7} r={DISC_R} fill="rgba(10,31,20,0.10)" />
              <circle r={DISC_R} fill={i === 0 && focus ? V.gold : V.forest} />
              <Icon kind={p.icon} />
              {/* index tab, so the disc keys to the numbered list on the slide */}
              <g transform={`translate(${DISC_R - 10} ${-DISC_R + 4})`}>
                <circle r={17} fill={V.lime} />
                <text
                  y={6}
                  textAnchor="middle"
                  className="tnum font-mono"
                  fontSize={17}
                  fill={V.ink}
                >
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            </motion.g>

            {/* focus ring — scale only, drawn on top of everything */}
            {i === 0 && (
              <motion.circle
                r={DISC_R + 16}
                fill="none"
                stroke={V.gold}
                strokeWidth={3}
                initial={false}
                animate={{ scale: focus ? 1 : 0.72, opacity: focus ? 0.85 : 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: focus ? 0.14 : 0 }}
              />
            )}

            {/* ── name plate ─────────────────────────────────────────────────*/}
            <motion.g
              initial={false}
              animate={{
                opacity: step >= 3 ? (dim ? 0.4 : 1) : 0,
                y: step >= 3 ? 0 : 12,
              }}
              transition={{ duration: 0.44, ease: EASE, delay: step === 3 ? i * 0.07 : 0 }}
            >
              <foreignObject
                x={-PLATE_W / 2}
                y={DISC_R + 16}
                width={PLATE_W}
                height={PLATE_H}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 22,
                    lineHeight: 1.24,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    color: V.ink,
                  }}
                >
                  {t(pins[i].t, lang)}
                  <div
                    className="font-mono"
                    style={{
                      marginTop: 9,
                      fontSize: 16,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: i === 0 ? V.gold : V.emerald,
                    }}
                  >
                    {t(pins[i].d, lang)}
                  </div>
                </div>
              </foreignObject>
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}

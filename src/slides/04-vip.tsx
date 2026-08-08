"use client";

import { motion } from "motion/react";
import { EASE, type SlideProps } from "@/deck/types";
import { Reveal } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { At, Chip, Kicker, Lead, M, Rule, Slide, Title } from "@/ui/layout";
import { CountUp, Glow, Mesh, V } from "@/ui/vivid";
import { BonusStack } from "@/ui/diagrams/BonusStack";
import { FivePlusOne } from "@/ui/diagrams/FivePlusOne";
import { VIPCard } from "@/ui/diagrams/VIPCard";
import { FestiveParticles } from "@/ui/FestiveParticles";
import { ChapterOpener } from "./common";

/**
 * Chapter 4 — the investors' club.
 *
 * Gold is this chapter's accent and appears almost nowhere else in the deck:
 * here it has to mean "money back on the table", not decoration. Emerald does
 * the structural work (paid, earned, drawn), gold marks the reward. Nothing
 * fails in this chapter, so ember never appears.
 */

// ── 4.0 opener ───────────────────────────────────────────────────────────────

export function VipOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={4}
      step={step}
      title={S.chapters.c4.title}
      lead={S.chapters.c4.lead}
      image="/media/vip-banner.png"
    />
  );
}

// ── 4.1 what the club is ─────────────────────────────────────────────────────

/**
 * Steps
 *   0 — masthead chips and the headline, over the gold medallion.
 *   1 — the statement, at lead size. The whole slide is three lines of type.
 */
export function VipIntro({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.intro;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={1700} y={250} r={520} color="240,178,62" opacity={0.24} />

      {/* The one oversized element: a gold medallion, cropped by the top-right
          corner. Pure geometry — it says nothing the headline already says, and
          it is present at every step, so it never animates at all. */}
      <svg
        width={900}
        height={900}
        viewBox="0 0 900 900"
        style={{ position: "absolute", left: 1310, top: -200, pointerEvents: "none" }}
        aria-hidden
      >
        <circle cx={450} cy={450} r={300} fill={V.gold} />
        <circle cx={450} cy={450} r={386} fill="none" stroke={V.emerald} strokeWidth={4} />
        <circle cx={450} cy={450} r={444} fill="none" stroke={V.leaf} strokeWidth={2} opacity={0.5} />
        <circle cx={214} cy={706} r={26} fill={V.emerald} />
      </svg>

      <At x={M.left} y={200} w={1100}>
        <Reveal at={0} step={step} y={16}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Chip filled size={20}>
              {t(S.brand.project, lang)}
            </Chip>
            <Chip color={V.gold} size={20}>
              {t(S.chapters.c4.title, lang)}
            </Chip>
            <Chip color={V.ink} size={20}>
              {t(v.badge, lang)}
            </Chip>
          </div>
        </Reveal>

        {/* 1060 keeps the longest line clear of the medallion's outer ring,
            which reaches x 1317 at this block's top edge. */}
        <Reveal at={0} step={step} y={26} delay={0.08} style={{ marginTop: 40 }}>
          <Title size={88} style={{ maxWidth: 1060, letterSpacing: "-0.025em" }}>
            {t(v.title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.22} style={{ marginTop: 36 }}>
          <Rule w={196} color={V.gold} thickness={5} delay={0.28} />
        </Reveal>
      </At>

      <At x={M.left} y={618} w={1240}>
        <Reveal at={1} step={step} y={22}>
          <div style={{ display: "flex", gap: 30 }}>
            <div
              style={{
                flexShrink: 0,
                width: 5,
                borderRadius: 5,
                background: V.gold,
              }}
            />
            <Lead size={50} color={V.ink} style={{ maxWidth: 1160, lineHeight: 1.3 }}>
              {t(v.body, lang)}
            </Lead>
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 4.2 what membership buys ─────────────────────────────────────────────────

/**
 * Steps
 *   0 — headline; the card flips in beside it.
 *   1–5 — one perk row per click. Choreography lives in `VIPCard`.
 */
export function VipPerks({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.perks;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={430} y={620} r={470} color="240,178,62" opacity={0.16} />

      <At x={M.left} y={132} w={1200}>
        <Reveal at={0} step={step} y={20}>
          <Title size={56} style={{ letterSpacing: "-0.02em" }}>
            {t(v.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 22 }}>
          <Rule w={132} color={V.gold} thickness={4} delay={0.18} />
        </Reveal>
      </At>

      <At x={M.left} y={280}>
        <VIPCard step={step} />
      </At>
    </Slide>
  );
}

// ── 4.3 the one condition ────────────────────────────────────────────────────

/**
 * Steps
 *   0 — the rule, set as the headline.
 *   1 — the gold plaque: one contract a year, counted up.
 *   2 — the plain-language restatement.
 */
export function VipCondition({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.condition;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={1460} y={520} r={480} color="240,178,62" opacity={0.2} />

      <At x={M.left} y={300} w={940}>
        <Reveal at={0} step={step} y={26}>
          <Title size={62} style={{ maxWidth: 920, letterSpacing: "-0.02em" }}>
            {t(v.rule, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 34 }}>
          <Rule w={164} color={V.gold} thickness={5} delay={0.26} />
        </Reveal>
        <Reveal at={2} step={step} style={{ marginTop: 38 }}>
          <Lead size={31} style={{ maxWidth: 860 }}>
            {t(v.body, lang)}
          </Lead>
        </Reveal>
      </At>

      {/* The oversized element: a gold plaque carrying the only figure the
          condition has. `scale` is on a motion node, not `Reveal`, so the
          number lands with weight rather than merely fading. */}
      <motion.div
        initial={false}
        animate={{
          opacity: step >= 1 ? 1 : 0,
          scale: step >= 1 ? 1 : 0.9,
          y: step >= 1 ? 0 : 16,
        }}
        transition={{ duration: 0.52, ease: EASE }}
        style={{
          position: "absolute",
          left: 1160,
          top: 282,
          width: 600,
          height: 476,
          borderRadius: 44,
          background: V.gold,
          boxShadow: "0 34px 82px rgba(10,31,20,0.18)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="tnum font-display"
            style={{
              fontSize: 264,
              lineHeight: 0.9,
              fontWeight: 700,
              letterSpacing: "-0.06em",
              color: V.ink,
            }}
          >
            <CountUp to={N.vip.minContractsPerYear} on={step >= 1} duration={0.7} delay={0.18} />
          </div>
          <div
            className="font-mono"
            style={{
              marginTop: 28,
              fontSize: 22,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(10,31,20,0.68)",
            }}
          >
            {t(v.title, lang)}
          </div>
        </div>
      </motion.div>
    </Slide>
  );
}

// ── 4.4 what the next purchase is worth ──────────────────────────────────────

/**
 * Steps
 *   0 — headline.
 *   1–5 — one bonus plate per click, bottom to top.
 *   6 — the two gold thresholds light. Choreography lives in `BonusStack`.
 */
export function VipBonuses({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.bonuses;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={300} y={760} r={430} color="0,168,104" opacity={0.14} />
      <FestiveParticles on={step >= 6} />

      <At x={M.left} y={252} w={440}>
        <Reveal at={0} step={step} y={22}>
          <Title size={52} style={{ maxWidth: 430, letterSpacing: "-0.02em" }}>
            {t(v.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 30 }}>
          <Rule w={128} color={V.gold} thickness={4} delay={0.18} />
        </Reveal>
      </At>

      <At x={680} y={210}>
        <BonusStack step={step} />
      </At>
    </Slide>
  );
}

// ── 4.5 the 5+1 offer ────────────────────────────────────────────────────────

/**
 * Steps
 *   0 — headline and the empty apparatus.
 *   1 — the five paid apartments draw on.
 *   2 — the linked dial locks to the first rung.
 *   3 — the second rung; the sixth apartment turns gold.
 *   Choreography lives in `FivePlusOne`.
 */
export function VipFivePlusOne({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.fivePlusOne;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={1220} y={560} r={520} color="240,178,62" opacity={0.16} />
      <FestiveParticles on={step >= 3} />

      <At x={M.left} y={252} w={470}>
        <Reveal at={0} step={step} y={16}>
          <Kicker color={V.gold} size={22}>
            {`${N.vip.bundleSize} + ${N.vip.bundleBonusIndex - N.vip.bundleSize}`}
          </Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={24} delay={0.06} style={{ marginTop: 22 }}>
          <Title size={64} style={{ maxWidth: 460, letterSpacing: "-0.025em" }}>
            {t(v.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 28 }}>
          <Rule w={128} color={V.gold} thickness={4} delay={0.26} />
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 36 }}>
          <Lead size={29} style={{ maxWidth: 450 }}>
            {t(v.body, lang)}
          </Lead>
        </Reveal>
      </At>

      <At x={700} y={250}>
        <FivePlusOne step={step} />
      </At>
    </Slide>
  );
}

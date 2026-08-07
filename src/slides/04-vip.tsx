"use client";

import { STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal, Stagger } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { At, Body, Caption, Chip, Item, Kicker, M, Rule, Slide, Title } from "@/ui/layout";
import { C, SketchLine } from "@/ui/sketch";
import { BonusStack } from "@/ui/diagrams/BonusStack";
import { FivePlusOne } from "@/ui/diagrams/FivePlusOne";
import { VIPCard } from "@/ui/diagrams/VIPCard";
import { ChapterOpener } from "./common";

/** Chapter 4 — the investors' club. Gold is the accent here and nowhere else
 *  except the offer: it has to mean "money on the table", not "decoration". */

export function VipOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={4}
      step={step}
      title={S.chapters.c4.title}
      lead={S.chapters.c4.lead}
      image="/media/banners/banner-07.webp"
    />
  );
}

export function VipIntro({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.intro;

  return (
    <Slide grid={false}>
      {/* Two blocks, both short, so the pair has to be centred in the safe area
          rather than hung from its top — otherwise the lower third of the slide
          is dead and the card reads as having slipped upward. */}
      <At x={M.left} y={M.top + 176} w={720}>
        <Reveal at={0} step={step} y={16}>
          <Chip color={C.gold} size={20}>
            {t(v.badge, lang)}
          </Chip>
        </Reveal>
        <Reveal at={0} step={step} y={24} delay={0.08} style={{ marginTop: 32 }}>
          <Title size={92}>{t(v.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 34 }}>
          <Rule w={180} color={C.gold} thickness={3} delay={0.26} />
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 34 }}>
          <Body size={32}>{t(v.body, lang)}</Body>
        </Reveal>
      </At>

      <At x={1000} y={312} w={760}>
        <div style={{ height: 470 }}>
          <VIPCard step={step} />
        </div>
      </At>
    </Slide>
  );
}

export function VipPerks({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.perks;

  return (
    <Slide>
      <At x={M.left} y={M.top + 40} w={540}>
        <Reveal at={0} step={step} y={20}>
          <Title size={70}>{t(v.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 28 }}>
          <Rule w={120} color={C.gold} delay={0.18} />
        </Reveal>
      </At>

      {/* Opened up to reach the foot of the divider: at a 40 px gap the five
          items stopped two-thirds of the way down and the rule carried on into
          nothing. */}
      <At x={820} y={M.top + 30} w={940}>
        <div style={{ display: "grid", gap: 76 }}>
          {v.items.map((p, i) => (
            <Reveal key={i} at={i + 1} step={step} y={18} x={12}>
              <Item n={i + 1} title={p.t} detail={p.d} color={C.gold} titleSize={36} />
            </Reveal>
          ))}
        </div>
      </At>

      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchLine
          x1={742}
          y1={M.top + 20}
          x2={742}
          y2={M.bottom - 40}
          seed={19}
          amp={1.5}
          on={step >= 1}
          stroke="rgba(43,42,40,0.18)"
          width={1.5}
          duration={0.8}
        />
      </svg>
    </Slide>
  );
}

export function VipCondition({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.condition;

  return (
    <Slide grid={false}>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ maxWidth: 1400, textAlign: "center", paddingBottom: 60 }}>
          <Reveal at={0} step={step} y={14}>
            <Kicker color={C.gold} style={{ textAlign: "center" }}>
              {t(v.title, lang)}
            </Kicker>
          </Reveal>

          <Reveal at={1} step={step} y={24} style={{ marginTop: 42 }}>
            <div
              style={{
                display: "inline-block",
                border: `2.5px solid ${C.gold}`,
                borderRadius: 16,
                padding: "50px 76px",
              }}
            >
              <Title size={72} align="center" style={{ maxWidth: 1080 }}>
                {t(v.rule, lang)}
              </Title>
            </div>
          </Reveal>

          <Reveal at={2} step={step} style={{ marginTop: 48 }}>
            <Body size={30} align="center" style={{ maxWidth: 900, margin: "0 auto" }}>
              {t(v.body, lang)}
            </Body>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}

export function VipBonuses({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.bonuses;

  return (
    <Slide>
      <At x={M.left} y={M.top + 40} w={560}>
        <Reveal at={0} step={step} y={20}>
          <Title size={70}>{t(v.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 28 }}>
          <Rule w={120} color={C.gold} delay={0.18} />
        </Reveal>
      </At>

      {/* Step 5 lights the 1+ / 2+ chips on the tiers they belong to. A margin
          note restating the same two thresholds arrived on that very step and
          said less than the list item sitting 40 px under the drawing. */}
      <At x={820} y={168} w={940}>
        <div style={{ height: 300 }}>
          <BonusStack step={step} />
        </div>
      </At>

      <At x={820} y={512} w={940}>
        <div style={{ display: "grid", gap: 26 }}>
          {v.items.map((p, i) => (
            <Stagger key={i} at={1} step={step} i={i} y={14} gap={0.09}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    background: C.gold,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 30, fontWeight: 400, color: C.ink }}>
                  {t(p.t, lang)}
                  <span style={{ color: C.ash, fontWeight: 300 }}> — {t(p.d, lang)}</span>
                </div>
              </div>
            </Stagger>
          ))}
        </div>
      </At>
    </Slide>
  );
}

export function VipFivePlusOne({ step }: SlideProps) {
  const lang = useLang();
  const v = S.vip.fivePlusOne;

  return (
    <Slide grid={false}>
      <At x={M.left} y={M.top + 20} w={620}>
        <Reveal at={0} step={step} y={18}>
          <Kicker color={C.gold}>{`${N.vip.bundleSize} + 1`}</Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={22} delay={0.06} style={{ marginTop: 20 }}>
          <Title size={82}>{t(v.title, lang)}</Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 30 }}>
          <Body>{t(v.body, lang)}</Body>
        </Reveal>

        <div style={{ marginTop: 52, display: "grid", gap: 24 }}>
          <Reveal at={2} step={step} y={14}>
            <RuleLine text={t(v.rule50, lang)} />
          </Reveal>
          <Reveal at={3} step={step} y={14}>
            <RuleLine text={t(v.rule100, lang)} accent />
          </Reveal>
        </div>
      </At>

      <At x={880} y={168} w={880}>
        <div style={{ height: 700 }}>
          <FivePlusOne step={step} />
        </div>
      </At>

      {/*
        These three name the three things in the lower band of the drawing, so
        they have to sit under them rather than merely near them. The diagram's
        slot is 1:1 with the stage (880 × 700 viewBox in an 880 × 700 box), so
        its paid gauge, discount gauge and gift are at stage x 1108 / 1332 /
        1556 — evenly pitched 224 apart. Three 224-wide columns starting at
        1108 − 112 put each caption dead centre under its own element; a
        centred flex row landed them +77 / −16 / −89 off, which is close enough
        to look like a miss rather than a decision.
      */}
      <At x={996} y={794} w={672}>
        <Reveal at={3} step={step} delay={0.2}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            <Caption align="center">{t(v.dialPaid, lang)}</Caption>
            <Caption align="center" color={C.gold}>
              {t(v.dialDiscount, lang)}
            </Caption>
            <Caption align="center" color={C.forest}>
              {t(v.giftLabel, lang)}
            </Caption>
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

function RuleLine({ text, accent = false }: { text: string; accent?: boolean }) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${accent ? C.gold : "rgba(43,42,40,0.2)"}`,
        paddingLeft: 22,
        fontSize: 28,
        lineHeight: 1.4,
        fontWeight: accent ? 400 : 300,
        color: accent ? C.ink : C.ink,
      }}
    >
      {text}
    </div>
  );
}

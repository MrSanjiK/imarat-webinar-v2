"use client";

import { type SlideProps } from "@/deck/types";
import { Reveal } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { At, Body, Caption, Kicker, M, Rule, Slide, Title } from "@/ui/layout";
import { Card, Glow, Mesh, Rise, V } from "@/ui/vivid";
import { EscrowFlow } from "@/ui/diagrams/EscrowFlow";
import { ChapterOpener } from "./common";

/**
 * Chapter 2 — escrow. The only chapter with no photography past its opener:
 * escrow is a mechanism, and a mechanism is explained by a drawing. So the
 * whole chapter is built around giving `EscrowFlow` the stage and keeping the
 * words down to a title and one swapping line of commentary.
 */

export function EscrowOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={2}
      step={step}
      title={S.chapters.c2.title}
      lead={S.chapters.c2.lead}
      image="/media/renders/render-004.webp"
    />
  );
}

/**
 * step 0 — title, definition, and the cast of the drawing.
 * step 1 — money runs straight to the builder.
 * step 2 — the site freezes; the commentary turns ember.
 * step 3 — escrow: the vault holds it, checkpoints release it.
 */
export function EscrowWhat({ step }: SlideProps) {
  const lang = useLang();
  const e = S.escrow.what;

  return (
    <Slide theme="paper" grid={false}>
      <Mesh variant="paper" />
      <Glow x={1560} y={880} r={420} color="0,168,104" opacity={0.13} />
      <Glow x={300} y={140} r={340} color="201,241,106" opacity={0.16} />

      {/* The headline owns the top-left; everything else is the drawing. */}
      <At x={M.left} y={126} w={820} z={2}>
        <Reveal at={0} step={step} y={20}>
          <Title size={60} style={{ letterSpacing: "-0.025em" }}>
            {t(e.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 24 }}>
          <Rule w={168} color={V.gold} thickness={4} delay={0.2} />
        </Reveal>
      </At>

      {/* One line of commentary, swapped by the build rather than stacked. */}
      <At x={1096} y={120} w={664} z={2} style={{ height: 150 }}>
        <Reveal at={0} step={step} until={1} delay={0.2}>
          <Body size={26} style={{ maxWidth: 640 }}>
            {t(e.body, lang)}
          </Body>
        </Reveal>

        <Reveal
          at={2}
          step={step}
          until={2}
          y={16}
          style={{ position: "absolute", top: 0, left: 0, width: 664 }}
        >
          <Kicker color={V.ember} size={18}>
            {t(e.beforeLabel, lang)}
          </Kicker>
          <Title size={36} color={V.ember} style={{ marginTop: 16, maxWidth: 640, letterSpacing: "-0.02em" }}>
            {t(e.beforeSteps[2], lang)}
          </Title>
        </Reveal>

        <Reveal
          at={3}
          step={step}
          y={16}
          style={{ position: "absolute", top: 0, left: 0, width: 664 }}
        >
          <Kicker color={V.emerald} size={18}>
            {t(e.afterLabel, lang)}
          </Kicker>
          <Title size={36} color={V.emerald} style={{ marginTop: 16, maxWidth: 640, letterSpacing: "-0.02em" }}>
            {t(e.afterSteps[2], lang)}
          </Title>
        </Reveal>
      </At>

      {/* The oversized element: the drawing, given the whole lower stage. */}
      <At x={M.left} y={288} w={1600} style={{ height: 652 }}>
        <EscrowFlow step={step} />
      </At>
    </Slide>
  );
}

const IMPACT_ACCENT = [V.emerald, V.gold, V.forest, V.emerald];

/**
 * step 0 — the claim.
 * steps 1–4 — one consequence per click, as four flat cards.
 */
export function EscrowImpact({ step }: SlideProps) {
  const lang = useLang();
  const e = S.escrow.impact;

  const cardW = 372;
  const gap = 37;

  return (
    <Slide theme="paper" grid={false}>
      <Mesh variant="paper" />
      <Glow x={1660} y={200} r={420} color="0,168,104" opacity={0.15} />
      <Glow x={180} y={900} r={380} color="240,178,62" opacity={0.1} />

      <At x={M.left} y={126} w={1080} z={2}>
        <Rise on={step >= 0} duration={0.68}>
          <Title size={78} style={{ maxWidth: 1020, letterSpacing: "-0.03em" }}>
            {t(e.title, lang)}
          </Title>
        </Rise>
        <Reveal at={0} step={step} delay={0.18} style={{ marginTop: 30 }}>
          <Rule w={188} color={V.emerald} thickness={4} delay={0.24} />
        </Reveal>
      </At>

      <At x={1300} y={140} w={460} z={2}>
        <Reveal at={0} step={step} delay={0.26}>
          <Body size={26} style={{ maxWidth: 440 }}>
            {t(e.body, lang)}
          </Body>
        </Reveal>
      </At>

      {/* Four consequences, one per click. The numeral is the loud element. */}
      {e.points.map((p, i) => {
        const accent = IMPACT_ACCENT[i];
        return (
          <Reveal
            key={i}
            at={i + 1}
            step={step}
            y={30}
            delay={0.04}
            style={{
              position: "absolute",
              left: M.left + i * (cardW + gap),
              top: 452,
              width: cardW,
            }}
          >
            <Card w={cardW} h={452} radius={30}>
              {/* Oversized ghost numeral, cropped by the card's own corner. */}
              <div
                className="tnum font-display"
                style={{
                  position: "absolute",
                  right: 18,
                  bottom: -34,
                  fontSize: 150,
                  lineHeight: 0.8,
                  fontWeight: 700,
                  letterSpacing: "-0.06em",
                  color: accent,
                  opacity: 0.1,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              <div style={{ position: "absolute", left: 36, top: 38, width: cardW - 72 }}>
                <Kicker color={accent} size={19}>
                  {String(i + 1).padStart(2, "0")}
                </Kicker>
                <div style={{ marginTop: 20 }}>
                  <Rule w={54} color={accent} thickness={4} on={step >= i + 1} delay={0.24} />
                </div>
                <Title size={35} style={{ marginTop: 30, letterSpacing: "-0.02em", lineHeight: 1.16 }}>
                  {t(p.t, lang)}
                </Title>
              </div>

              <div style={{ position: "absolute", left: 36, bottom: 38, width: cardW - 72 }}>
                <Caption size={23} style={{ lineHeight: 1.42 }}>
                  {t(p.d, lang)}
                </Caption>
              </div>
            </Card>
          </Reveal>
        );
      })}
    </Slide>
  );
}

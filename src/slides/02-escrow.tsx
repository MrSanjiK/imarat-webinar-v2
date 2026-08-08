"use client";

import { STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal, Stagger } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { At, Body, Caption, Item, Kicker, M, Rule, Slide, Title } from "@/ui/layout";
import { C, SketchLine } from "@/ui/sketch";
import { EscrowFlow } from "@/ui/diagrams/EscrowFlow";
import { ChapterOpener } from "./common";

/** Chapter 2 — escrow. The only chapter with no photography at all: it is a
 *  mechanism, and a diagram explains a mechanism better than a stock image. */

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

export function EscrowWhat({ step }: SlideProps) {
  const lang = useLang();
  const e = S.escrow.what;

  return (
    <Slide>
      <At x={M.left} y={M.top} w={1180}>
        <Reveal at={0} step={step} y={18}>
          <Title size={72}>{t(e.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.1} style={{ marginTop: 24 }}>
          <Body size={29} style={{ maxWidth: 1120 }}>
            {t(e.body, lang)}
          </Body>
        </Reveal>
      </At>

      <At x={M.left} y={380} w={1600}>
        <div style={{ height: 340 }}>
          <EscrowFlow step={step} />
        </div>
      </At>

      {/* Before / after, side by side. The contrast is the whole argument. */}
      <At x={M.left} y={758} w={740}>
        <Reveal at={2} step={step} y={18}>
          <Kicker color={C.ash}>{t(e.beforeLabel, lang)}</Kicker>
          <div style={{ marginTop: 18, display: "grid", gap: 11 }}>
            {e.beforeSteps.map((s, i) => (
              <Stagger key={i} at={2} step={step} i={i} y={10}>
                <Caption size={25} color="rgba(43,42,40,0.62)">
                  {t(s, lang)}
                </Caption>
              </Stagger>
            ))}
          </div>
        </Reveal>
      </At>

      <At x={1020} y={758} w={740}>
        <Reveal at={3} step={step} y={18}>
          <Kicker color={C.forest}>{t(e.afterLabel, lang)}</Kicker>
          <div style={{ marginTop: 18, display: "grid", gap: 11 }}>
            {e.afterSteps.map((s, i) => (
              <Stagger key={i} at={3} step={step} i={i} y={10}>
                <Caption size={25} color="rgba(43,42,40,0.9)">
                  {t(s, lang)}
                </Caption>
              </Stagger>
            ))}
          </div>
        </Reveal>
      </At>

      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchLine
          x1={942}
          y1={772}
          x2={942}
          y2={STAGE_H - 130}
          seed={31}
          amp={1.4}
          on={step >= 3}
          stroke="rgba(43,42,40,0.18)"
          width={1.5}
          duration={0.6}
        />
      </svg>
    </Slide>
  );
}

export function EscrowImpact({ step }: SlideProps) {
  const lang = useLang();
  const e = S.escrow.impact;

  return (
    <Slide>
      <At x={M.left} y={M.top + 40} w={640}>
        <Reveal at={0} step={step} y={20}>
          <Title size={70}>{t(e.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.1} style={{ marginTop: 28 }}>
          <Rule w={132} color={C.forest} delay={0.16} />
        </Reveal>
        <Reveal at={0} step={step} delay={0.16} style={{ marginTop: 30 }}>
          <Body>{t(e.body, lang)}</Body>
        </Reveal>
      </At>

      {/* Only four points, so the list has to be opened up to earn the column
          it sits in — at a 42 px gap it bunched into the top third and the
          divider ran 350 px past the last item into nothing. */}
      <At x={900} y={M.top + 40} w={860}>
        <div style={{ display: "grid", gap: 66 }}>
          {e.points.map((p, i) => (
            <Stagger key={i} at={i + 1} step={step} i={0} y={20}>
              <Item n={i + 1} title={p.t} detail={p.d} color={C.forest} />
            </Stagger>
          ))}
        </div>
      </At>

      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchLine
          x1={822}
          y1={M.top + 20}
          x2={822}
          y2={720}
          seed={17}
          amp={1.6}
          on={step >= 1}
          stroke="rgba(43,42,40,0.18)"
          width={1.5}
          duration={0.8}
        />
      </svg>
    </Slide>
  );
}

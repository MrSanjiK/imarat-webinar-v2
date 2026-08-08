"use client";

import { STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal } from "@/deck/Reveal";
import { VideoSlot } from "@/deck/VideoPool";
import { VideoExpand, useLightbox } from "@/deck/Lightbox";
import { useLang } from "@/content/lang";
import { billions, t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  At,
  Body,
  Caption,
  Chip,
  Kicker,
  M,
  Note,
  Slide,
  Stat,
  Title,
} from "@/ui/layout";
import { C, Counter, SketchRect } from "@/ui/sketch";
import { DebtStory } from "@/ui/diagrams/DebtStory";
import { ChapterOpener } from "./common";

/** Chapter 3 — where the $9 700 apartments came from. The honesty of this
 *  chapter is the reason the offer at the end is believable. */

export function ReadyOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={3}
      step={step}
      title={S.chapters.c3.title}
      lead={S.chapters.c3.lead}
      image="/media/renders/render-025.webp"
    />
  );
}

// ── Debt story ───────────────────────────────────────────────────────────────

export function ReadyDebt({ step }: SlideProps) {
  const lang = useLang();
  const d = S.ready.debt;

  return (
    <Slide>
      <At x={M.left} y={M.top} w={1180}>
        <Reveal at={0} step={step} y={18}>
          <Title size={70}>{t(d.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.1} style={{ marginTop: 22 }}>
          <Lead28>{t(d.body, lang)}</Lead28>
        </Reveal>
      </At>

      <At x={M.left} y={342} w={1090}>
        <div style={{ height: 464 }}>
          <DebtStory step={step} />
        </div>
      </At>

      {/* The two numbers the diagram builds toward. */}
      <At x={1320} y={342} w={440}>
        <Reveal at={2} step={step} y={22}>
          <Stat
            color={C.ember}
            size={92}
            value={
              <Counter
                to={N.debt.totalSoum}
                on={step >= 2}
                format={(v) => billions(v, lang)}
              />
            }
            label={d.debtLabel}
          />
        </Reveal>

        <Reveal at={2} step={step} y={22} delay={0.16} style={{ marginTop: 62 }}>
          <Stat
            color={C.ember}
            size={92}
            value={
              <Counter
                to={N.debt.defaultShare * 100}
                on={step >= 2}
                format={(v) => `${Math.round(v)}%`}
              />
            }
            label={d.shareLabel}
          />
        </Reveal>
      </At>

      {/* Stage captions, one per build. The last one wraps to two lines in both
          alphabets, which is what sets this y. */}
      <At x={M.left} y={816} w={1600}>
        <div style={{ display: "flex", gap: 64 }}>
          <StageNote at={1} step={step} title={d.planTitle} body={d.planBody} />
          <StageNote at={2} step={step} title={d.realTitle} body={d.realBody} tone="ember" />
          <StageNote at={3} step={step} title={d.stretchTitle} body={d.stretchBody} tone="ember" />
          <StageNote at={4} step={step} title={d.recoverTitle} body={d.recoverBody} tone="forest" />
        </div>
      </At>
    </Slide>
  );
}

function Lead28({ children }: { children: React.ReactNode }) {
  return (
    <Body size={32} color={C.ink} style={{ maxWidth: 1000, fontWeight: 400 }}>
      {children}
    </Body>
  );
}

function StageNote({
  at,
  step,
  title,
  body,
  tone = "ash",
}: {
  at: number;
  step: number;
  title: string;
  body?: string;
  tone?: "ash" | "ember" | "forest";
}) {
  const lang = useLang();
  const color = tone === "ember" ? C.ember : tone === "forest" ? C.forest : C.ash;
  return (
    <Reveal at={at} step={step} y={14} style={{ flex: 1 }}>
      <div style={{ borderTop: `2px solid ${color}`, paddingTop: 16 }}>
        <div className="font-mono" style={{ fontSize: 18, letterSpacing: "0.12em", color, textTransform: "uppercase" }}>
          {t(title, lang)}
        </div>
        {body && (
          <Caption size={23} style={{ marginTop: 10 }}>
            {t(body, lang)}
          </Caption>
        )}
      </div>
    </Reveal>
  );
}

// ── Purchase process ─────────────────────────────────────────────────────────

export function ReadyProcess({ step }: SlideProps) {
  const lang = useLang();
  const p = S.ready.process;

  return (
    <Slide>
      <At x={M.left} y={M.top + 40} w={600}>
        <Reveal at={0} step={step} y={20}>
          <Title size={66}>{t(p.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 30 }}>
          <Body>{t(p.body, lang)}</Body>
        </Reveal>
      </At>

      <At x={880} y={M.top + 30} w={880}>
        <div style={{ display: "grid", gap: 34 }}>
          {p.steps.map((s, i) => (
            <Reveal key={i} at={i + 1} step={step} y={18} x={10}>
              <div
                style={{
                  display: "flex",
                  gap: 26,
                  alignItems: "flex-start",
                  padding: "20px 24px",
                  borderRadius: 10,
                  background: step === i + 1 ? "rgba(14,92,67,0.06)" : "transparent",
                  transition: "background 320ms",
                }}
              >
                <div
                  className="tnum font-mono"
                  style={{
                    fontSize: 20,
                    color: C.forest,
                    letterSpacing: "0.06em",
                    paddingTop: 8,
                    width: 34,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.2, color: C.ink }}>
                    {t(s.t, lang)}
                  </div>
                  <Caption size={24} style={{ marginTop: 8 }}>
                    {t(s.d, lang)}
                  </Caption>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </At>
    </Slide>
  );
}

// ── Studio apartment: portrait tour + floor plan ──────────────────────────────

export function ReadyStudio({ step }: SlideProps) {
  const lang = useLang();
  const s = S.ready.studio;
  const openLightbox = useLightbox();

  // Phone-shaped frame, drawn in pencil. The portrait clip fills it exactly.
  const px = 1352;
  const py = 108;
  const pw = 408;
  const ph = 726;

  // The floor plan reads as a second sheet beside the phone: same width, and
  // sized so its caption lands on the tour caption's baseline. Its source is
  // 495×933, tall enough to run off the stage at full width, and it carries a
  // catalogue sheet number across the top — hence the scale and the crop.
  const gx = 862;
  const gy = 122;
  const gcrop = 31;
  const gh = 738;

  return (
    <Slide grid={false}>
      <VideoSlot
        id="studio-tour"
        x={px}
        y={py}
        w={pw}
        h={ph}
        radius={26}
        playing={step >= 1}
        loop
        muted
        fit="cover"
        z={8}
      />

      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 20 }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchRect
          x={px - 18}
          y={py - 18}
          w={pw + 36}
          h={ph + 36}
          seed={57}
          amp={1.5}
          on
          stroke={C.ink}
          width={2.5}
          duration={1}
        />
      </svg>
      {step >= 1 && <VideoExpand id="studio-tour" x={px} y={py} w={pw} h={ph} radius={26} />}

      <At x={px} y={py + ph + 44} w={pw} z={20}>
        <Reveal at={1} step={step}>
          <Caption align="center">{t(s.tourLabel, lang)}</Caption>
        </Reveal>
      </At>

      <At x={M.left} y={M.top + 30} w={620}>
        <Reveal at={0} step={step} y={18}>
          <Kicker color={C.forest}>{t(s.areaLabel, lang)}</Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={22} delay={0.06} style={{ marginTop: 20 }}>
          <Title size={72}>{t(s.title, lang)}</Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 28 }}>
          <Body>{t(s.body, lang)}</Body>
        </Reveal>
        <Reveal at={2} step={step} style={{ marginTop: 44 }}>
          <Chip color={C.gold} size={21}>
            {`$${N.studio.tiers[0].usd.toLocaleString("ru-RU").replace(/ /g, " ")}`}
          </Chip>
        </Reveal>
      </At>

      {/* Floor plan sits on the paper like a printed sheet. */}
      <At x={gx} y={gy} w={pw} z={5}>
        <Reveal at={2} step={step} y={20}>
          <div
            style={{ cursor: "zoom-in" }}
            onClick={(e) => {
              e.stopPropagation();
              openLightbox({ kind: "image", src: "/media/plans/studio-21-23.webp", bg: "paper" });
            }}
          >
            <div style={{ height: gh, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/plans/studio-21-23.webp"
                alt=""
                draggable={false}
                onError={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}
                style={{
                  width: pw,
                  height: "auto",
                  display: "block",
                  marginTop: -gcrop,
                  mixBlendMode: "multiply",
                }}
              />
            </div>
            <Caption align="center" style={{ marginTop: 18 }}>
              {t(s.planLabel, lang)}
            </Caption>
          </div>
        </Reveal>
      </At>

      <At x={M.left} y={782} w={560}>
        <Reveal at={2} step={step} delay={0.2}>
          <Note size={32}>
            {lang === "latn"
              ? "Bino tayyor — kutish yo‘q."
              : "Бино тайёр — кутиш йўқ."}
          </Note>
        </Reveal>
      </At>
    </Slide>
  );
}

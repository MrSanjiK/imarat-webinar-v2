"use client";

import { motion } from "motion/react";
import { EASE, STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { At, Body, Caption, Kicker, M, Rule, Slide, Title } from "@/ui/layout";
import { C, SketchRect } from "@/ui/sketch";

/**
 * The first thing 500 people see. It has to look printed, not rendered: a
 * drafting sheet with a pinned photograph, not a hero section.
 */
export function Cover({ step }: SlideProps) {
  const lang = useLang();

  const frameX = 1108;
  const frameY = 176;
  const frameW = 652;
  // Sized so the caption hanging 22 px under the frame lands in the sheet's
  // bottom margin rather than in the band the progress rail owns.
  const frameH = 714;

  return (
    <Slide theme="paper" grid={false}>
      {/* Sheet border — the whole slide is a page. */}
      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchRect
          x={64}
          y={56}
          w={STAGE_W - 128}
          h={STAGE_H - 112}
          seed={5}
          amp={1.2}
          on
          stroke="rgba(43,42,40,0.20)"
          width={1.5}
          duration={1.4}
        />
      </svg>

      <div
        className="dotgrid"
        style={{
          position: "absolute",
          left: 64,
          top: 56,
          width: 320,
          height: 260,
          opacity: 0.55,
          maskImage: "linear-gradient(135deg, #000 0%, transparent 76%)",
          WebkitMaskImage: "linear-gradient(135deg, #000 0%, transparent 76%)",
        }}
      />

      {/* Pinned render, hand-drawn frame. */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0, rotate: 1.1 }}
        transition={{ duration: 0.9, ease: EASE }}
        style={{ position: "absolute", left: frameX, top: frameY, width: frameW, height: frameH }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: C.paper2,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/renders/hero.webp"
            alt=""
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
            // Framed portrait against a 1600×960 source, so `cover` crops
            // horizontally only and the window is 876 source px wide. An
            // ambulance is parked at the gate at source x 480–667 — the one
            // saturated red in a sage-and-cream frame, on the slide that stays
            // up longest while the audience joins, immediately before a chapter
            // about buildings killing people. Anything above 92% clears it;
            // 96% clears it by a margin and lands on the brand screen.
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "96% 50%",
              display: "block",
            }}
          />
        </div>
        <svg
          style={{ position: "absolute", left: -14, top: -14, pointerEvents: "none" }}
          width={frameW + 28}
          height={frameH + 28}
        >
          <SketchRect
            x={14}
            y={14}
            w={frameW}
            h={frameH}
            seed={23}
            amp={1.6}
            on
            stroke={C.ink}
            width={2.5}
            duration={1.1}
            delay={0.2}
          />
        </svg>
        <div
          className="font-mono"
          style={{
            position: "absolute",
            left: 4,
            top: frameH + 22,
            fontSize: 17,
            letterSpacing: "0.14em",
            color: C.ash,
            textTransform: "uppercase",
          }}
        >
          {t(S.brand.project, lang)}
        </div>
      </motion.div>

      {/* Wordmark */}
      <At x={M.left} y={132} w={760}>
        <Reveal at={0} step={step} y={14}>
          <div
            className="font-display"
            style={{ fontSize: 34, fontWeight: 600, letterSpacing: "0.02em", color: C.ink }}
          >
            IMARAT
            <span style={{ fontWeight: 300, color: C.ash }}> Development</span>
          </div>
        </Reveal>
      </At>

      <At x={M.left} y={322} w={900}>
        <Reveal at={0} step={step} y={18} delay={0.06}>
          <Kicker color={C.forest}>
            {`${t(S.cover.kicker, lang)} · ${t(S.cover.date, lang)}`}
          </Kicker>
        </Reveal>

        <Reveal at={0} step={step} y={26} delay={0.14} style={{ marginTop: 26 }}>
          <Title size={104} style={{ lineHeight: 1.02 }}>
            {t(S.brand.tagline, lang)}
          </Title>
          <Title size={104} color={C.forest} style={{ lineHeight: 1.02 }}>
            {t(S.brand.taglineAccent, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.3} style={{ marginTop: 36 }}>
          <Rule w={196} color={C.gold} thickness={3} delay={0.36} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 34 }}>
          <Body size={31} style={{ maxWidth: 760 }}>
            {t(S.cover.subtitle, lang)}
          </Body>
        </Reveal>
      </At>

      {/* Speaker */}
      <At x={M.left} y={770} w={760}>
        <Reveal at={1} step={step} delay={0.1}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 3,
                height: 62,
                background: C.gold,
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 30, fontWeight: 400, color: C.ink, letterSpacing: "-0.01em" }}>
                {t(S.brand.speaker, lang)}
              </div>
              <Caption style={{ marginTop: 6 }}>{t(S.brand.speakerRole, lang)}</Caption>
            </div>
          </div>
        </Reveal>
      </At>

      {/* Sits on the photo caption's line — two notes in the bottom margin. */}
      <At x={M.left} y={STAGE_H - 188} w={520}>
        <Reveal at={1} step={step} delay={0.24}>
          <div
            className="font-hand"
            style={{ fontSize: 30, color: C.ash }}
          >
            {t(S.cover.hint, lang)}
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

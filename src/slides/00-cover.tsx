"use client";

import { STAGE_H, type SlideProps } from "@/deck/types";
import { Reveal } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { At, Chip, M, Rule, Slide, Title } from "@/ui/layout";
import { Glow, Mesh, V, Wipe } from "@/ui/vivid";
import { useLightbox } from "@/deck/Lightbox";

/**
 * The first thing 500 people see, and the slide that stays up longest while
 * the audience joins. Bright white, electric emerald, one hero render in a
 * rounded card — a poster, not a hero section.
 */
export function Cover({ step }: SlideProps) {
  const lang = useLang();
  const openLightbox = useLightbox();

  const cardX = 1096;
  const cardY = 150;
  const cardW = 664;
  const cardH = 700;

  return (
    <Slide theme="paper" grid={false}>
      <Mesh variant="paper" />
      <Glow x={1428} y={500} r={460} color="0,168,104" opacity={0.16} />
      <Glow x={220} y={980} r={380} color="201,241,106" opacity={0.2} />

      {/* Hero render as a rounded card. */}
      <Wipe
        on
        dir="left"
        duration={0.9}
        style={{
          position: "absolute",
          left: cardX,
          top: cardY,
          width: cardW,
          height: cardH,
          borderRadius: 44,
          overflow: "hidden",
          boxShadow: "0 36px 90px rgba(10,31,20,0.18)",
          cursor: "zoom-in",
        }}
      >
        <div
          style={{ position: "absolute", inset: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            openLightbox({ kind: "image", src: "/media/renders/hero.webp" });
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
            // 96% keeps the ambulance parked at the gate (source x 480–667)
            // outside the cropped window — the one saturated red on the slide
            // that stays up longest, right before a chapter about collapse.
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "96% 50%",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 44,
              border: "1px solid rgba(10,31,20,0.08)",
              pointerEvents: "none",
            }}
          />
        </div>
      </Wipe>

      {/* The project lockup is nearly square (900 × 758) — a leaf mark stacked
          over a wordmark. Below ~56 px the wordmark stops resolving and the
          whole thing reads as a smudge, which is worse than not showing it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/logos/sergeli-dark.webp"
        alt=""
        draggable={false}
        onError={(e) => {
          e.currentTarget.style.opacity = "0";
        }}
        style={{
          position: "absolute",
          left: cardX + 4,
          top: cardY + cardH + 30,
          height: 72,
          width: "auto",
          opacity: 0.9,
        }}
      />

      {/* Brand */}
      <At x={M.left} y={118} w={760}>
        <Reveal at={0} step={step} y={14}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/logos/imarat-dark.webp"
            alt="IMARAT Development"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
            style={{ height: 46, width: "auto", display: "block" }}
          />
        </Reveal>
      </At>

      <At x={M.left} y={292} w={880}>
        <Reveal at={0} step={step} y={18} delay={0.06}>
          <Chip filled size={20}>
            {`${t(S.cover.kicker, lang)} · ${t(S.cover.date, lang)}`}
          </Chip>
        </Reveal>

        <Reveal at={0} step={step} y={28} delay={0.14} style={{ marginTop: 38 }}>
          <Title size={100} style={{ lineHeight: 1.04, letterSpacing: "-0.025em" }}>
            {t(S.brand.tagline, lang)}
          </Title>
          <Title size={100} color={V.emerald} style={{ lineHeight: 1.04, letterSpacing: "-0.025em" }}>
            {t(S.brand.taglineAccent, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.3} style={{ marginTop: 38 }}>
          <Rule w={188} color={V.gold} thickness={4} delay={0.36} />
        </Reveal>

        <Reveal at={0} step={step} delay={0.36} style={{ marginTop: 36 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            {[
              { label: S.chapters.c1.title, color: "#FF5E3A" },
              { label: S.chapters.c2.title, color: V.emerald },
              { label: S.chapters.c3.title, color: V.gold },
              { label: S.chapters.c5.title, color: V.forest },
            ].map(({ label, color }, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 32,
                  fontWeight: 500,
                  color: V.ink,
                  letterSpacing: "-0.015em",
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0 }} />
                {t(label, lang)}
                {i < 3 && (
                  <div style={{ width: 1, height: 26, background: "rgba(10,31,20,0.18)", marginLeft: 4 }} />
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </At>

      <At x={M.left} y={STAGE_H - 178} w={520}>
        <Reveal at={0} step={step} delay={0.46}>
          <div className="font-mono" style={{ fontSize: 21, letterSpacing: "0.12em", color: V.ash }}>
            {t(S.cover.hint, lang)}
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

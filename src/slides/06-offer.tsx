"use client";

import { motion } from "motion/react";
import { EASE, type SlideProps } from "@/deck/types";
import { Reveal } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t, usd } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  At,
  Backdrop,
  Body,
  Chip,
  Kicker,
  Lead,
  M,
  Rule,
  Slide,
  Title,
} from "@/ui/layout";
import { CountUp, Glow, Mesh, V, Wipe } from "@/ui/vivid";
import { FloorPriceLadder } from "@/ui/diagrams/FloorPriceLadder";
import { InstallmentVariants } from "@/ui/diagrams/InstallmentVariants";
import { ExpandCorner, useLightbox } from "@/deck/Lightbox";
import { FestiveParticles } from "@/ui/FestiveParticles";
import { ChapterOpener } from "./common";

/**
 * Chapter 6 — the ask.
 *
 * Everything before this was argument; this chapter is arithmetic. Gold is the
 * money colour and it is used for nothing else here; emerald carries structure
 * and every call to action. The slide that closes the sale holds one QR code at
 * 500 stage pixels and nothing on top of it, because Zoom's encoder eats small
 * dark modules and a code the room cannot scan is the whole hour wasted.
 */

const pad2 = (n: number) => String(n).padStart(2, "0");

// ── 01 · chapter opener ──────────────────────────────────────────────────────

export function OfferOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={6}
      step={step}
      title={S.chapters.c6.title}
      lead={S.chapters.c6.lead}
      image="/media/renders/render-027.webp"
    />
  );
}

// ── 02 · the framing ─────────────────────────────────────────────────────────

/**
 * Steps
 *   0 — the gold urgency chip and the headline; the rule under it.
 *   1 — the format chip, and the hairline that splits words from money.
 *   2 — the number. One oversized figure, low and right, counting up.
 */
export function OfferIntro({ step }: SlideProps) {
  const o = S.offer.intro;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={1420} y={800} r={520} color="240,178,62" opacity={0.24} />
      <Glow x={240} y={220} r={380} color="0,168,104" opacity={0.14} />

      <At x={M.left} y={180} w={1060}>
        <Reveal at={0} step={step} y={16}>
          <Chip color={V.gold} filled size={22}>
            {o.badge}
          </Chip>
        </Reveal>

        {/* Unbounded is very wide and Cyrillic runs ~15% wider again, so the
            measure is set to hold this headline at two lines in both alphabets
            — a third line would cross the fold the price sits under. */}
        <Reveal at={0} step={step} y={26} delay={0.08} style={{ marginTop: 36 }}>
          <Title size={58} style={{ maxWidth: 1040, letterSpacing: "-0.025em" }}>
            {o.title}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.22} style={{ marginTop: 34 }}>
          <Rule w={196} color={V.gold} thickness={5} delay={0.28} />
        </Reveal>

        <Reveal at={1} step={step} y={14} style={{ marginTop: 34 }}>
          <Chip color={V.emerald} size={22}>
            {o.subtitle}
          </Chip>
        </Reveal>
      </At>

      {/* The fold: words above it, the money below. */}
      <At x={M.left} y={576} w={M.width}>
        <Rule on={step >= 1} w={M.width} color="rgba(10,31,20,0.12)" thickness={2} delay={0.1} />
      </At>

      {/* Right-aligned so the oversized figure lands on the same optical edge
          as the deck's right margin instead of floating in the middle. */}
      <At x={M.left} y={618} w={M.width} style={{ textAlign: "right" }}>
        <Reveal at={2} step={step} y={18}>
          <Kicker color={V.gold} size={22} style={{ textAlign: "right" }}>
            {S.offer.ladder.heroNote}
          </Kicker>
        </Reveal>
        <Reveal at={2} step={step} y={30} delay={0.1} style={{ marginTop: 24 }}>
          <div
            className="font-display"
            style={{
              fontSize: 208,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              color: V.gold,
              whiteSpace: "nowrap",
            }}
          >
            <CountUp
              to={N.studio.tiers[0].usd}
              on={step >= 2}
              duration={1.25}
              delay={0.12}
              format={(v) => usd(v)}
            />
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 03 · price ladder ────────────────────────────────────────────────────────

/**
 * The diagram owns this slide; the left column is a caption for it.
 *
 * Steps
 *   0 — title, rule, the "price depends on the floor" line.
 *   1 — the section builds bottom-up; the studio area chip lands.
 *   2 — floors 13–16 light gold and $9 700 counts up. The hero.
 *   3 — floors 9–12.
 *   4 — floors 4–8, then 2–3.
 */
export function OfferLadder({ step }: SlideProps) {
  const o = S.offer.ladder;

  return (
    <Slide>
      <Glow x={200} y={860} r={400} color="240,178,62" opacity={0.16} />

      <At x={M.left} y={186} w={520}>
        <Reveal at={0} step={step} y={20}>
          <Title size={48} style={{ maxWidth: 500, letterSpacing: "-0.02em" }}>
            {o.title}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.14} style={{ marginTop: 30 }}>
          <Rule w={166} color={V.gold} thickness={5} delay={0.2} />
        </Reveal>
        <Reveal at={0} step={step} delay={0.24} style={{ marginTop: 32 }}>
          <Body size={26} style={{ maxWidth: 470 }}>
            {o.note}
          </Body>
        </Reveal>

        <Reveal at={1} step={step} y={14} style={{ marginTop: 46 }}>
          <Chip color={V.emerald} size={21}>
            {`${N.studio.areaFrom}–${N.studio.areaTo} m²`}
          </Chip>
        </Reveal>
      </At>

      <At x={740} y={142}>
        <FloorPriceLadder step={step} />
      </At>
    </Slide>
  );
}

// ── 04 · first day ───────────────────────────────────────────────────────────

/**
 * Steps
 *   0 — the date and the headline over the render.
 *   1 — the condition.
 *   2 — the gift, on a solid emerald slab that pops in at 1.16 → 1.
 */
export function OfferFirstDay({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.firstDay;
  const date = `${pad2(N.webinarDate.d)}.${pad2(N.webinarDate.m)}.${N.webinarDate.y}`;

  return (
    <Slide grid={false}>
      {/* Full strength, not the 0.55 this used to carry: the left scrim already
          clears the text column, and dimming the whole plate only bleached the
          facade on the right to grey. */}
      <Backdrop src="/media/renders/render-016.webp" theme="paper" scrim="left" />
      <ExpandCorner item={{ kind: "image", src: "/media/renders/render-016.webp" }} light={false} />
      <FestiveParticles on={step >= 2} />

      <At x={M.left} y={200} w={860} z={10}>
        <Reveal at={0} step={step} y={16}>
          <Kicker color={V.gold} size={22}>
            {date}
          </Kicker>
        </Reveal>

        <Reveal at={0} step={step} y={26} delay={0.08} style={{ marginTop: 26 }}>
          <Title size={72} style={{ maxWidth: 820, letterSpacing: "-0.028em" }}>
            {o.title}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.22} style={{ marginTop: 34 }}>
          <Rule w={186} color={V.gold} thickness={5} delay={0.28} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 34 }}>
          <Body size={30} style={{ maxWidth: 780 }}>
            {o.body}
          </Body>
        </Reveal>
      </At>

      {/* The gift. One oversized slab, the only saturated fill on the slide. */}
      <At x={M.left} y={700} w={1000} z={10}>
        <motion.div
          initial={false}
          animate={{ opacity: step >= 2 ? 1 : 0, scale: step >= 2 ? 1 : 1.16, y: step >= 2 ? 0 : 20 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="font-display"
          style={{
            display: "inline-block",
            transformOrigin: "left center",
            background: V.emerald,
            color: V.paper,
            borderRadius: 34,
            padding: "34px 54px 38px",
            fontSize: 68,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
            boxShadow: "0 30px 72px rgba(10,31,20,0.24)",
          }}
        >
          {t(o.badge, lang)}
        </motion.div>
      </At>
    </Slide>
  );
}

// ── 05 · instalments ─────────────────────────────────────────────────────────

/**
 * Steps
 *   0 — title and the empty rails of both plans.
 *   1 — variant 1 fills: down payment, forty months, the monthly figure.
 *   2 — variant 2 fills in gold — bigger down payment, smaller month.
 *   3 — the −10% chip drops and the discounted total lands; the bonus chip
 *       arrives with it.
 */
export function OfferInstallments({ step }: SlideProps) {
  const o = S.offer.installments;

  return (
    <Slide>
      <Backdrop src="/media/renders/render-009.webp" theme="paper" scrim="none" opacity={0.05} />
      <Glow x={1560} y={880} r={420} color="240,178,62" opacity={0.16} />

      <At x={M.left} y={116} w={900}>
        <Reveal at={0} step={step} y={18}>
          <Title size={48} style={{ maxWidth: 860, letterSpacing: "-0.022em" }}>
            {o.title}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.14} style={{ marginTop: 26 }}>
          <Rule w={172} color={V.gold} thickness={5} delay={0.2} />
        </Reveal>
      </At>

      <At x={1120} y={126} w={640}>
        <Reveal at={3} step={step} y={14} style={{ textAlign: "right" }}>
          <Chip color={V.emerald} filled size={22}>
            {o.bonus}
          </Chip>
        </Reveal>
      </At>

      <At x={M.left} y={300}>
        <InstallmentVariants step={step} />
      </At>
    </Slide>
  );
}

// ── 06 · the QR ──────────────────────────────────────────────────────────────

/**
 * The slide the room photographs.
 *
 * Zoom re-encodes at a fraction of the stage resolution and its deblocker
 * smears any dark module smaller than a few encoded pixels, so the code is
 * 500 stage px on a white card with a 70 px quiet zone, ink on white, square to
 * the frame, never rotated, and nothing — no sheen, no chip, no caption — is
 * ever drawn over it. Everything else on the slide is text, on the left.
 *
 * Steps
 *   0 — urgency chip, headline, rule.
 *   1 — the card wipes in whole, and the line that says what is behind it.
 *   2 — the handle in mono at 40 px, and the emerald scan chip.
 */
export function OfferCta({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.cta;
  const openLightbox = useLightbox();

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={260} y={300} r={420} color="0,168,104" opacity={0.16} />
      <Glow x={1400} y={940} r={420} color="240,178,62" opacity={0.16} />

      <At x={M.left} y={206} w={820}>
        <Reveal at={0} step={step} y={16}>
          <Chip color={V.gold} filled size={22}>
            {S.offer.intro.badge}
          </Chip>
        </Reveal>

        <Reveal at={0} step={step} y={26} delay={0.08} style={{ marginTop: 36 }}>
          <Title size={76} style={{ maxWidth: 820, letterSpacing: "-0.028em" }}>
            {o.title}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.22} style={{ marginTop: 34 }}>
          <Rule w={206} color={V.emerald} thickness={5} delay={0.28} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 38 }}>
          <Body size={30} style={{ maxWidth: 760 }}>
            {o.body}
          </Body>
        </Reveal>

        <Reveal at={2} step={step} y={16} style={{ marginTop: 54 }}>
          <div
            className="font-mono"
            style={{ fontSize: 40, letterSpacing: "0.01em", color: V.emerald, whiteSpace: "nowrap" }}
          >
            {t(o.handleFallback, lang)}
          </div>
        </Reveal>

        <Reveal at={2} step={step} y={14} delay={0.12} style={{ marginTop: 30 }}>
          <Chip color={V.emerald} filled size={22}>
            {o.scan}
          </Chip>
        </Reveal>
      </At>

      {/* 640 × 640 card, 500 px code, 70 px quiet zone on every side.
          The card takes the QR asset's own field colour rather than pure white:
          telegram.svg paints its background, and a white surround would put a
          visible warm square inside a white card at 500 px — worse, it would
          cut the quiet zone down to the asset's own margin. Matched, the quiet
          zone is continuous and the code's contrast (#2B2A28 on #F4F1EA) is
          still far past what any scanner needs after Zoom re-encodes it. */}
      <Wipe
        on={step >= 1}
        dir="up"
        duration={0.7}
        style={{
          position: "absolute",
          left: 1120,
          top: 196,
          width: 640,
          height: 640,
          borderRadius: 36,
          background: "#F4F1EA",
          border: "1px solid rgba(10,31,20,0.10)",
          boxShadow: "0 34px 84px rgba(10,31,20,0.16)",
          cursor: "zoom-in",
        }}
      >
        <div
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}
          onClick={(e) => {
            e.stopPropagation();
            openLightbox({ kind: "image", src: "/media/qr/telegram.svg", bg: "paper" });
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/qr/telegram.svg"
            alt=""
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
            style={{ width: 500, height: 500, display: "block" }}
          />
        </div>
      </Wipe>
    </Slide>
  );
}

// ── 07 · close ───────────────────────────────────────────────────────────────

/**
 * Steps
 *   0 — "Rahmat!" and the leaf rule, bottom-left over the render.
 *   1 — the invitation to ask, the signature and the handle.
 */
export function OfferEnd({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.end;

  return (
    <Slide theme="dark" grid={false}>
      {/* The deck sits here for the whole Q&A, so it is the frame people look
          at longest. At 0.34 under a full scrim the aerial went flat green.
          A left ramp instead: the text column stays protected, the city on
          the right stays a photograph. */}
      <Backdrop src="/media/renders/render-008.webp" theme="dark" scrim="left" opacity={0.78} />
      <Glow x={1500} y={260} r={460} color="62,214,106" opacity={0.18} />

      <At
        x={M.left}
        y={M.top}
        w={1160}
        z={10}
        style={{
          height: M.bottom - M.top,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingBottom: 44,
          textShadow: "0 2px 26px rgba(5,24,16,0.6)",
        }}
      >
        <Reveal at={0} step={step} y={30}>
          <Title theme="dark" size={150} style={{ letterSpacing: "-0.045em" }}>
            {o.title}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 40 }}>
          <Rule w={248} color={V.leaf} thickness={5} delay={0.26} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 42 }}>
          <Lead theme="dark" size={40} style={{ maxWidth: 940 }}>
            {o.body}
          </Lead>
        </Reveal>

        <Reveal at={1} step={step} delay={0.16} style={{ marginTop: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <div
              className="font-mono"
              style={{
                fontSize: 24,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: V.leaf,
              }}
            >
              {t(o.sign, lang)}
            </div>
            <div style={{ width: 2, height: 30, borderRadius: 2, background: "rgba(244,251,244,0.24)" }} />
            <div className="font-mono" style={{ fontSize: 24, color: "rgba(244,251,244,0.72)" }}>
              {t(S.offer.cta.handleFallback, lang)}
            </div>
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

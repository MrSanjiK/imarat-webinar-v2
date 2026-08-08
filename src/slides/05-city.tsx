"use client";

import { motion } from "motion/react";
import { EASE, STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal, Stagger } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t, type L } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  At,
  Backdrop,
  Body,
  Caption,
  Chip,
  Kicker,
  M,
  Rule,
  Slide,
  Title,
} from "@/ui/layout";
import { CountUp, Glow, Marquee, Mesh, V, Wipe } from "@/ui/vivid";
import { InfraMap } from "@/ui/diagrams/InfraMap";
import { ExpandCorner, useLightbox } from "@/deck/Lightbox";
import { ChapterOpener } from "./common";

/**
 * Chapter 5 — the project itself, in the v2 "IMARAT Vivid" language.
 *
 * This is the chapter where the renders are the argument, so every slide here
 * gives the image the whole stage and reduces the words to a kicker, a title
 * and at most two chips. Five full-bleed plates back to back, then the three
 * things a render cannot show: how it lives, what surrounds it, and what you
 * actually buy.
 */

const R = (n: string) => `/media/renders/render-${n}.webp`;

// ── showcase plate ───────────────────────────────────────────────────────────

/**
 * The chapter's own showcase, local by design: it needs a slow settle transform
 * on the image and an oversized asymmetric title block that the shared
 * `ShowcaseSlide` deliberately does not have, and chapter 5 is the only place
 * either belongs.
 *
 * Step 0 is the picture alone — the presenter gets a full beat to let a render
 * land before any type arrives. Step 1 brings the block.
 *
 * The settle is a scale on the image wrapper, keyed to `step` rather than to
 * mount, so it is still a pure function of step: at 0 the image sits at 1.04, at
 * 1 it is at 1. Arriving backwards from a later slide lands at 1 with no
 * replay, because motion animates from whatever the previous committed value
 * was and both endpoints are reachable in either direction.
 */
function Plate({
  step,
  image,
  title,
  caption,
  chips,
  position = "center",
  align = "left",
}: {
  step: number;
  image: string;
  title: L;
  caption?: L;
  chips?: readonly L[];
  position?: string;
  align?: "left" | "right";
}) {
  const lang = useLang();
  const right = align === "right";

  return (
    <Slide theme="dark" grid={false}>
      {/* The settle lives on a wrapper around the backdrop: `Backdrop` paints
          the scrim too, and scaling the scrim with the photograph would let the
          bottom guard creep off the frame. */}
      <motion.div
        initial={false}
        animate={{ scale: step >= 1 ? 1 : 1.04 }}
        transition={{ duration: 1.6, ease: EASE }}
        style={{ position: "absolute", inset: 0 }}
      >
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: position,
            }}
          />
        </div>
      </motion.div>

      {/* Scrim outside the scaling wrapper, so it stays pinned to the stage. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: right
            ? "linear-gradient(270deg, rgba(5,24,16,0.90) 0%, rgba(5,24,16,0.72) 28%, rgba(5,24,16,0.18) 58%, rgba(5,24,16,0.34) 100%)"
            : "linear-gradient(90deg, rgba(5,24,16,0.90) 0%, rgba(5,24,16,0.72) 28%, rgba(5,24,16,0.18) 58%, rgba(5,24,16,0.34) 100%)",
        }}
      />
      {/* Chrome guard: the rail and counter own everything below y=988. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(5,24,16,0.94) 0%, rgba(5,24,16,0.86) 7%, rgba(5,24,16,0.34) 13%, rgba(5,24,16,0) 22%)",
        }}
      />

      <ExpandCorner item={{ kind: "image", src: image }} light />

      {/* One oversized element, hard against one margin. Bottom-anchored so a
          Cyrillic title that wraps to a third line grows upward, away from the
          chrome band, instead of pushing into it. */}
      <At
        x={right ? STAGE_W - M.right - 820 : M.left}
        y={M.top}
        w={820}
        style={{
          height: M.bottom - M.top,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingBottom: 78,
          textAlign: right ? "right" : "left",
          // Inherited by every glyph: the kicker is leaf green at 20 px and
          // frequently sits over white facade where the scrim has thinned.
          textShadow: "0 2px 22px rgba(5,24,16,0.78)",
        }}
      >
        {caption && (
          <Reveal at={1} step={step} y={20}>
            <Kicker theme="dark" color={V.leaf}>
              {t(caption, lang)}
            </Kicker>
          </Reveal>
        )}

        <Reveal at={1} step={step} y={30} delay={0.08} style={{ marginTop: caption ? 22 : 0 }}>
          <Title theme="dark" size={104} style={{ letterSpacing: "-0.028em", lineHeight: 1.02 }}>
            {t(title, lang)}
          </Title>
        </Reveal>

        <Reveal at={1} step={step} delay={0.22} style={{ marginTop: 30 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: right ? "flex-end" : "flex-start",
            }}
          >
            {chips?.map((c, i) => (
              <Chip key={i} theme="dark" size={19} color={i === 0 ? V.leaf : V.lime}>
                {t(c, lang)}
              </Chip>
            ))}
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 01 · opener ──────────────────────────────────────────────────────────────

export function CityOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={5}
      step={step}
      title={S.chapters.c5.title}
      lead={S.chapters.c5.lead}
      theme="dark"
      image={R("008")}
    />
  );
}

// ── 02–06 · the five plates ──────────────────────────────────────────────────

export function CityMaster({ step }: SlideProps) {
  return (
    <Plate
      step={step}
      image={R("008")}
      title={S.city.master.title}
      caption={S.city.master.caption}
      // One chip, not two. The only other short string this slide owns is
      // `master.body`, a full sentence about courtyards and underground
      // parking — it belongs in the presenter's mouth over an aerial shot,
      // not set in 19 px caps across a render.
      chips={[S.brand.project]}
    />
  );
}

export function CityGate({ step }: SlideProps) {
  return (
    <Plate
      step={step}
      image={R("024")}
      title={S.city.gate.title}
      caption={S.city.gate.caption}
      align="right"
    />
  );
}

export function CityNight({ step }: SlideProps) {
  return (
    <Plate
      step={step}
      image={R("005")}
      title={S.city.night.title}
      caption={S.city.night.caption}
    />
  );
}

export function CityMahalla({ step }: SlideProps) {
  return (
    <Plate
      step={step}
      image={R("013")}
      title={S.city.mahalla.title}
      caption={S.city.mahalla.caption}
      align="right"
    />
  );
}

export function CityPark({ step }: SlideProps) {
  return (
    <Plate
      step={step}
      image={R("030")}
      title={S.city.park.title}
      caption={S.city.park.caption}
    />
  );
}

// ── 07 · lifestyle mosaic ────────────────────────────────────────────────────

const LIFE = [
  "playground",
  "barbecue",
  "waterfront",
  "school-kindergarten",
  "neighbours",
  "outdoor-active",
  "grill",
  "excursion",
] as const;

/**
 * Eight squares on paper, laid out as a deliberately uneven mosaic rather than
 * a 4 × 2 grid: two tall anchors on the outside, six small tiles between them.
 * A regular grid of eight photographs reads as a contact sheet; this reads as a
 * spread.
 *
 * Captions sit under their tile, never over it — text on top of eight
 * different photographs is eight different contrast problems, and the sources
 * already carry burned-in headlines of their own.
 *
 * `center top` on the crop: the sources are the marketing team's Instagram
 * carousel slides, 1080² with a two-line headline burned into the lower
 * quarter. Cropping from the centre put a knife through that text; showing the
 * top clears the highest of the eight (playground, y≈828).
 */
/**
 * Row 2 starts at 292, not at 226: a tile is 210 tall and its caption needs 64
 * under it, because every one of these eight strings wraps to two lines in
 * Cyrillic at 292 px. The gap is caption space, not air. The tall anchors are
 * 502 = 210 + 82 + 210, so all four columns bottom out on the same line.
 */
const MOSAIC = [
  { x: 0, y: 0, w: 348, h: 502 },
  { x: 364, y: 0, w: 292, h: 210 },
  { x: 672, y: 0, w: 292, h: 210 },
  { x: 980, y: 0, w: 292, h: 210 },
  { x: 364, y: 292, w: 292, h: 210 },
  { x: 672, y: 292, w: 292, h: 210 },
  { x: 980, y: 292, w: 292, h: 210 },
  { x: 1288, y: 0, w: 312, h: 502 },
] as const;

export function CityLife({ step }: SlideProps) {
  const lang = useLang();
  const c = S.city.life;
  const openLightbox = useLightbox();

  const x0 = M.left;
  const y0 = 300;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={1620} y={180} r={420} color="201,241,106" opacity={0.3} />
      <Glow x={180} y={880} r={380} color="0,168,104" opacity={0.14} />

      {/* 60/1400, not 78/1180: at 78 the headline wraps to two lines in both
          alphabets and its second line lands underneath the mosaic's top row. */}
      <At x={M.left} y={M.top + 6} w={1400}>
        <Reveal at={0} step={step} y={18}>
          <Kicker color={V.emerald}>{t(S.brand.project, lang)}</Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={26} delay={0.07} style={{ marginTop: 20 }}>
          <Title size={60} style={{ letterSpacing: "-0.026em" }}>
            {t(c.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 24 }}>
          <Rule w={164} color={V.gold} thickness={4} delay={0.26} />
        </Reveal>
      </At>

      {MOSAIC.map((m, i) => {
        const k = LIFE[i];
        // Two waves. Wave 1 is the two tall anchors and the top row, so the
        // spread's outer frame exists before anything fills in; wave 2 is the
        // three middle tiles. Within a wave the stagger index is positional,
        // not array order — the right-hand anchor is index 7 but arrives with
        // the top row, and paying 0.315 s of stagger for it would leave a hole
        // on the right of the stage for a third of a second.
        const wave = i <= 3 || i === 7 ? 1 : 2;
        const local = wave === 2 ? i - 4 : i === 7 ? 4 : i;
        return (
          <At key={k} x={x0 + m.x} y={y0 + m.y} w={m.w} z={1}>
            <Wipe
              on={step >= wave}
              dir="up"
              duration={0.66}
              delay={local * 0.045}
              style={{
                position: "relative",
                width: m.w,
                height: m.h,
                borderRadius: 22,
                overflow: "hidden",
                background: V.paper3,
                boxShadow: "0 20px 52px rgba(10,31,20,0.12)",
                cursor: "zoom-in",
              }}
            >
              <div
                style={{ position: "absolute", inset: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox({ kind: "image", src: `/media/lifestyle/${k}.webp` });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/media/lifestyle/${k}.webp`}
                  alt=""
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0";
                  }}
                  style={{
                    width: "100%",
                    // The small tiles are 292 × 210, so `cover` already scales
                    // the 1080² source to 292² and clips everything below 72%.
                    // The tall anchors are 502 on a 348-wide box, so `cover`
                    // scales to height and the whole source shows — burned-in
                    // headline included. 140% forces the same 72% window.
                    height: m.h > 300 ? "140%" : "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    display: "block",
                  }}
                />
              </div>
            </Wipe>
            <Stagger at={wave} step={step} i={local} y={10} gap={0.045}>
              <Caption size={20} style={{ marginTop: 12, color: V.ink2, lineHeight: 1.3 }}>
                {t(c.items[i], lang)}
              </Caption>
            </Stagger>
          </At>
        );
      })}
    </Slide>
  );
}

// ── 08 · infrastructure ──────────────────────────────────────────────────────

/**
 * The map carries this slide alone; the left column is a title and one line of
 * argument. There is deliberately no numbered key beside it — every disc prints
 * its own name and proximity on the map, and a key would put the same four
 * strings on the slide twice.
 *
 * Steps mirror `InfraMap`'s own map exactly, because the slide passes `step`
 * straight through: 0 node · 1 discs · 2 routes · 3 names · 4 focus.
 */
export function CityInfra({ step }: SlideProps) {
  const lang = useLang();
  const c = S.city.infra;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={1240} y={520} r={520} color="0,168,104" opacity={0.12} />

      {/* Centred against the map rather than hung off the top margin: with the
          key gone this column is three blocks tall, and aligning it to M.top
          left the whole left third bottom-heavy with white. */}
      <At x={M.left} y={352} w={520}>
        <Reveal at={0} step={step} y={22}>
          <Title size={70} style={{ letterSpacing: "-0.026em" }}>
            {t(c.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 26 }}>
          <Rule w={140} color={V.gold} thickness={4} delay={0.18} />
        </Reveal>
        <Reveal at={0} step={step} delay={0.18} style={{ marginTop: 28 }}>
          <Body size={27} style={{ maxWidth: 500 }}>
            {t(c.body, lang)}
          </Body>
        </Reveal>

      </At>

      {/* 1040 wide, not 1060: `preserveAspectRatio` fits the 1000 × 620 viewBox
          by width here, and the airport plate reaches x≈974 in viewBox units.
          At 1.06 that lands on 1772 — twelve pixels past the right margin the
          rest of the deck holds. */}
      <At x={740} y={150} w={1040} z={1}>
        <div style={{ height: 660 }}>
          <InfraMap step={step} />
        </div>
      </At>
    </Slide>
  );
}

// ── 09 · floor plans, presented as objects ───────────────────────────────────

const PLAN_FILES = ["studio-21-23", "1r-38-8", "2r-52-7", "2r-58-3", "2r-62-1"] as const;

/** Per-plan resting pose in the fan. Alternating rotateY and a small y offset
 *  keep five identical white rectangles from reading as a row of stamps. */
const FAN = [
  { ry: -7, dy: 14 },
  { ry: -3.5, dy: 0 },
  { ry: 0, dy: 10 },
  { ry: 3.5, dy: 0 },
  { ry: 7, dy: 14 },
] as const;

const CARD_W = 292;
const CARD_H = 396;
const CARD_GAP = 24;

/**
 * The plans are flat CAD line-drawings, and the client wants them to feel like
 * the premium objects the apartments are. So they are staged in a perspective
 * scene: white cards that arrive tilted back in 3D and settle flat, one at a
 * time, each with its area chip.
 *
 * Choreography (6 steps):
 *   0 — the fan: all five cards in, tilted back on X, splayed on Y, stagger.
 *   1 — plan 01 centre-stage: lifted, scaled, rotated flat; its chips pop; one
 *       sheen sweeps across it. The other four sit back and dim.
 *   2 — plan 02 takes the stage, 01 returns to the fan.
 *   3 — plan 03.
 *   4 — plan 04.
 *   5 — the set settles: every card flat, level, equal, and the format /
 *       catalog line lands underneath.
 *
 * Plan 05 never gets a solo — five solos plus an intro and a settle is eight
 * steps, and the registry freezes this slide at six. The final settle is where
 * the fifth is read, alongside the others.
 *
 * Everything animated here is `transform` or `opacity`. The card shadows are
 * static box-shadows that never change; the "lift" is scale and translate, not
 * a shadow tween. The sheen is a gradient element translated across a card
 * whose `overflow` clips it — no animated background-position.
 */
export function CityPlans({ step }: SlideProps) {
  const lang = useLang();
  const c = S.city.plans;
  const openLightbox = useLightbox();

  /** −1 on the intro and on the settle; 0–3 while one plan holds the stage. */
  const focus = step >= 1 && step <= 4 ? step - 1 : -1;
  const settled = step >= 5;

  const rowW = PLAN_FILES.length * CARD_W + (PLAN_FILES.length - 1) * CARD_GAP;
  const x0 = (STAGE_W - rowW) / 2;
  const rowY = 372;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={960} y={520} r={620} color="0,168,104" opacity={0.1} />

      <At x={M.left} y={M.top - 6} w={1100} z={5}>
        <Reveal at={0} step={step} y={18}>
          <Kicker color={V.emerald}>{t(S.brand.project, lang)}</Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={26} delay={0.06} style={{ marginTop: 18 }}>
          <Title size={76} style={{ letterSpacing: "-0.026em" }}>
            {t(c.title, lang)}
          </Title>
        </Reveal>
      </At>

      {/* Format count, top right — the one figure this slide says out loud, so
          it is the one thing here that counts up. The areas in the chips are
          ranges and decimals held as strings ("21–23 m²", "38,8 m²"); ticking
          those would mean re-typing client numbers as literals. */}
      <At x={STAGE_W - M.right - 420} y={M.top + 2} w={420} z={5}>
        <Reveal at={0} step={step} y={18} delay={0.16}>
          <div style={{ textAlign: "right" }}>
            <CountUp
              to={N.project.floorPlans}
              on={step >= 0}
              duration={0.7}
              delay={0.3}
              className="font-display"
              style={{
                display: "block",
                fontSize: 112,
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: V.emerald,
              }}
            />
            <Caption size={21} align="right" style={{ marginTop: 12 }}>
              {t(c.body, lang)}
            </Caption>
          </div>
        </Reveal>
      </At>

      {/* The scene. One shared perspective so all five cards share a vanishing
          point — per-card perspective would make each one its own little world. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: STAGE_W,
          height: STAGE_H,
          perspective: 1200,
          perspectiveOrigin: "50% 42%",
          pointerEvents: "none",
        }}
      >
        {PLAN_FILES.map((f, i) => {
          const isFocus = focus === i;
          const pose = FAN[i];

          // Resting: flat-ish fan. Focus: lifted, scaled, square on — and left
          // where it stands. Sliding it to the centre of the stage tore a hole
          // in the strip where it came from and buried the middle card behind
          // it, so a set of five read as four.
          const dy = isFocus ? -34 : settled ? 0 : pose.dy;

          return (
            <motion.div
              key={f}
              initial={false}
              animate={{
                y: dy,
                scale: isFocus ? 1.42 : focus >= 0 ? 0.92 : 1,
                rotateX: step === 0 ? 18 : 0,
                rotateY: isFocus || settled ? 0 : step === 0 ? pose.ry * 1.6 : pose.ry,
                opacity: focus >= 0 && !isFocus ? 0.34 : 1,
              }}
              transition={{ duration: 0.72, ease: EASE, delay: step === 0 ? i * 0.07 : 0 }}
              style={{
                position: "absolute",
                left: x0 + i * (CARD_W + CARD_GAP),
                top: rowY,
                width: CARD_W,
                height: CARD_H,
                transformStyle: "preserve-3d",
                zIndex: isFocus ? 20 : 10 - i,
                pointerEvents: "auto",
              }}
            >
              {/* Pre-drawn contact shadow. A static element, scaled with the
                  card by its parent — never an animated filter or box-shadow. */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: 18,
                  right: 18,
                  bottom: -26,
                  height: 46,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(50% 50% at 50% 50%, rgba(10,31,20,0.22) 0%, rgba(10,31,20,0) 70%)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 20,
                  background: V.paper,
                  border: "1px solid rgba(10,31,20,0.09)",
                  boxShadow: "0 26px 60px rgba(10,31,20,0.16)",
                  overflow: "hidden",
                  cursor: "zoom-in",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox({ kind: "image", src: `/media/plans/${f}.webp`, bg: "paper" });
                }}
              >
                {/* The five drawings run 0.53 → 1.36 in aspect — a studio really
                    is tall and narrow — so `contain` and let the card's own
                    white be the leftover, rather than cropping a plan. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/media/plans/${f}.webp`}
                  alt=""
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0";
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: 18,
                    boxSizing: "border-box",
                    display: "block",
                    mixBlendMode: "multiply",
                  }}
                />

                {/* One sheen per focused card. Translated, not repositioned. */}
                <motion.div
                  aria-hidden
                  initial={false}
                  animate={{ x: isFocus ? CARD_W + 180 : -220 }}
                  transition={{
                    duration: isFocus ? 1.05 : 0,
                    ease: EASE,
                    delay: isFocus ? 0.24 : 0,
                  }}
                  style={{
                    position: "absolute",
                    top: -40,
                    left: 0,
                    width: 150,
                    height: CARD_H + 80,
                    background:
                      "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(0,168,104,0.16) 45%, rgba(255,255,255,0) 100%)",
                  }}
                />
              </div>

              {/* Area chip. Sits on the card's lower edge so it travels with it
                  in 3D instead of floating free of the object. */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -6,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isFocus || settled || focus < 0 ? 1 : 0.9,
                    opacity: step === 0 ? 0 : 1,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: EASE,
                    delay: isFocus ? 0.2 : step === 5 ? i * 0.05 : 0,
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 16px",
                    borderRadius: 999,
                    background: isFocus ? V.emerald : V.paper,
                    border: `1.5px solid ${isFocus ? V.emerald : "rgba(10,31,20,0.12)"}`,
                    boxShadow: "0 10px 26px rgba(10,31,20,0.12)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      color: isFocus ? V.paper : V.ink,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t(c.items[i].t, lang)}
                  </span>
                  <span
                    className="tnum font-mono"
                    style={{
                      fontSize: 18,
                      color: isFocus ? "rgba(255,255,255,0.86)" : V.emerald,
                    }}
                  >
                    {t(c.items[i].d, lang)}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Slide>
  );
}

// ── 10 · catalog ─────────────────────────────────────────────────────────────

const CATALOG_PAGES = ["03", "07", "11", "15", "19"] as const;

/**
 * A swept rail of catalog spreads over a night render. Sells the existence of
 * the document; the document itself lives in the bot, which is where the lead
 * actually gets captured.
 *
 * Steps: 0 — title block over the render. 1 — the rail sweeps in, cards
 * staggered along it, and the page-count band starts running underneath.
 *
 * The sources are 1600 × 562 landscape spreads (2.85 : 1). Cropped to portrait
 * cards they showed an eighth of their own width, so each card carries the
 * source aspect and the rail is rotated as a whole instead.
 */
export function CityCatalog({ step }: SlideProps) {
  const lang = useLang();
  const c = S.city.catalog;
  const openLightbox = useLightbox();

  const cw = 620;
  const ch = Math.round(cw / 2.847);

  return (
    <Slide theme="dark" grid={false}>
      <Backdrop src={R("009")} theme="dark" scrim="full" opacity={0.3} />
      <Mesh variant="night" />
      <Glow x={1500} y={560} r={520} color="62,214,106" opacity={0.16} />

      <At x={M.left} y={M.top + 30} w={620} z={20}>
        <Reveal at={0} step={step} y={18}>
          <Kicker theme="dark" color={V.leaf}>
            {t(S.brand.project, lang)}
          </Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={26} delay={0.06} style={{ marginTop: 20 }}>
          <Title theme="dark" size={104} style={{ letterSpacing: "-0.028em" }}>
            {t(c.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.18} style={{ marginTop: 30 }}>
          <Rule w={156} color={V.gold} thickness={4} delay={0.24} />
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 32 }}>
          <Body theme="dark" size={31} style={{ maxWidth: 560 }}>
            {t(c.body, lang)}
          </Body>
        </Reveal>
      </At>

      {/* The rail. Rotated once as a group so the five cards share one axis;
          each card only carries its own offset along it. */}
      <div
        style={{
          position: "absolute",
          left: 760,
          top: 104,
          width: 1200,
          height: 880,
          transform: "rotate(-9deg)",
          transformOrigin: "0% 50%",
          pointerEvents: "none",
        }}
      >
        {CATALOG_PAGES.map((p, i) => (
          <div
            key={p}
            style={{
              position: "absolute",
              left: i * 58,
              top: i * 152,
              width: cw,
              height: ch,
              pointerEvents: "auto",
            }}
          >
            <Stagger at={1} step={step} i={i} y={0} x={64} gap={0.07}>
              <div
                style={{
                  width: cw,
                  height: ch,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: V.paper,
                  boxShadow: "0 26px 64px rgba(0,0,0,0.46)",
                  border: "1px solid rgba(244,251,244,0.12)",
                  cursor: "zoom-in",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox({ kind: "image", src: `/media/catalog/page-${p}.webp` });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/media/catalog/page-${p}.webp`}
                  alt=""
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0";
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </Stagger>
          </div>
        ))}
      </div>

      {/* Page count as an endless band, low and quiet, under the rail. */}
      <At x={0} y={856} w={STAGE_W} z={20}>
        <Reveal at={1} step={step} delay={0.3}>
          <Marquee dur={38} gap={64} style={{ width: STAGE_W }}>
            <span
              className="tnum font-mono"
              style={{
                fontSize: 22,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(62,214,106,0.72)",
              }}
            >
              {`${N.project.catalogPages} ${
                lang === "latn" ? "sahifalik katalog" : "саҳифалик каталог"
              }`}
            </span>
            <span style={{ fontSize: 22, color: "rgba(62,214,106,0.4)" }}>·</span>
          </Marquee>
        </Reveal>
      </At>
    </Slide>
  );
}

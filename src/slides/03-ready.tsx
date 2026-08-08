"use client";

import { motion } from "motion/react";
import { EASE, type SlideProps } from "@/deck/types";
import { Reveal, Stagger } from "@/deck/Reveal";
import { VideoSlot } from "@/deck/VideoPool";
import { VideoExpand, useLightbox } from "@/deck/Lightbox";
import { useLang } from "@/content/lang";
import { billions, t, usd } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import { At, Body, Caption, Chip, Kicker, M, Rule, Slide, Stat, Title } from "@/ui/layout";
import { Card, CountUp, Glow, Mesh, V } from "@/ui/vivid";
import { DebtStory } from "@/ui/diagrams/DebtStory";
import { ChapterOpener } from "./common";

/**
 * Chapter 3 — where the 9 700 $ apartments came from.
 *
 * The honesty of this chapter is the reason the offer at the end is believable,
 * so it is carried by one big diagram and almost no prose: a question, a number
 * in gold, a debt beat in ember, and a recovery in emerald.
 */

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

/**
 * The set-piece. `DebtStory` owns 1600×500 across the middle of the stage and
 * the slide gives it everything: a question above, one gold figure to the
 * right, and a four-beat mono legend underneath that names the act the diagram
 * is currently playing.
 *
 * Steps: 0 the question · 1 the plan draws · 2 the 100 buyers drain and the
 * 220 mlrd lands · 3 the construction bar overruns its ghost · 4 it comes back.
 */
export function ReadyDebt({ step }: SlideProps) {
  const lang = useLang();
  const d = S.ready.debt;

  /** Beat name per step. Ember for the failure, emerald for the return. */
  const beats = [
    { at: 1, label: d.planTitle, color: V.ink },
    { at: 2, label: d.realTitle, color: V.ember },
    { at: 3, label: d.stretchTitle, color: V.ember },
    { at: 4, label: d.recoverTitle, color: V.emerald },
  ];

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={1500} y={210} r={420} color="240,178,62" opacity={0.16} />
      <Glow x={300} y={880} r={420} color="0,168,104" opacity={0.12} />

      <At x={M.left} y={108} w={1020}>
        <Reveal at={0} step={step} y={20}>
          {/* 46, not 58: the Cyrillic of this question is ~14% wider and has to
              hold to two lines inside 1020 with the gold figure beside it. */}
          <Title size={46} style={{ letterSpacing: "-0.024em", maxWidth: 1020 }}>
            {t(d.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 20 }}>
          <Body size={26} style={{ maxWidth: 860 }}>
            {t(d.body, lang)}
          </Body>
        </Reveal>
      </At>

      {/* The one figure the chapter says out loud. Gold, because it is money —
          the default itself is the only thing on this slide allowed to be ember. */}
      <At x={1300} y={112} w={460}>
        <Reveal at={2} step={step} y={22}>
          <Stat
            align="right"
            color={V.gold}
            size={74}
            labelSize={22}
            value={
              <CountUp
                to={N.debt.totalSoum}
                on={step >= 2}
                duration={1.1}
                format={(v) => billions(v, lang)}
              />
            }
            label={d.debtLabel}
          />
        </Reveal>
      </At>

      <At x={M.left} y={332} w={1600}>
        <div style={{ height: 500 }}>
          <DebtStory step={step} />
        </div>
      </At>

      {/* Four beats, four words. The active one is lit; the ones behind it stay
          on so the audience can see how far into the story they are. */}
      <At x={M.left} y={866} w={1600}>
        <div style={{ display: "flex", gap: 28 }}>
          {beats.map((b, i) => {
            const on = step >= b.at;
            const current = step === b.at;
            return (
              <div key={i} style={{ flex: 1 }}>
                <motion.div
                  initial={false}
                  animate={{ opacity: current ? 1 : 0.26 }}
                  transition={{ duration: 0.44, ease: EASE }}
                >
                  <Rule w={296} thickness={4} color={b.color} on={on} delay={on ? 0.06 : 0} />
                </motion.div>
                <Reveal at={b.at} step={step} y={12} delay={0.12}>
                  <div
                    className="font-mono"
                    style={{
                      marginTop: 16,
                      fontSize: 19,
                      letterSpacing: "0.13em",
                      textTransform: "uppercase",
                      color: current ? b.color : V.ash,
                    }}
                  >
                    {t(b.label, lang)}
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </At>
    </Slide>
  );
}

// ── Purchase process ─────────────────────────────────────────────────────────

/**
 * Five numbered cards on one rail. The rail's emerald fill is the progress
 * through the purchase, so the row reads as a single mechanism rather than as
 * five unrelated tiles.
 *
 * Steps: 0 the framing · 1–5 one card each, staggered.
 */
export function ReadyProcess({ step }: SlideProps) {
  const lang = useLang();
  const p = S.ready.process;

  const CARD_W = 296;
  const GAP = 30;
  /** 320 is the tallest Cyrillic card plus its bottom padding — card 02 runs to
   *  288. Anything taller opens a band of dead white under every caption. */
  const CARD_H = 320;
  const RAIL_Y = 416;
  const ROW_Y = 450;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={1620} y={760} r={460} color="0,168,104" opacity={0.12} />

      <At x={M.left} y={112} w={820}>
        <Reveal at={0} step={step} y={26}>
          <Title size={58} style={{ letterSpacing: "-0.026em" }}>
            {t(p.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.14} style={{ marginTop: 30 }}>
          <Rule w={148} thickness={4} color={V.emerald} delay={0.2} />
        </Reveal>
      </At>

      <At x={1020} y={140} w={740}>
        <Reveal at={0} step={step} delay={0.16}>
          <Body size={26} style={{ maxWidth: 740 }}>
            {t(p.body, lang)}
          </Body>
        </Reveal>
      </At>

      {/* The rail. Its fill is scaleX only — never a width. */}
      <At x={M.left} y={RAIL_Y} w={1600}>
        <div
          style={{
            position: "relative",
            height: 4,
            borderRadius: 4,
            background: "rgba(10,31,20,0.10)",
          }}
        >
          <motion.div
            initial={false}
            animate={{ scaleX: Math.min(1, Math.max(0, step / p.steps.length)) }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 4,
              background: V.emerald,
              transformOrigin: "left center",
            }}
          />
        </div>
      </At>

      <At x={M.left} y={ROW_Y} w={1600}>
        <div style={{ display: "flex", gap: GAP }}>
          {p.steps.map((s, i) => {
            const current = step === i + 1;
            return (
              <Stagger key={i} at={i + 1} step={step} i={0} y={26} style={{ width: CARD_W }}>
                <motion.div
                  initial={false}
                  animate={{ y: current ? -14 : 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <Card
                    w={CARD_W}
                    h={CARD_H}
                    radius={26}
                    style={{ padding: "28px 28px", boxSizing: "border-box" }}
                  >
                    <div
                      className="font-mono tnum"
                      style={{
                        fontSize: 46,
                        lineHeight: 1,
                        fontWeight: 500,
                        letterSpacing: "-0.02em",
                        color: current ? V.emerald : V.ash,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    <Rule
                      w={56}
                      thickness={4}
                      color={current ? V.emerald : "rgba(10,31,20,0.14)"}
                      on={step >= i + 1}
                      delay={0.14}
                      style={{ marginTop: 22 }}
                    />

                    <div
                      style={{
                        marginTop: 24,
                        fontSize: 27,
                        fontWeight: 500,
                        lineHeight: 1.2,
                        letterSpacing: "-0.012em",
                        color: V.ink,
                      }}
                    >
                      {t(s.t, lang)}
                    </div>

                    <Caption size={20} style={{ marginTop: 14 }}>
                      {t(s.d, lang)}
                    </Caption>
                  </Card>
                </motion.div>
              </Stagger>
            );
          })}
        </div>
      </At>
    </Slide>
  );
}

// ── Studio apartment: portrait tour + floor plan as an object ─────────────────

/** The floor plan card, staged in 3D. */
const PLAN_X = 856;
const PLAN_Y = 112;
const PLAN_W = 412;
/** Source is 495×933, so at PLAN_W the drawing is 776 tall — less the 36 px
 *  catalogue sheet number across the top, which is not part of the plan. */
const PLAN_CROP = 36;
const PLAN_H = 740;

/** The tour clip keeps the id and the exact slot the pool already knows. */
const VID_X = 1352;
const VID_Y = 108;
const VID_W = 408;
const VID_H = 726;
/** …inside a device card that runs on below it to carry the caption. */
const DEV_H = 822;

/**
 * Steps: 0 the format and the plan, which arrives tilted back in 3D · 1 the
 * walkthrough runs in its device card · 2 the plan settles flat, one sheen
 * sweeps it, and the area and price chips pop.
 *
 * Everything animated is transform or opacity: the "lift" is scale and
 * translate, the shadows are static, and the sheen is a gradient element
 * translated inside an overflow-hidden card — never a background-position.
 */
export function ReadyStudio({ step }: SlideProps) {
  const lang = useLang();
  const s = S.ready.studio;
  const openLightbox = useLightbox();

  const flat = step >= 2;

  return (
    <Slide grid={false}>
      <Mesh variant="paper" />
      <Glow x={420} y={840} r={420} color="0,168,104" opacity={0.14} />

      {/* ── the walkthrough, as a device ──────────────────────────────────── */}
      <Card x={VID_X} y={VID_Y} w={VID_W} h={DEV_H} radius={30} z={6} />

      <VideoSlot
        id="studio-tour"
        x={VID_X}
        y={VID_Y}
        w={VID_W}
        h={VID_H}
        radius={30}
        playing={step >= 1}
        loop
        muted
        fit="cover"
        z={8}
      />
      {step >= 1 && (
        <VideoExpand id="studio-tour" x={VID_X} y={VID_Y} w={VID_W} h={VID_H} radius={30} />
      )}

      <At x={VID_X} y={VID_Y + VID_H + 30} w={VID_W} z={20}>
        <Reveal at={1} step={step} y={12}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Chip color={V.emerald} size={18}>
              {t(s.tourLabel, lang)}
            </Chip>
          </div>
        </Reveal>
      </At>

      {/* ── the plan, as an object ────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PLAN_W + PLAN_X + 200,
          height: 1080,
          perspective: 1200,
          perspectiveOrigin: "58% 44%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <motion.div
          initial={false}
          animate={{
            rotateX: flat ? 0 : 18,
            rotateY: flat ? 0 : -9,
            y: flat ? 0 : 18,
            scale: flat ? 1 : 0.95,
            opacity: 1,
          }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{
            position: "absolute",
            left: PLAN_X,
            top: PLAN_Y,
            width: PLAN_W,
            height: PLAN_H,
            transformStyle: "preserve-3d",
            pointerEvents: "auto",
          }}
        >
          {/* Pre-drawn contact shadow — a static element scaled by its parent,
              never an animated filter. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              bottom: -30,
              height: 54,
              borderRadius: "50%",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(10,31,20,0.20) 0%, rgba(10,31,20,0) 70%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 26,
              background: V.paper,
              border: "1px solid rgba(10,31,20,0.09)",
              boxShadow: "0 30px 72px rgba(10,31,20,0.16)",
              overflow: "hidden",
              cursor: "zoom-in",
            }}
            onClick={(e) => {
              e.stopPropagation();
              openLightbox({ kind: "image", src: "/media/plans/studio-21-23.webp", bg: "paper" });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/plans/studio-21-23.webp"
              alt=""
              draggable={false}
              onError={(e) => {
                e.currentTarget.style.opacity = "0";
              }}
              style={{
                position: "absolute",
                left: 0,
                top: -PLAN_CROP,
                width: PLAN_W,
                height: "auto",
                display: "block",
                mixBlendMode: "multiply",
              }}
            />

            {/* One sheen, once, when the card settles. Translated, not repainted. */}
            <motion.div
              aria-hidden
              initial={false}
              animate={{ x: flat ? PLAN_W + 200 : -240 }}
              transition={{ duration: flat ? 1.05 : 0, ease: EASE, delay: flat ? 0.42 : 0 }}
              style={{
                position: "absolute",
                left: 0,
                top: -60,
                width: 170,
                height: PLAN_H + 120,
                background:
                  "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(0,168,104,0.18) 46%, rgba(255,255,255,0) 100%)",
              }}
            />
          </div>

          {/* Chips ride the card's lower edge, so they travel with it in 3D. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -22,
              display: "flex",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Stagger at={2} step={step} i={0} y={12}>
              <Chip filled color={V.emerald} size={19}>
                <span className="tnum">
                  <CountUp to={N.studio.areaFrom} on={flat} duration={0.7} format={String} />
                  {"–"}
                  <CountUp to={N.studio.areaTo} on={flat} duration={0.7} format={String} />
                  {" m²"}
                </span>
              </Chip>
            </Stagger>
            <Stagger at={2} step={step} i={1} y={12}>
              <Chip color={V.ash} size={19}>
                {t(s.planLabel, lang)}
              </Chip>
            </Stagger>
          </div>
        </motion.div>
      </div>

      {/* ── the argument ─────────────────────────────────────────────────── */}
      <At x={M.left} y={M.top + 40} w={620} z={10}>
        <Reveal at={0} step={step} y={18}>
          <Kicker color={V.emerald}>{t(s.areaLabel, lang)}</Kicker>
        </Reveal>

        <Reveal at={0} step={step} y={24} delay={0.06} style={{ marginTop: 22 }}>
          <Title size={54} style={{ letterSpacing: "-0.028em" }}>
            {t(s.title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 32 }}>
          <Rule w={148} thickness={4} color={V.gold} delay={0.26} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 34 }}>
          <Body size={27} style={{ maxWidth: 600 }}>
            {t(s.body, lang)}
          </Body>
        </Reveal>
      </At>

      {/* The price is the chapter's whole point, so it lands last and alone. */}
      <At x={M.left} y={716} w={620} z={10}>
        <Reveal at={2} step={step} y={24} delay={0.14}>
          <div
            className="tnum font-display"
            style={{
              fontSize: 96,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: "-0.035em",
              color: V.gold,
            }}
          >
            {usd(N.studio.tiers[0].usd)}
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

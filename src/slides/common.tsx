"use client";

import { motion } from "motion/react";
import { EASE, STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t, type L } from "@/content/i18n";
import { At, Backdrop, Body, Caption, Kicker, M, Rule, Slide, Title, tone } from "@/ui/layout";
import { SketchLine } from "@/ui/sketch";
import { ExpandCorner } from "@/deck/Lightbox";

/**
 * Slide shapes used more than once. Anything that appears exactly once lives in
 * its own chapter file — a "generic slide" abstraction with fifteen props would
 * be harder to read than the fifteen slides it replaces.
 */

/**
 * Chapter title card. The number is set enormous and cropped by the margin so
 * it reads as a printed section divider rather than as a heading.
 */
export function ChapterOpener({
  n,
  title,
  lead,
  theme = "paper",
  step,
  image,
}: {
  n: number;
  title: L;
  lead?: L;
  theme?: "paper" | "dark";
  step: number;
  image?: string;
}) {
  const lang = useLang();
  const accent = tone.ACCENT[theme];

  return (
    <Slide theme={theme} grid={false}>
      {image && <Backdrop src={image} theme={theme} scrim="left" opacity={theme === "dark" ? 0.5 : 0.35} />}
      {image && <ExpandCorner item={{ kind: "image", src: image }} light={theme === "dark"} />}

      {/* The giant numeral, bled off the right edge. */}
      <motion.div
        data-bleed
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="tnum font-display"
        style={{
          position: "absolute",
          right: -46,
          top: 96,
          fontSize: 620,
          lineHeight: 0.78,
          fontWeight: 600,
          letterSpacing: "-0.06em",
          color: theme === "dark" ? "rgba(244,241,234,0.07)" : "rgba(43,42,40,0.06)",
          userSelect: "none",
        }}
      >
        {String(n).padStart(2, "0")}
      </motion.div>

      <At x={M.left} y={392} w={1180}>
        <Reveal at={0} step={step} y={22}>
          <Kicker theme={theme} color={accent}>
            {`Boʻlim ${String(n).padStart(2, "0")}`}
          </Kicker>
        </Reveal>

        <Reveal at={0} step={step} y={26} delay={0.08} style={{ marginTop: 22 }}>
          <Title theme={theme} size={132} style={{ letterSpacing: "-0.03em" }}>
            {t(title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.18} style={{ marginTop: 34 }}>
          <Rule w={168} color={accent} delay={0.24} />
        </Reveal>

        {lead && (
          <Reveal at={0} step={step} delay={0.26} style={{ marginTop: 30 }}>
            <Body theme={theme} size={34} style={{ maxWidth: 840 }}>
              {t(lead, lang)}
            </Body>
          </Reveal>
        )}
      </At>
    </Slide>
  );
}

/**
 * Full-bleed render with a title block over it. Step 0 is the image alone —
 * the presenter gets a beat to let the picture land before the words arrive.
 */
export function ShowcaseSlide({
  step,
  image,
  title,
  caption,
  body,
  position = "center",
  theme = "dark",
}: SlideProps & {
  image: string;
  title: L;
  caption?: L;
  body?: L;
  position?: string;
  theme?: "paper" | "dark";
}) {
  const lang = useLang();
  return (
    <Slide theme={theme} grid={false}>
      <Backdrop src={image} theme={theme} scrim="bottom" position={position} />
      <ExpandCorner item={{ kind: "image", src: image }} light={theme === "dark"} />

      {/* Bottom-anchored: the block grows upward, so a body that wraps to three
          lines in Cyrillic where it took two in Latin can't push the last line
          into the band the progress rail owns. */}
      <At
        x={M.left}
        y={M.top}
        w={1180}
        style={{
          height: M.bottom - M.top,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          // Puts the title's baseline where the old top-anchored offset put it,
          // so the seven bodyless showcase slides don't shift.
          paddingBottom: 95,
          // Inherited by every glyph in the block. The kicker is the weak link
          // — small, letterspaced, leaf green, and sitting at the top of the
          // block where the scrim has already thinned out over white facade.
          textShadow: theme === "dark" ? "0 2px 20px rgba(20,19,18,0.72)" : "none",
        }}
      >
        <Reveal at={1} step={step} y={24}>
          {caption && (
            <Kicker theme={theme} color={tone.ACCENT[theme]}>
              {t(caption, lang)}
            </Kicker>
          )}
          <Title theme={theme} size={82} style={{ marginTop: caption ? 18 : 0 }}>
            {t(title, lang)}
          </Title>
          {body && (
            <Body theme={theme} size={30} style={{ marginTop: 20, maxWidth: 880 }}>
              {t(body, lang)}
            </Body>
          )}
        </Reveal>
      </At>
    </Slide>
  );
}

/** Title on the left, everything else on the right. The deck's default page. */
export function SplitSlide({
  step,
  title,
  kicker,
  body,
  theme = "paper",
  children,
  colX = 900,
  colW = 860,
}: SlideProps & {
  title: L;
  kicker?: L;
  body?: L;
  theme?: "paper" | "dark";
  children?: React.ReactNode;
  colX?: number;
  colW?: number;
}) {
  const lang = useLang();
  return (
    <Slide theme={theme}>
      <At x={M.left} y={M.top + 44} w={640}>
        {kicker && (
          <Reveal at={0} step={step} y={16}>
            <Kicker theme={theme} color={tone.ACCENT[theme]}>
              {t(kicker, lang)}
            </Kicker>
          </Reveal>
        )}
        <Reveal at={0} step={step} y={20} delay={0.05} style={{ marginTop: kicker ? 22 : 0 }}>
          <Title theme={theme} size={72}>
            {t(title, lang)}
          </Title>
        </Reveal>
        {body && (
          <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 28 }}>
            <Body theme={theme}>{t(body, lang)}</Body>
          </Reveal>
        )}
      </At>

      <At x={colX} y={M.top + 44} w={colW}>
        {children}
      </At>

      {/* The spine: a pencil line between the argument and its evidence. */}
      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchLine
          x1={colX - 78}
          y1={M.top + 30}
          x2={colX - 78}
          y2={M.bottom - 60}
          seed={17}
          amp={1.6}
          on={step >= 1}
          stroke={theme === "dark" ? "rgba(244,241,234,0.22)" : "rgba(43,42,40,0.18)"}
          width={1.5}
          duration={0.8}
        />
      </svg>
    </Slide>
  );
}

/** Centred statement. Used for the chapter closes and the final thank-you. */
export function StatementSlide({
  step,
  kicker,
  title,
  body,
  theme = "paper",
  accentTitle,
}: SlideProps & {
  kicker?: L;
  title: L;
  body?: L;
  accentTitle?: L;
  theme?: "paper" | "dark";
}) {
  const lang = useLang();
  const accent = tone.ACCENT[theme];
  return (
    <Slide theme={theme} grid={false}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          padding: `0 ${M.left}px`,
        }}
      >
        <div style={{ maxWidth: 1320, textAlign: "center" }}>
          {kicker && (
            <Reveal at={0} step={step} y={14}>
              <Caption theme={theme} align="center">
                {t(kicker, lang)}
              </Caption>
            </Reveal>
          )}
          <Reveal at={0} step={step} y={22} delay={0.06} style={{ marginTop: kicker ? 26 : 0 }}>
            <Title theme={theme} size={92} align="center">
              {t(title, lang)}
            </Title>
          </Reveal>
          {accentTitle && (
            <Reveal at={1} step={step} y={22} style={{ marginTop: 22 }}>
              <Title theme={theme} size={92} align="center" color={accent}>
                {t(accentTitle, lang)}
              </Title>
            </Reveal>
          )}
          {body && (
            <Reveal at={accentTitle ? 2 : 1} step={step} style={{ marginTop: 40 }}>
              <Body theme={theme} size={31} align="center" style={{ maxWidth: 1020, margin: "0 auto" }}>
                {t(body, lang)}
              </Body>
            </Reveal>
          )}
        </div>
      </div>
    </Slide>
  );
}

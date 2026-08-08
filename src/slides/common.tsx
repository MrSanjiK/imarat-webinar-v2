"use client";

import { motion } from "motion/react";
import { EASE, type SlideProps } from "@/deck/types";
import { Reveal } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t, type L } from "@/content/i18n";
import { At, Backdrop, Body, Caption, Chip, Kicker, M, Rule, Slide, Title, tone } from "@/ui/layout";
import { Glow, Mesh, Wipe } from "@/ui/vivid";
import { ExpandCorner } from "@/deck/Lightbox";

/**
 * Slide shapes used more than once. Anything that appears exactly once lives in
 * its own chapter file — a "generic slide" abstraction with fifteen props would
 * be harder to read than the fifteen slides it replaces.
 */

/**
 * Chapter title card. A huge emerald-tinted numeral bleeds off the bottom-left
 * corner; when the chapter has an image it arrives as a rounded card on the
 * right rather than a full-bleed backdrop, so the type always sits on clean
 * paper (or clean night) and the palette stays loud.
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
  const dark = theme === "dark";
  const accent = tone.ACCENT[theme];

  return (
    <Slide theme={theme} grid={false}>
      <Mesh variant={dark ? "night" : "paper"} />

      {/* The giant numeral, cropped by the bottom-left corner. */}
      <motion.div
        data-bleed
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="tnum font-display"
        style={{
          position: "absolute",
          left: -34,
          bottom: -168,
          fontSize: 660,
          lineHeight: 0.8,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          color: dark ? "rgba(62,214,106,0.10)" : "rgba(0,168,104,0.10)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {String(n).padStart(2, "0")}
      </motion.div>

      {image ? (
        <>
          <Glow x={1440} y={520} r={430} color={dark ? "62,214,106" : "0,168,104"} opacity={dark ? 0.22 : 0.14} />
          <Wipe
            on
            dir="left"
            duration={0.85}
            style={{
              position: "absolute",
              left: 1104,
              top: 148,
              width: 656,
              height: 744,
              borderRadius: 40,
              overflow: "hidden",
              boxShadow: dark
                ? "0 32px 80px rgba(0,0,0,0.5)"
                : "0 32px 80px rgba(10,31,20,0.16)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              draggable={false}
              onError={(e) => {
                e.currentTarget.style.opacity = "0";
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 40,
                border: dark
                  ? "1px solid rgba(244,251,244,0.14)"
                  : "1px solid rgba(10,31,20,0.08)",
                pointerEvents: "none",
              }}
            />
          </Wipe>
          <ExpandCorner item={{ kind: "image", src: image }} light={dark} />
        </>
      ) : (
        <Glow x={1560} y={260} r={420} color={dark ? "62,214,106" : "0,168,104"} opacity={dark ? 0.16 : 0.1} />
      )}

      <At x={M.left} y={image ? 316 : 356} w={image ? 860 : 1400}>
        <Reveal at={0} step={step} y={18}>
          <Chip theme={theme} filled size={21}>
            {`Boʻlim ${String(n).padStart(2, "0")} / 06`}
          </Chip>
        </Reveal>

        <Reveal at={0} step={step} y={28} delay={0.08} style={{ marginTop: 34 }}>
          <Title theme={theme} size={image ? 116 : 152} style={{ letterSpacing: "-0.03em" }}>
            {t(title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 36 }}>
          <Rule w={148} thickness={4} color={accent} delay={0.26} />
        </Reveal>

        {lead && (
          <Reveal at={0} step={step} delay={0.28} style={{ marginTop: 30 }}>
            <Body theme={theme} size={33} style={{ maxWidth: 820 }}>
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
          textShadow: theme === "dark" ? "0 2px 20px rgba(5,24,16,0.72)" : "none",
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
  const dark = theme === "dark";
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
          <Title theme={theme} size={66}>
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

      {/* The spine between the argument and its evidence. */}
      <motion.div
        initial={false}
        animate={{ scaleY: step >= 1 ? 1 : 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{
          position: "absolute",
          left: colX - 78,
          top: M.top + 30,
          width: 2,
          height: M.bottom - 60 - (M.top + 30),
          background: dark ? "rgba(244,251,244,0.14)" : "rgba(10,31,20,0.1)",
          transformOrigin: "top center",
          borderRadius: 2,
        }}
      />
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
  const dark = theme === "dark";
  const accent = tone.ACCENT[theme];
  return (
    <Slide theme={theme} grid={false}>
      <Mesh variant={dark ? "night" : "paper"} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          padding: `0 ${M.left}px`,
        }}
      >
        <div style={{ maxWidth: 1360, textAlign: "center" }}>
          {kicker && (
            <Reveal at={0} step={step} y={14}>
              <Caption theme={theme} align="center">
                {t(kicker, lang)}
              </Caption>
            </Reveal>
          )}
          <Reveal at={0} step={step} y={22} delay={0.06} style={{ marginTop: kicker ? 26 : 0 }}>
            <Title theme={theme} size={88} align="center">
              {t(title, lang)}
            </Title>
          </Reveal>
          {accentTitle && (
            <Reveal at={1} step={step} y={22} style={{ marginTop: 22 }}>
              <Title theme={theme} size={88} align="center" color={accent}>
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

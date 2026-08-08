"use client";

import { motion } from "motion/react";
import { EASE, STAGE_H, STAGE_W } from "@/deck/types";
import { useLang } from "@/content/lang";
import { t, type L } from "@/content/i18n";

/**
 * Slide furniture.
 *
 * Everything is authored in literal stage pixels against a 1920×1080 canvas —
 * `Stage` scales the whole thing, so `vw`/`vh`/`rem` would only add a second,
 * conflicting notion of size. The margins here are the same 160 px the progress
 * rail uses, so text and chrome share one optical edge.
 */

export const M = {
  left: 160,
  right: 160,
  top: 112,
  /** Chrome starts at 988. Nothing may cross this line. */
  bottom: 940,
  get width() {
    return STAGE_W - this.left - this.right;
  },
} as const;

type Tone = "paper" | "dark";

const INK = { paper: "#0A1F14", dark: "#F4FBF4" };
const INK2 = { paper: "#35493D", dark: "#BFD9C6" };
const ASH = { paper: "#67806F", dark: "#7BA189" };
const ACCENT = { paper: "#00A868", dark: "#3ED66A" };

export const tone = { INK, INK2, ASH, ACCENT };

/** Root of every slide: grain, optional drafting grid, and the safe margins. */
export function Slide({
  children,
  theme = "paper",
  grid = true,
  className,
}: {
  children: React.ReactNode;
  theme?: Tone;
  grid?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${
        theme === "dark" ? "grain-dark" : "grain"
      } ${className ?? ""}`}
      style={{ width: STAGE_W, height: STAGE_H, color: INK[theme] }}
    >
      {grid && (
        <div
          className={theme === "dark" ? "dotgrid-light" : "dotgrid"}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 330,
            height: 264,
            opacity: 0.5,
            maskImage: "linear-gradient(135deg, #000 0%, transparent 78%)",
            WebkitMaskImage: "linear-gradient(135deg, #000 0%, transparent 78%)",
          }}
        />
      )}
      {children}
    </div>
  );
}

/** Absolutely positioned block, in stage pixels. Saves a style object per call. */
export function At({
  x = M.left,
  y = M.top,
  w,
  z,
  children,
  className,
  style,
}: {
  x?: number;
  y?: number;
  w?: number;
  z?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ position: "absolute", left: x, top: y, width: w, zIndex: z, ...style }}
    >
      {children}
    </div>
  );
}

// ── type scale ───────────────────────────────────────────────────────────────

type TextProps = {
  children: L | React.ReactNode;
  theme?: Tone;
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  align?: "left" | "center" | "right";
};

/** Renders an `L` through `t()`; passes anything else straight through. */
function useText(children: React.ReactNode | L): React.ReactNode {
  const lang = useLang();
  if (typeof children === "string") return t(children, lang);
  if (
    children &&
    typeof children === "object" &&
    "latn" in (children as Record<string, unknown>)
  ) {
    return t(children as L, lang);
  }
  return children as React.ReactNode;
}

/** Small mono label above a title. The deck's only all-caps voice. */
export function Kicker({
  children,
  theme = "paper",
  color,
  size = 20,
  className,
  style,
}: TextProps) {
  const body = useText(children);
  return (
    <div
      className={`font-mono ${className ?? ""}`}
      style={{
        fontSize: size,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: color ?? ASH[theme],
        ...style,
      }}
    >
      {body}
    </div>
  );
}

export function Title({
  children,
  theme = "paper",
  color,
  size = 88,
  className,
  style,
  align,
}: TextProps) {
  const body = useText(children);
  return (
    <h2
      className={`font-display ${className ?? ""}`}
      style={{
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: "-0.015em",
        fontWeight: 600,
        color: color ?? INK[theme],
        textAlign: align,
        margin: 0,
        textWrap: "balance",
        ...style,
      }}
    >
      {body}
    </h2>
  );
}

export function Lead({
  children,
  theme = "paper",
  color,
  size = 38,
  className,
  style,
  align,
}: TextProps) {
  const body = useText(children);
  return (
    <p
      className={className}
      style={{
        fontSize: size,
        lineHeight: 1.38,
        letterSpacing: "-0.008em",
        fontWeight: 300,
        color: color ?? INK2[theme],
        textAlign: align,
        margin: 0,
        textWrap: "pretty",
        ...style,
      }}
    >
      {body}
    </p>
  );
}

export function Body({
  children,
  theme = "paper",
  color,
  size = 29,
  className,
  style,
  align,
}: TextProps) {
  const body = useText(children);
  return (
    <p
      className={className}
      style={{
        fontSize: size,
        lineHeight: 1.52,
        fontWeight: 300,
        color: color ?? INK2[theme],
        textAlign: align,
        margin: 0,
        textWrap: "pretty",
        ...style,
      }}
    >
      {body}
    </p>
  );
}

export function Caption({
  children,
  theme = "paper",
  color,
  size = 22,
  className,
  style,
  align,
}: TextProps) {
  const body = useText(children);
  return (
    <div
      className={className}
      style={{
        fontSize: size,
        lineHeight: 1.4,
        fontWeight: 400,
        letterSpacing: "0.01em",
        color: color ?? ASH[theme],
        textAlign: align,
        ...style,
      }}
    >
      {body}
    </div>
  );
}

/** Marginalia in the handwriting face. */
export function Note({
  children,
  theme = "paper",
  color,
  size = 30,
  className,
  style,
  align,
}: TextProps) {
  const body = useText(children);
  return (
    <div
      className={`font-hand ${className ?? ""}`}
      style={{
        fontSize: size,
        lineHeight: 1.3,
        color: color ?? ASH[theme],
        textAlign: align,
        ...style,
      }}
    >
      {body}
    </div>
  );
}

/** Hairline rule. Draws itself from the left when `on`. */
export function Rule({
  w = 120,
  theme = "paper",
  color,
  thickness = 2,
  on = true,
  delay = 0,
  style,
}: {
  w?: number;
  theme?: Tone;
  color?: string;
  thickness?: number;
  on?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={false}
      animate={{ scaleX: on ? 1 : 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      style={{
        width: w,
        height: thickness,
        background: color ?? ACCENT[theme],
        transformOrigin: "left center",
        borderRadius: thickness,
        ...style,
      }}
    />
  );
}

// ── composites ───────────────────────────────────────────────────────────────

/** Number over label, used wherever a figure has to land hard. */
export function Stat({
  value,
  label,
  theme = "paper",
  color,
  size = 104,
  labelSize = 24,
  align = "left",
  style,
}: {
  value: React.ReactNode;
  label?: L;
  theme?: Tone;
  color?: string;
  size?: number;
  labelSize?: number;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
}) {
  const lang = useLang();
  return (
    <div style={{ textAlign: align, ...style }}>
      <div
        className="tnum font-display"
        style={{
          fontSize: size,
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: color ?? ACCENT[theme],
        }}
      >
        {value}
      </div>
      {label && (
        <div
          style={{
            marginTop: 12,
            fontSize: labelSize,
            fontWeight: 300,
            letterSpacing: "0.02em",
            color: ASH[theme],
          }}
        >
          {t(label, lang)}
        </div>
      )}
    </div>
  );
}

/** Bordered pill for badges like “Faqat bugun”. */
export function Chip({
  children,
  theme = "paper",
  color,
  size = 22,
  filled = false,
  style,
}: TextProps & { filled?: boolean }) {
  const body = useText(children);
  const c = color ?? ACCENT[theme];
  return (
    <span
      className="font-mono"
      style={{
        display: "inline-block",
        padding: "9px 18px 8px",
        borderRadius: 999,
        border: `1.5px solid ${c}`,
        background: filled ? c : "transparent",
        color: filled ? (theme === "dark" ? "#051810" : "#FFFFFF") : c,
        fontSize: size,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {body}
    </span>
  );
}

/** Numbered list item: hairline mono index, then title and detail. */
export function Item({
  n,
  title,
  detail,
  theme = "paper",
  color,
  titleSize = 34,
  detailSize = 24,
  style,
}: {
  n?: number | string;
  title: L;
  detail?: L;
  theme?: Tone;
  color?: string;
  titleSize?: number;
  detailSize?: number;
  style?: React.CSSProperties;
}) {
  const lang = useLang();
  return (
    <div style={{ display: "flex", gap: 22, alignItems: "baseline", ...style }}>
      {n !== undefined && (
        <span
          className="tnum font-mono"
          style={{
            fontSize: 20,
            color: color ?? ACCENT[theme],
            letterSpacing: "0.06em",
            flexShrink: 0,
            width: 34,
          }}
        >
          {typeof n === "number" ? String(n).padStart(2, "0") : n}
        </span>
      )}
      <div>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 400,
            lineHeight: 1.22,
            letterSpacing: "-0.01em",
            color: INK[theme],
          }}
        >
          {t(title, lang)}
        </div>
        {detail && (
          <div
            style={{
              marginTop: 7,
              fontSize: detailSize,
              fontWeight: 300,
              lineHeight: 1.4,
              color: ASH[theme],
            }}
          >
            {t(detail, lang)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Placeholder for a diagram that has not been built yet. Deliberately looks
 * like a drafting placeholder rather than an error, so the deck stays
 * presentable at every point during the build.
 */
export function DiagramSlot({
  name,
  x,
  y,
  w,
  h,
  theme = "paper",
}: {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  theme?: Tone;
}) {
  const c = theme === "dark" ? "rgba(244,251,244,0.26)" : "rgba(10,31,20,0.22)";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        border: `2px dashed ${c}`,
        borderRadius: 10,
        display: "grid",
        placeItems: "center",
      }}
    >
      <span
        className="font-mono"
        style={{ fontSize: 22, letterSpacing: "0.12em", color: c, textTransform: "uppercase" }}
      >
        {name}
      </span>
    </div>
  );
}

/** Full-bleed image with a paper-side vignette so text stays readable. */
export function Backdrop({
  src,
  theme = "dark",
  opacity = 1,
  scrim = "left",
  position = "center",
}: {
  src: string;
  theme?: Tone;
  opacity?: number;
  scrim?: "left" | "bottom" | "none" | "full";
  position?: string;
}) {
  const base = theme === "dark" ? "5,24,16" : "255,255,255";

  // The deck chrome — progress rail, chapter tag, slide counter — lives below
  // y=988, the full width of the stage. A purely horizontal ramp is at zero in
  // the bottom-right corner, so on a render that carries its own baked-in
  // wordmark there (every chapter banner does) the counter lands on top of it
  // and neither reads. Held near-solid across the chrome band, then a 130 px
  // fade — the title block bottoms out at ~67%, so it is never touched.
  const chromeGuard =
    `linear-gradient(0deg, rgba(${base},0.94) 0%, rgba(${base},0.88) 8%, rgba(${base},0.5) 14%, rgba(${base},0) 24%)`;

  const grad =
    scrim === "left"
      ? `${chromeGuard}, linear-gradient(90deg, rgba(${base},0.94) 0%, rgba(${base},0.82) 34%, rgba(${base},0.12) 72%, rgba(${base},0) 100%)`
      : scrim === "bottom"
        ? // Five stops rather than three: the title block reaches ~48% up the
          // frame in Cyrillic, and a two-stop ramp is already down to 0.16
          // there. The kicker sits at the very top of that block and is set in
          // leaf green over renders that are mostly white facade, so the ramp
          // has to still be near 0.5 at 43%.
          `linear-gradient(0deg, rgba(${base},0.95) 0%, rgba(${base},0.88) 18%, rgba(${base},0.7) 32%, rgba(${base},0.42) 46%, rgba(${base},0.14) 60%, rgba(${base},0) 76%)`
        : scrim === "full"
          ? `linear-gradient(90deg, rgba(${base},0.7) 0%, rgba(${base},0.55) 100%)`
          : "none";

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        // A missing render must not put a broken-image glyph on the shared
        // screen: the slide simply falls back to its own paper.
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
          opacity,
        }}
      />
      {scrim !== "none" && (
        <div style={{ position: "absolute", inset: 0, background: grad }} />
      )}
    </div>
  );
}

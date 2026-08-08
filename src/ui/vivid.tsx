"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { EASE } from "@/deck/types";

/**
 * V2 "IMARAT Vivid" kit. Every piece is a pure function of its `on` prop so
 * slides stay deterministic against `step`. Only transform / opacity /
 * clip-path are animated — all compositor properties.
 */

export const V = {
  paper: "#FFFFFF",
  paper2: "#F1F7EF",
  paper3: "#E2EEE1",
  ink: "#0A1F14",
  ink2: "#35493D",
  ash: "#67806F",
  forest: "#0B5C3F",
  emerald: "#00A868",
  leaf: "#3ED66A",
  lime: "#C9F16A",
  gold: "#F0B23E",
  ember: "#FF5A3C",
  night: "#051810",
  night2: "#0A2418",
} as const;

/** Masked line reveal: content rises out of an overflow-hidden window. */
export function Rise({
  on = true,
  delay = 0,
  duration = 0.72,
  distance = "112%",
  children,
  style,
  className,
}: {
  on?: boolean;
  delay?: number;
  duration?: number;
  distance?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={className} style={{ overflow: "hidden", ...style }}>
      <motion.div
        initial={false}
        animate={{ y: on ? "0%" : distance, opacity: on ? 1 : 0 }}
        transition={{ duration, ease: EASE, delay: on ? delay : 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Clip-path wipe. Chrome runs animated clip-path on the compositor. */
export function Wipe({
  on = true,
  delay = 0,
  duration = 0.8,
  dir = "up",
  children,
  style,
  className,
}: {
  on?: boolean;
  delay?: number;
  duration?: number;
  dir?: "up" | "down" | "left" | "right";
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const hidden =
    dir === "up"
      ? "inset(100% 0% 0% 0% round 32px)"
      : dir === "down"
        ? "inset(0% 0% 100% 0% round 32px)"
        : dir === "left"
          ? "inset(0% 100% 0% 0% round 32px)"
          : "inset(0% 0% 0% 100% round 32px)";
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{
        clipPath: on ? "inset(0% 0% 0% 0% round 0px)" : hidden,
        opacity: on ? 1 : 0,
      }}
      transition={{ duration, ease: EASE, delay: on ? delay : 0 }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/**
 * rAF number ticker. Mounting with `on` already true (arriving backward)
 * snaps to the final value — a build must not replay in reverse navigation.
 */
export function CountUp({
  to,
  on = true,
  duration = 1.15,
  delay = 0,
  format,
  className,
  style,
}: {
  to: number;
  on?: boolean;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [v, setV] = useState(() => (on ? to : 0));
  const wasOn = useRef(on);
  const raf = useRef(0);

  useEffect(() => {
    if (on === wasOn.current) return;
    wasOn.current = on;
    cancelAnimationFrame(raf.current);
    if (!on) {
      setV(0);
      return;
    }
    const t0 = performance.now() + delay * 1000;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / (duration * 1000)));
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * e));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [on, to, duration, delay]);

  const text = format ? format(v) : new Intl.NumberFormat("fr-FR").format(v);
  return (
    <span className={`tnum ${className ?? ""}`} style={style}>
      {text}
    </span>
  );
}

/** Static layered gradient wash. Never animated — paint once, composite free. */
export function Mesh({
  variant = "paper",
  style,
}: {
  variant?: "paper" | "night";
  style?: React.CSSProperties;
}) {
  const bg =
    variant === "paper"
      ? [
          "radial-gradient(46% 60% at 10% 12%, rgba(0,168,104,0.14), transparent 70%)",
          "radial-gradient(38% 52% at 92% 8%, rgba(201,241,106,0.20), transparent 70%)",
          "radial-gradient(52% 64% at 82% 92%, rgba(240,178,62,0.10), transparent 72%)",
        ].join(", ")
      : [
          "radial-gradient(52% 66% at 14% 16%, rgba(0,168,104,0.32), transparent 70%)",
          "radial-gradient(40% 54% at 88% 6%, rgba(62,214,106,0.14), transparent 70%)",
          "radial-gradient(56% 68% at 78% 96%, rgba(201,241,106,0.10), transparent 72%)",
        ].join(", ");
  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, background: bg, pointerEvents: "none", ...style }}
    />
  );
}

/** Pre-drawn glow spot — a radial gradient, never a blur filter. */
export function Glow({
  x,
  y,
  r = 320,
  color = "0,168,104",
  opacity = 0.3,
  z,
}: {
  x: number;
  y: number;
  r?: number;
  color?: string;
  opacity?: number;
  z?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${color},${opacity}) 0%, rgba(${color},0) 68%)`,
        pointerEvents: "none",
        zIndex: z,
      }}
    />
  );
}

/** Card surface: white on light, night-2 on dark. Static shadow only. */
export function Card({
  x,
  y,
  w,
  h,
  dark = false,
  radius = 28,
  z,
  children,
  style,
  className,
}: {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  dark?: boolean;
  radius?: number;
  z?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: x !== undefined || y !== undefined ? "absolute" : "relative",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: radius,
        background: dark ? V.night2 : V.paper,
        border: `1px solid ${dark ? "rgba(220,255,230,0.10)" : "rgba(10,31,20,0.08)"}`,
        boxShadow: dark
          ? "0 24px 64px rgba(0,0,0,0.42)"
          : "0 24px 64px rgba(10,31,20,0.10)",
        zIndex: z,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Endless horizontal band of repeated content. CSS-driven, transform only. */
export function Marquee({
  children,
  dur = 26,
  gap = 72,
  style,
  className,
}: {
  children: React.ReactNode;
  dur?: number;
  gap?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const copy = (hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      style={{ display: "inline-flex", alignItems: "center", gap, paddingRight: gap }}
    >
      {children}
    </div>
  );
  return (
    <div
      className={className}
      style={{ overflow: "hidden", whiteSpace: "nowrap", pointerEvents: "none", ...style }}
    >
      <div className="marquee-track" style={{ ["--marquee-dur" as string]: `${dur}s` }}>
        {copy(false)}
        {copy(true)}
      </div>
    </div>
  );
}

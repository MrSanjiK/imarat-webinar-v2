"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { EASE } from "@/deck/types";
import {
  hatch,
  wobbleEllipse,
  wobbleLine,
  wobblePoly,
  wobbleRect,
  type Pt,
} from "./geometry";

export * from "./geometry";

/**
 * Bridged to the v2 "IMARAT Vivid" palette so legacy diagrams re-skin
 * themselves while they wait for their vivid rewrite.
 */
export const C = {
  paper: "#FFFFFF",
  paper2: "#F1F7EF",
  ink: "#0A1F14",
  ink2: "#35493D",
  ash: "#67806F",
  forest: "#0B5C3F",
  leaf: "#3ED66A",
  gold: "#F0B23E",
  ember: "#FF5A3C",
} as const;

type DrawProps = {
  d: string;
  on?: boolean;
  stroke?: string;
  width?: number;
  delay?: number;
  duration?: number;
  opacity?: number;
  dash?: string;
  fill?: string;
  cap?: "butt" | "round";
  className?: string;
};

/** A stroke that draws itself: pathLength=1 + strokeDashoffset 1 → 0. */
export function SketchPath({
  d,
  on = true,
  stroke = C.ink,
  width = 2,
  delay = 0,
  duration = 0.7,
  opacity = 1,
  dash,
  fill = "none",
  cap = "round",
  className,
}: DrawProps) {
  return (
    <motion.path
      className={className}
      d={d}
      pathLength={1}
      fill={fill}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap={cap}
      strokeLinejoin="round"
      strokeDasharray={dash ?? 1}
      initial={false}
      animate={{
        strokeDashoffset: on ? 0 : 1,
        opacity: on ? opacity : 0,
      }}
      transition={{
        strokeDashoffset: { duration, ease: EASE, delay },
        opacity: { duration: 0.2, delay: on ? delay : 0 },
      }}
      style={{ strokeDasharray: dash ?? 1 }}
    />
  );
}

export function SketchLine(
  p: Omit<DrawProps, "d"> & { x1: number; y1: number; x2: number; y2: number; seed?: number; amp?: number },
) {
  const { x1, y1, x2, y2, seed = 1, amp = 1.5, ...rest } = p;
  const d = useMemo(() => wobbleLine(x1, y1, x2, y2, seed, amp), [x1, y1, x2, y2, seed, amp]);
  return <SketchPath d={d} {...rest} />;
}

export function SketchRect(
  p: Omit<DrawProps, "d"> & {
    x: number;
    y: number;
    w: number;
    h: number;
    seed?: number;
    amp?: number;
  },
) {
  const { x, y, w, h, seed = 1, amp = 1.4, ...rest } = p;
  const d = useMemo(() => wobbleRect(x, y, w, h, seed, amp), [x, y, w, h, seed, amp]);
  return <SketchPath d={d} {...rest} />;
}

export function SketchEllipse(
  p: Omit<DrawProps, "d"> & { cx: number; cy: number; rx: number; ry?: number; seed?: number },
) {
  const { cx, cy, rx, ry, seed = 1, ...rest } = p;
  const d = useMemo(() => wobbleEllipse(cx, cy, rx, ry ?? rx, seed), [cx, cy, rx, ry, seed]);
  return <SketchPath d={d} {...rest} />;
}

export function SketchPoly(
  p: Omit<DrawProps, "d"> & { pts: Pt[]; seed?: number; closed?: boolean; amp?: number },
) {
  const { pts, seed = 1, closed = false, amp = 1.3, ...rest } = p;
  const d = useMemo(() => wobblePoly(pts, seed, amp, closed), [pts, seed, amp, closed]);
  return <SketchPath d={d} {...rest} />;
}

/** Arrow: shaft plus two head strokes, drawn in that order. */
export function SketchArrow({
  x1,
  y1,
  x2,
  y2,
  seed = 1,
  head = 16,
  on = true,
  stroke = C.ink,
  width = 2,
  delay = 0,
  duration = 0.55,
  curve = 0,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  seed?: number;
  head?: number;
  on?: boolean;
  stroke?: string;
  width?: number;
  delay?: number;
  duration?: number;
  /** Perpendicular bow, in units. Positive bends left of the direction. */
  curve?: number;
}) {
  const { shaft, wings } = useMemo(() => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    let shaftD: string;
    if (curve) {
      const mx = (x1 + x2) / 2 - uy * curve;
      const my = (y1 + y2) / 2 + ux * curve;
      shaftD = wobblePoly([[x1, y1], [mx, my], [x2, y2]], seed, 1.1);
    } else {
      shaftD = wobbleLine(x1, y1, x2, y2, seed, 1.4);
    }

    const a = Math.atan2(dy, dx);
    const w1 = a + Math.PI - 0.42;
    const w2 = a + Math.PI + 0.42;
    const wingsD = [
      wobbleLine(x2, y2, x2 + Math.cos(w1) * head, y2 + Math.sin(w1) * head, seed + 11, 0.7),
      wobbleLine(x2, y2, x2 + Math.cos(w2) * head, y2 + Math.sin(w2) * head, seed + 12, 0.7),
    ].join(" ");

    return { shaft: shaftD, wings: wingsD };
  }, [x1, y1, x2, y2, seed, head, curve]);

  return (
    <>
      <SketchPath d={shaft} on={on} stroke={stroke} width={width} delay={delay} duration={duration} />
      <SketchPath
        d={wings}
        on={on}
        stroke={stroke}
        width={width}
        delay={delay + duration * 0.72}
        duration={0.2}
      />
    </>
  );
}

/**
 * 45° hatch fill, revealed by wiping a clip rect rather than by fading — a fade
 * looks like a bug at low bitrate, a wipe looks like a hand moving.
 */
export function Hatch({
  x,
  y,
  w,
  h,
  on = true,
  gap = 9,
  angle = 45,
  seed = 1,
  stroke = C.ink,
  width = 1.5,
  opacity = 0.5,
  delay = 0,
  duration = 0.6,
  direction = "left",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on?: boolean;
  gap?: number;
  angle?: number;
  seed?: number;
  stroke?: string;
  width?: number;
  opacity?: number;
  delay?: number;
  duration?: number;
  direction?: "left" | "up";
}) {
  const uid = useId().replace(/[:]/g, "");
  const d = useMemo(() => hatch(x, y, w, h, gap, angle, seed), [x, y, w, h, gap, angle, seed]);
  const clip = `hatch-${uid}`;
  const box = `hatchbox-${uid}`;

  return (
    <g>
      <defs>
        <clipPath id={box}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <clipPath id={clip}>
          {/* Slid into place, not scaled. Motion overwrites any inline
              transform-origin on SVG with `50% 50%` and sets
              transform-box: fill-box, so a scaleX wipe opens from the middle
              like a curtain instead of sweeping from the edge. Translation has
              no origin to get wrong: the rect starts one full box outside the
              region and arrives exactly on it. */}
          <motion.rect
            x={x}
            y={y}
            width={w}
            height={h}
            initial={false}
            animate={{
              translateX: direction === "left" && !on ? -w : 0,
              translateY: direction === "up" && !on ? h : 0,
            }}
            transition={{ duration, ease: EASE, delay }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${box})`}>
        <g clipPath={`url(#${clip})`}>
          <path d={d} fill="none" stroke={stroke} strokeWidth={width} opacity={opacity} />
        </g>
      </g>
    </g>
  );
}

/** Drafting dot grid, for slide corners and diagram backdrops. */
export function DotGrid({
  x,
  y,
  w,
  h,
  gap = 22,
  r = 1.1,
  color = "rgba(43,42,40,0.22)",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  gap?: number;
  r?: number;
  color?: string;
}) {
  const dots = useMemo(() => {
    const out: Pt[] = [];
    for (let iy = 0; iy <= h; iy += gap) for (let ix = 0; ix <= w; ix += gap) out.push([x + ix, y + iy]);
    return out;
  }, [x, y, w, h, gap]);

  return (
    <g>
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </g>
  );
}

/** Handwritten margin note with a leader line. */
export function Annotation({
  x,
  y,
  text,
  on = true,
  delay = 0,
  color = C.ash,
  size = 26,
  anchor = "start",
  leader,
  seed = 3,
}: {
  x: number;
  y: number;
  text: string;
  on?: boolean;
  delay?: number;
  color?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  leader?: { x: number; y: number };
  seed?: number;
}) {
  const d = useMemo(
    () => (leader ? wobbleLine(x, y, leader.x, leader.y, seed, 1.2) : ""),
    [x, y, leader, seed],
  );
  return (
    <g>
      {leader && (
        <SketchPath d={d} on={on} stroke={color} width={1.5} delay={delay} duration={0.35} opacity={0.7} />
      )}
      <motion.text
        x={x}
        y={y}
        fill={color}
        fontSize={size}
        textAnchor={anchor}
        className="font-hand"
        initial={false}
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : 6 }}
        transition={{ duration: 0.32, ease: EASE, delay: delay + (leader ? 0.24 : 0) }}
      >
        {text}
      </motion.text>
    </g>
  );
}

/** A number that counts rather than swaps. */
export function Counter({
  to,
  on = true,
  format,
  duration = 1.1,
  delay = 0,
  className,
  style,
}: {
  to: number;
  on?: boolean;
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [text, setText] = useState(() => (format ? format(0) : "0"));

  // `format` is nearly always an inline lambda. Held in a ref it stays out of
  // the effect deps, so a re-render cannot restart a count that is mid-flight.
  const fmt = useRef(format);
  useEffect(() => {
    fmt.current = format;
  });

  useEffect(() => {
    if (!on) {
      setText(fmt.current ? fmt.current(0) : "0");
      return;
    }
    const controls = animate(0, to, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => setText(fmt.current ? fmt.current(v) : String(Math.round(v))),
    });
    return () => controls.stop();
  }, [to, on, duration, delay]);

  return (
    <span className={`tnum ${className ?? ""}`} style={style}>
      {text}
    </span>
  );
}

/** SVG-space counter. */
export function CounterText({
  x,
  y,
  to,
  on = true,
  format,
  size = 72,
  color = C.ink,
  anchor = "start",
  className = "font-display",
  duration = 1.1,
  delay = 0,
}: {
  x: number;
  y: number;
  to: number;
  on?: boolean;
  format?: (n: number) => string;
  size?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const out = useTransform(spring, (v) => (format ? format(v) : String(Math.round(v))));

  useEffect(() => {
    if (!on) {
      mv.jump(0);
      spring.jump(0);
      return;
    }
    const id = setTimeout(() => mv.set(to), delay * 1000);
    return () => clearTimeout(id);
  }, [on, to, delay, mv, spring]);

  return (
    <motion.text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      textAnchor={anchor}
      className={`tnum ${className}`}
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {out}
    </motion.text>
  );
}

/** A rubber stamp landing on the page. */
export function Stamp({
  x,
  y,
  text,
  on = true,
  delay = 0,
  color = C.forest,
  size = 40,
  rotate = -4,
  padX = 26,
  padY = 14,
}: {
  x: number;
  y: number;
  text: string;
  on?: boolean;
  delay?: number;
  color?: string;
  size?: number;
  rotate?: number;
  padX?: number;
  padY?: number;
}) {
  const w = text.length * size * 0.62 + padX * 2;
  const h = size + padY * 2;
  const d = useMemo(() => wobbleRect(-w / 2, -h / 2, w, h, 91, 2.2, 4), [w, h]);

  return (
    <motion.g
      initial={false}
      animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 1.25, rotate: on ? rotate : rotate - 5 }}
      transition={{ duration: 0.42, ease: EASE, delay }}
      style={{ transformOrigin: `${x}px ${y}px` }}
      transform={`translate(${x} ${y})`}
    >
      <path d={d} fill="none" stroke={color} strokeWidth={3.5} opacity={0.95} />
      <text
        x={0}
        y={size * 0.36}
        fill={color}
        fontSize={size}
        textAnchor="middle"
        className="font-sans"
        style={{ fontWeight: 800, letterSpacing: "0.05em" }}
      >
        {text}
      </text>
    </motion.g>
  );
}

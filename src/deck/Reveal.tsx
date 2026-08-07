"use client";

import { motion, type Transition } from "motion/react";
import { DUR, EASE } from "./types";

type Props = {
  /** Step at which this content becomes visible. */
  at: number;
  step: number;
  /** Hide again once the deck advances past this step. */
  until?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Slide-in distance in stage pixels. 0 = fade only. */
  y?: number;
  x?: number;
  delay?: number;
  /** Keep the element in flow while hidden so nothing reflows on reveal. */
  keepSpace?: boolean;
};

const base: Transition = { duration: DUR, ease: EASE };

/**
 * Step-gated content. Only `opacity` and `transform` animate — animating
 * anything else drops frames once Zoom's encoder is also competing for the GPU.
 */
export function Reveal({
  at,
  step,
  until,
  children,
  className,
  style,
  y = 18,
  x = 0,
  delay = 0,
  keepSpace = true,
}: Props) {
  const on = step >= at && (until === undefined || step <= until);

  return (
    <motion.div
      className={className}
      style={{ ...style, pointerEvents: on ? undefined : "none" }}
      initial={false}
      animate={{
        opacity: on ? 1 : 0,
        y: on ? 0 : y,
        x: on ? 0 : x,
      }}
      transition={{ ...base, delay: on ? delay : 0 }}
      aria-hidden={!on}
    >
      {keepSpace || on ? children : null}
    </motion.div>
  );
}

/** Staggered sibling reveal: `<Stagger at={2} step={step} i={idx}>` */
export function Stagger({
  at,
  step,
  i,
  gap = 0.06,
  ...rest
}: Omit<Props, "delay"> & { i: number; gap?: number }) {
  return <Reveal {...rest} at={at} step={step} delay={i * gap} />;
}

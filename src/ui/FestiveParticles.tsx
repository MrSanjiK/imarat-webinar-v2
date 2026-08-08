"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { V } from "@/ui/vivid";

const COLORS = [
  V.gold, V.gold, V.gold,
  V.emerald, V.leaf,
  "#FF5E3A", "#9B59B6", "#3B82F6",
  V.gold, V.leaf,
];

type P = {
  x: number; initY: number; size: number; color: string;
  rect: boolean; delay: number; dur: number; rot: number; rDelay: number;
};

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export function FestiveParticles({
  on,
  count = 28,
  w = 1600,
  h = 800,
}: {
  on: boolean;
  count?: number;
  w?: number;
  h?: number;
}) {
  const particles = useMemo<P[]>(() => {
    const r = rng(77);
    return Array.from({ length: count }, (_, i) => ({
      x: r() * w,
      initY: -20 - r() * 60,
      size: 9 + r() * 13,
      color: COLORS[i % COLORS.length],
      rect: r() > 0.45,
      delay: r() * 1.2,
      dur: 1.4 + r() * 1.1,
      rot: r() * 360,
      rDelay: r() * 2.2,
    }));
  }, [count, w]);

  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 5 }}
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={
            on
              ? { y: [p.initY, h + 30], opacity: [0, 1, 0.9, 0], rotate: [p.rot, p.rot + 540] }
              : { y: p.initY, opacity: 0, rotate: p.rot }
          }
          transition={
            on
              ? {
                  y: { duration: p.dur, delay: p.delay, ease: "linear", repeat: Infinity, repeatDelay: p.rDelay },
                  opacity: { duration: p.dur, delay: p.delay, times: [0, 0.1, 0.7, 1], repeat: Infinity, repeatDelay: p.rDelay },
                  rotate: { duration: p.dur, delay: p.delay, ease: "linear", repeat: Infinity, repeatDelay: p.rDelay },
                }
              : { duration: 0.18 }
          }
          style={{
            position: "absolute",
            left: p.x,
            top: 0,
            width: p.size,
            height: p.rect ? p.size * 0.42 : p.size,
            borderRadius: p.rect ? 2 : "50%",
            background: p.color,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

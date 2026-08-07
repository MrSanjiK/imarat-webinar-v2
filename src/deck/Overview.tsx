"use client";

import { motion } from "motion/react";
import { EASE, type ChapterDef, type SlideDef } from "./types";
import { t, type Lang } from "@/content/i18n";

/**
 * Pressed with `G`. The "I have lost my place" escape hatch — the presenter
 * sees every slide at once and jumps straight to one. Titles only: live
 * thumbnails of 41 slides would cost more than they are worth mid-broadcast.
 */
export function Overview({
  deck,
  chapters,
  current,
  lang,
  onPick,
  onClose,
}: {
  deck: SlideDef[];
  chapters: ChapterDef[];
  current: number;
  lang: Lang;
  onPick: (i: number) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ background: "#f4f1ea" }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="grain absolute inset-0" />
      <div className="absolute" style={{ left: 96, top: 64, right: 96, bottom: 64 }}>
        <div
          className="font-mono text-ash"
          style={{ fontSize: 18, letterSpacing: "0.12em", marginBottom: 26 }}
        >
          G — UMUMIY KOʻRINISH
        </div>

        <div className="flex gap-[20px]">
          {chapters.map((c, idx) => {
            const to = idx + 1 < chapters.length ? chapters[idx + 1].from : deck.length;
            const items = deck.slice(c.from, to);
            return (
              <div key={c.n} style={{ flex: items.length + 2 }}>
                <div
                  className="font-display text-ink"
                  style={{ fontSize: 26, marginBottom: 12, lineHeight: 1.15 }}
                >
                  <span className="font-mono text-ash" style={{ fontSize: 16 }}>
                    {String(c.n).padStart(2, "0")}{" "}
                  </span>
                  {t(c.title, lang)}
                </div>
                <div className="flex flex-col gap-[6px]">
                  {items.map((s, k) => {
                    const gi = c.from + k;
                    const on = gi === current;
                    return (
                      <button
                        key={s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPick(gi);
                        }}
                        className="pointer-events-auto text-left"
                        style={{
                          padding: "9px 12px",
                          borderRadius: 6,
                          background: on ? "#0E5C43" : "rgba(43,42,40,0.045)",
                          color: on ? "#F4F1EA" : "#2B2A28",
                          fontSize: 17,
                          lineHeight: 1.25,
                          border: `1.5px solid ${on ? "#0E5C43" : "rgba(43,42,40,0.10)"}`,
                        }}
                      >
                        <span
                          className="tnum font-mono"
                          style={{ fontSize: 13, opacity: 0.55, marginRight: 8 }}
                        >
                          {String(gi + 1).padStart(2, "0")}
                        </span>
                        {t(s.label, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

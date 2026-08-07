"use client";

import { motion } from "motion/react";
import { EASE, STAGE_H, STAGE_W, type ChapterDef, type SlideDef } from "./types";
import { t, type Lang } from "@/content/i18n";

/**
 * Presenter furniture: a chapter-segmented progress rail, the slide counter and
 * the current chapter name. Deliberately quiet — it should read as a printed
 * page number, not as UI.
 */
export function Chrome({
  deck,
  chapters,
  i,
  step,
  dark,
  lang,
}: {
  deck: SlideDef[];
  chapters: ChapterDef[];
  i: number;
  step: number;
  dark: boolean;
  lang: Lang;
}) {
  const slide = deck[i];
  const chapter = chapters.find((c) => c.n === slide.chapter);
  const fg = dark ? "rgba(244,241,234,0.62)" : "rgba(43,42,40,0.5)";
  const track = dark ? "rgba(244,241,234,0.16)" : "rgba(43,42,40,0.14)";
  const fill = dark ? "#3ED66A" : "#0E5C43";

  const railW = STAGE_W - 320;
  const segments = chapters.map((c, idx) => {
    const from = c.from;
    const to = idx + 1 < chapters.length ? chapters[idx + 1].from : deck.length;
    return { ...c, from, to, count: to - from };
  });

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{ left: 0, top: 0, width: STAGE_W, height: STAGE_H }}
    >
      {/* chapter + counter */}
      <div
        className="absolute flex items-baseline gap-[18px] font-mono"
        style={{ left: 160, top: STAGE_H - 92, fontSize: 19, color: fg, letterSpacing: "0.08em" }}
      >
        {chapter && (
          <>
            <span>{String(chapter.n).padStart(2, "0")}</span>
            <span style={{ opacity: 0.55 }}>{t(chapter.title, lang)}</span>
          </>
        )}
      </div>

      <div
        className="tnum absolute font-mono"
        style={{
          right: 160,
          top: STAGE_H - 92,
          fontSize: 19,
          color: fg,
          letterSpacing: "0.08em",
        }}
      >
        {String(i + 1).padStart(2, "0")}
        <span style={{ opacity: 0.45 }}> / {deck.length}</span>
      </div>

      {/* rail */}
      <div
        className="absolute flex gap-[6px]"
        style={{ left: 160, top: STAGE_H - 56, width: railW, height: 3 }}
      >
        {segments.map((s) => {
          const done = i >= s.to;
          const inside = i >= s.from && i < s.to;
          const local = inside ? (i - s.from + 1) / s.count : done ? 1 : 0;
          return (
            <div
              key={s.n}
              className="relative overflow-hidden"
              style={{ flex: s.count, height: 3, background: track, borderRadius: 2 }}
            >
              <motion.div
                initial={false}
                animate={{ scaleX: local }}
                transition={{ duration: 0.5, ease: EASE }}
                style={{
                  height: "100%",
                  background: fill,
                  transformOrigin: "left center",
                  opacity: done ? 0.45 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* in-slide build dots */}
      {slide.steps > 1 && (
        <div
          className="absolute flex gap-[7px]"
          style={{ right: 160, top: STAGE_H - 57, alignItems: "center" }}
        >
          {Array.from({ length: slide.steps }, (_, n) => (
            <div
              key={n}
              style={{
                width: 5,
                height: 5,
                borderRadius: 99,
                background: n <= step ? fill : track,
                opacity: n <= step ? 1 : 1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import type { ComponentType } from "react";
import type { L } from "@/content/i18n";

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/** One easing, one duration, everywhere. Consistency reads as intent. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const DUR = 0.44;

export type Theme = "paper" | "dark";

export type SlideProps = { step: number; active: boolean };

export type SlideDef = {
  id: string;
  chapter: number; // 0 = cover / outside the six chapters
  /** Number of build states. `steps: 3` means step 0, 1, 2. */
  steps: number;
  theme: Theme;
  /** Shown in the overview grid and the progress rail tooltip. */
  label: L;
  /** Image URLs this slide paints. Decoded ahead of time so it never pops in. */
  assets?: string[];
  Component: ComponentType<SlideProps>;
};

export type ChapterDef = {
  n: number;
  title: L;
  /** Index of the first slide belonging to this chapter. */
  from: number;
};

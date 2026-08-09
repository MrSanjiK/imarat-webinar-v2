/**
 * Every video in the deck, declared once.
 *
 * The elements are mounted for the whole session and never unmounted — tearing
 * down a <video> destroys its decoder, and re-entering the slide then costs
 * 300–800 ms of black. On a live stream that reads as a crash.
 */
export type VideoId =
  | "archive-1966-a"
  | "archive-1966-b"
  | "archive-1966-c"
  | "turkey-long"
  | "turkey-short"
  | "vibro"
  | "studio-tour";

export type VideoDef = {
  id: VideoId;
  src: string;
  poster: string;
  w: number;
  h: number;
  /** Portrait clips are framed deliberately; they are never letterboxed. */
  portrait: boolean;
  /**
   * Untrimmed cut with audio, swapped in when the lightbox opens. The slide
   * source is silent and sometimes trimmed to a single moment — right for a
   * backdrop looping under type, wrong for a clip the audience asked to watch.
   * Always played from the start: expanding is a request to watch the film,
   * not to resume the fragment. Never precached: only fetched on expand.
   */
  full?: string;
};

const V = (id: VideoId, w: number, h: number, full?: string): VideoDef => ({
  id,
  src: `/media/video/${id}.mp4`,
  poster: `/media/video/${id}-poster.webp`,
  w,
  h,
  portrait: h > w,
  full: full ? `/media/video/${full}` : undefined,
});

// The three archive cuts are windows onto one 17-minute reel, so they share a
// full file — expanding any of them plays that reel from the top.
export const VIDEOS: VideoDef[] = [
  V("archive-1966-a", 960, 768, "archive-1966-full.mp4"),
  V("archive-1966-b", 960, 768, "archive-1966-full.mp4"),
  V("archive-1966-c", 960, 768, "archive-1966-full.mp4"),
  V("turkey-long", 1280, 720, "turkey-long-full.mp4"),
  V("turkey-short", 540, 960, "turkey-short-full.mp4"),
  V("vibro", 720, 1280, "vibro-full.mp4"),
  V("studio-tour", 720, 1280, "studio-tour-full.mp4"),
];

export const VIDEO_BY_ID = new Map(VIDEOS.map((v) => [v.id, v]));

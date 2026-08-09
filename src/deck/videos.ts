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
   * Never precached: only fetched on expand.
   */
  full?: string;
  /** Where the slide's cut begins inside `full`, so expanding resumes there. */
  fullStart?: number;
};

const V = (
  id: VideoId,
  w: number,
  h: number,
  full?: { src: string; start?: number },
): VideoDef => ({
  id,
  src: `/media/video/${id}.mp4`,
  poster: `/media/video/${id}-poster.webp`,
  w,
  h,
  portrait: h > w,
  full: full ? `/media/video/${full.src}` : undefined,
  fullStart: full?.start,
});

// The three archive cuts are windows onto one 17-minute reel, so they share a
// full file and each opens at its own timecode.
export const VIDEOS: VideoDef[] = [
  V("archive-1966-a", 960, 768, { src: "archive-1966-full.mp4", start: 22 }),
  V("archive-1966-b", 960, 768, { src: "archive-1966-full.mp4", start: 96 }),
  V("archive-1966-c", 960, 768, { src: "archive-1966-full.mp4", start: 900 }),
  V("turkey-long", 1280, 720, { src: "turkey-long-full.mp4" }),
  V("turkey-short", 540, 960, { src: "turkey-short-full.mp4" }),
  V("vibro", 720, 1280, { src: "vibro-full.mp4", start: 155.6 }),
  V("studio-tour", 720, 1280, { src: "studio-tour-full.mp4" }),
];

export const VIDEO_BY_ID = new Map(VIDEOS.map((v) => [v.id, v]));

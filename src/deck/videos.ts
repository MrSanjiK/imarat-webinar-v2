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
};

const V = (id: VideoId, w: number, h: number): VideoDef => ({
  id,
  src: `/media/video/${id}.mp4`,
  poster: `/media/video/${id}-poster.webp`,
  w,
  h,
  portrait: h > w,
});

export const VIDEOS: VideoDef[] = [
  V("archive-1966-a", 960, 768),
  V("archive-1966-b", 960, 768),
  V("archive-1966-c", 960, 768),
  V("turkey-long", 1280, 720),
  V("turkey-short", 540, 960),
  V("vibro", 720, 1280),
  V("studio-tour", 720, 1280),
];

export const VIDEO_BY_ID = new Map(VIDEOS.map((v) => [v.id, v]));

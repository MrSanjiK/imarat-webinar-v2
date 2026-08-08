"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { VIDEOS, type VideoId } from "./videos";
import { DUR, EASE } from "./types";

/**
 * Placement of one video on the 1920×1080 stage, in stage pixels.
 * Slides declare geometry explicitly rather than measuring, so a video never
 * jumps a frame late while a layout settles.
 */
export type Placement = {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  /** Play when true, pause when false. Position is preserved either way. */
  playing?: boolean;
  loop?: boolean;
  muted?: boolean;
  /** Seek here on mount and whenever the slide re-enters. */
  startAt?: number;
  /** Stage z-index. Slide chrome drawn over video should sit above this. */
  z?: number;
  fit?: "cover" | "contain";
  opacity?: number;
  /** Native transport controls + pointer events. Lightbox mode. */
  controls?: boolean;
};

type Ctx = {
  place: (id: VideoId, p: Placement | null) => void;
  seek: (id: VideoId, t: number) => void;
  el: (id: VideoId) => HTMLVideoElement | null;
  /** Current placement, so an override can hand the exact state back. */
  get: (id: VideoId) => Placement | null;
};

const PoolCtx = createContext<Ctx | null>(null);

export function VideoPool({ children }: { children: React.ReactNode }) {
  const [slots, setSlots] = useState<Partial<Record<VideoId, Placement>>>({});
  const els = useRef<Partial<Record<VideoId, HTMLVideoElement>>>({});

  // The elements are mounted for the whole session, but their sources are not
  // attached all at once: seven `preload="auto"` clips is 70 MB of parallel
  // download and the browser answers with ERR_INSUFFICIENT_RESOURCES. A source
  // is attached when its slide asks for it, or by the background warmer one
  // clip at a time — and once attached it is never detached.
  const [attached, setAttached] = useState<VideoId[]>([]);
  const attachedRef = useRef<Set<VideoId>>(new Set());

  const attach = useCallback((id: VideoId) => {
    if (attachedRef.current.has(id)) return;
    attachedRef.current.add(id);
    setAttached((a) => [...a, id]);
  }, []);

  const place = useCallback((id: VideoId, p: Placement | null) => {
    if (p) attach(id);
    setSlots((prev) => {
      if (p === null) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      const cur = prev[id];
      if (
        cur &&
        cur.x === p.x && cur.y === p.y && cur.w === p.w && cur.h === p.h &&
        cur.playing === p.playing && cur.muted === p.muted &&
        cur.opacity === p.opacity && cur.z === p.z && cur.radius === p.radius &&
        cur.fit === p.fit && cur.loop === p.loop && cur.controls === p.controls
      ) {
        return prev;
      }
      return { ...prev, [id]: p };
    });
  }, [attach]);

  const seek = useCallback((id: VideoId, t: number) => {
    const v = els.current[id];
    if (v && Number.isFinite(t)) v.currentTime = t;
  }, []);

  const el = useCallback((id: VideoId) => els.current[id] ?? null, []);

  // Mirror of `slots` with a stable identity, so `get` (and therefore the
  // context object) does not change on every placement — a `get` that closed
  // over state would re-run the lightbox's takeover effect in a loop.
  const slotsRef = useRef(slots);
  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);
  const get = useCallback((id: VideoId) => slotsRef.current[id] ?? null, []);

  // Drive playback from declared state. A rejected play() is normal when the
  // presenter has not interacted yet; it must never surface as an error.
  useEffect(() => {
    for (const v of VIDEOS) {
      const node = els.current[v.id];
      if (!node) continue;
      const slot = slots[v.id];
      if (slot?.playing) {
        node.muted = slot.muted ?? true;
        if (node.paused) void node.play().catch(() => {});
      } else if (!node.paused) {
        node.pause();
      }
    }
  }, [slots]);

  // Background warmer: attach the next unattached clip, wait for it to buffer
  // (readyState 3 = HAVE_FUTURE_DATA), then move on. By the second minute every
  // clip is resident and no slide can open on a spinner.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;

    const next = () => {
      if (stopped) return;
      const v = VIDEOS.find((x) => !attachedRef.current.has(x.id));
      if (!v) return;
      attach(v.id);

      const since = performance.now();
      poll = setInterval(() => {
        const node = els.current[v.id];
        // A stalled clip must not block the queue — give up after 20 s.
        if (stopped || !node || node.readyState >= 3 || performance.now() - since > 20_000) {
          clearInterval(poll);
          timer = setTimeout(next, 400);
        }
      }, 300);
    };

    timer = setTimeout(next, 2500);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(poll);
    };
  }, [attach]);

  const ctx = useMemo<Ctx>(() => ({ place, seek, el, get }), [place, seek, el, get]);

  return (
    <PoolCtx.Provider value={ctx}>
      {children}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {VIDEOS.map((v) => {
          const s = slots[v.id];
          const on = !!s;
          return (
            <div
              key={v.id}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: s?.w ?? v.w,
                height: s?.h ?? v.h,
                transform: `translate3d(${s?.x ?? 0}px, ${s?.y ?? 0}px, 0)`,
                borderRadius: s?.radius ?? 0,
                overflow: "hidden",
                opacity: on ? (s?.opacity ?? 1) : 0,
                zIndex: s?.z ?? 10,
                visibility: on ? "visible" : "hidden",
                transition: `opacity ${DUR}s cubic-bezier(${EASE.join(",")})`,
                backgroundColor: "#141312",
                willChange: "transform, opacity",
                pointerEvents: s?.controls ? "auto" : "none",
              }}
            >
              <video
                ref={(node) => {
                  if (node) els.current[v.id] = node;
                }}
                src={attached.includes(v.id) ? v.src : undefined}
                poster={v.poster}
                muted
                playsInline
                preload="auto"
                loop={s?.loop ?? true}
                controls={s?.controls ?? false}
                disablePictureInPicture
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: s?.fit ?? "cover",
                  display: "block",
                }}
              />
            </div>
          );
        })}
      </div>
    </PoolCtx.Provider>
  );
}

export function useVideoPool() {
  const ctx = useContext(PoolCtx);
  if (!ctx) throw new Error("useVideoPool must be used inside <VideoPool>");
  return ctx;
}

/**
 * Declarative placement from inside a slide. Renders nothing itself — the
 * element it controls lives in the pool and is only repositioned.
 */
export function VideoSlot({ id, ...p }: { id: VideoId } & Placement) {
  const { place } = useVideoPool();
  const { x, y, w, h, radius, playing, loop, muted, z, fit, opacity, startAt } = p;

  useEffect(() => {
    place(id, { x, y, w, h, radius, playing, loop, muted, z, fit, opacity, startAt });
    return () => place(id, null);
  }, [place, id, x, y, w, h, radius, playing, loop, muted, z, fit, opacity, startAt]);

  return null;
}

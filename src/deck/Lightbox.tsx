"use client";

import { createContext, useContext, useEffect } from "react";
import { motion } from "motion/react";
import { DUR, EASE, STAGE_H, STAGE_W } from "./types";
import { useVideoPool } from "./VideoPool";
import type { VideoId } from "./videos";
import { VIDEO_BY_ID } from "./videos";

/**
 * Fullscreen media inspection during the live webinar. The presenter clicks a
 * photo, plan or clip and it takes the whole stage; videos come back with
 * sound and native transport controls. Any navigation press closes it first —
 * a clicker press can never advance the deck behind an open lightbox.
 *
 * Videos are never re-mounted: the pool element that is already decoding is
 * re-placed at full-stage geometry, so opening costs zero black frames and
 * closing hands the clip back to its slot mid-play.
 */

export type LightboxItem =
  | { kind: "image"; src: string; bg?: "dark" | "paper" }
  | { kind: "video"; id: VideoId };

// Default is a no-op so slide components stay renderable outside the deck —
// the /preflight board mounts every slide without a provider.
const OpenCtx = createContext<(item: LightboxItem) => void>(() => {});

export const LightboxProvider = OpenCtx.Provider;

export function useLightbox() {
  return useContext(OpenCtx);
}

/** The corner affordance drawn on expandable media. Positioned by its parent. */
export function ExpandChip({ light = true }: { light?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: light ? "rgba(20,19,18,0.44)" : "rgba(244,241,234,0.72)",
        border: `1.5px solid ${light ? "rgba(244,241,234,0.3)" : "rgba(43,42,40,0.22)"}`,
        color: light ? "rgba(244,241,234,0.9)" : "rgba(43,42,40,0.8)",
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
      </svg>
    </div>
  );
}

/**
 * Click target over a pool video's slot. The clip itself lives in the pool
 * layer and takes no pointer events, so this sits above it in the slide.
 */
export function VideoExpand({
  id,
  x,
  y,
  w,
  h,
  radius,
  z = 30,
}: {
  id: VideoId;
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  z?: number;
}) {
  const open = useLightbox();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: radius,
        zIndex: z,
        cursor: "zoom-in",
      }}
      onClick={(e) => {
        e.stopPropagation();
        open({ kind: "video", id });
      }}
    >
      <div style={{ position: "absolute", right: 14, top: 14 }}>
        <ExpandChip />
      </div>
    </div>
  );
}

/**
 * Corner chip for full-bleed slides, where making the whole frame clickable
 * would swallow the deck's click-to-advance. Opens the named media clean —
 * no scrim, no type.
 */
export function ExpandCorner({ item, light = true }: { item: LightboxItem; light?: boolean }) {
  const open = useLightbox();
  return (
    <div
      style={{ position: "absolute", right: 44, top: 38, zIndex: 30, cursor: "zoom-in" }}
      onClick={(e) => {
        e.stopPropagation();
        open(item);
      }}
    >
      <ExpandChip light={light} />
    </div>
  );
}

export function LightboxLayer({
  item,
  onClose,
}: {
  item: LightboxItem;
  onClose: () => void;
}) {
  const pool = useVideoPool();

  // Take over the pool element for the duration; hand its exact previous
  // placement back on unmount, so the clip returns to its slot still playing.
  useEffect(() => {
    if (item.kind !== "video") return;
    const id = item.id;
    const prev = pool.get(id);
    const def = VIDEO_BY_ID.get(id);
    const full = !!def?.full;

    pool.place(id, {
      x: 0,
      y: 0,
      w: STAGE_W,
      h: STAGE_H,
      radius: 0,
      fit: "contain",
      playing: true,
      loop: false,
      muted: false,
      opacity: 1,
      z: 45,
      controls: true,
      full,
    });

    // Two things have to be forced on the DOM node directly. React does not
    // reliably reconcile `muted` on a mounted <video>, and the pool's playback
    // effect runs after paint — outside the gesture window a play() with sound
    // needs. So unmute and start here, synchronously, while the click that
    // opened the lightbox still counts as user activation.
    const node = pool.el(id);
    if (!node) return;

    node.muted = false;
    node.volume = 1;
    void node.play().catch(() => {});

    // Swapping to the full source resets the element, so the seek cannot happen
    // now: this effect runs in the commit *before* React re-renders with the new
    // src. Wait for the swapped file's own metadata, then jump to the moment the
    // slide was showing — expanding the shake test should not replay the four
    // minutes of walk-up that precede it.
    const start = def?.fullStart ?? 0;
    const onMeta = () => {
      if (full && !node.currentSrc.endsWith(def!.full!.split("/").pop()!)) return;
      node.removeEventListener("loadedmetadata", onMeta);
      if (start > 0 && Number.isFinite(node.duration) && start < node.duration) {
        node.currentTime = start;
      }
      node.muted = false;
      node.volume = 1;
      void node.play().catch(() => {});
    };

    if (full) node.addEventListener("loadedmetadata", onMeta);
    else if (start === 0) node.currentTime = 0;

    return () => {
      node.removeEventListener("loadedmetadata", onMeta);
      // Only restore if our override is still what's on stage. If the slide
      // changed while the exit animation ran, its VideoSlot has already nulled
      // or re-placed the slot, and stomping that would strand a video on the
      // wrong slide.
      if (pool.get(id)?.controls) {
        node.muted = true;
        pool.place(id, prev);
      }
    };
  }, [item, pool]);

  const paper = item.kind === "image" && item.bg === "paper";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        className="absolute inset-0"
        style={{
          zIndex: 44,
          background: paper ? "rgba(244,241,234,0.99)" : "rgba(14,13,12,0.95)",
          cursor: "zoom-out",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        {item.kind === "image" && (
          <motion.img
            src={item.src}
            alt=""
            draggable={false}
            initial={{ scale: 0.965, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: DUR, ease: EASE }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 56,
              boxSizing: "border-box",
            }}
          />
        )}
      </motion.div>

      {/* Sits above the pool video (z 45), which is why it is not inside the
          scrim element. */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Yopish"
        style={{
          position: "absolute",
          right: 44,
          top: 38,
          zIndex: 46,
          width: 56,
          height: 56,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          background: paper ? "rgba(43,42,40,0.06)" : "rgba(20,19,18,0.55)",
          border: `1.5px solid ${paper ? "rgba(43,42,40,0.24)" : "rgba(244,241,234,0.32)"}`,
          color: paper ? "#2B2A28" : "#F1EDE4",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </motion.button>
    </>
  );
}

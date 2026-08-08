"use client";

import { useEffect, useRef, useState } from "react";
import { STAGE_H, STAGE_W } from "./types";

/**
 * A fixed 1920×1080 design surface, uniformly scaled into whatever viewport it
 * lands in and letterboxed on the short axis.
 *
 * Every slide is authored in absolute pixels against this surface, so the deck
 * is byte-identical on the presenter's laptop, on a projector, and after Zoom's
 * re-encode. There is no responsive behaviour to get wrong on the day.
 */
export function Stage({
  children,
  letterbox = "#04120C",
  containerStyle,
}: {
  children: React.ReactNode;
  letterbox?: string;
  /** Override the fixed container — use to reserve space (e.g. right:'42%') for webinar mode. */
  containerStyle?: React.CSSProperties;
}) {
  const [fitted, setFitted] = useState({ scale: 0, x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const fit = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      const scale = Math.min(w / STAGE_W, h / STAGE_H);
      setFitted({
        scale,
        x: (w - STAGE_W * scale) / 2,
        y: (h - STAGE_H * scale) / 2,
      });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("orientationchange", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className="fixed overflow-hidden"
      style={{ top: 0, left: 0, right: 0, bottom: 0, background: letterbox, ...containerStyle }}
    >
      {/* Centring is done by translate, not by grid or flex alignment: a 1920 px
          child inside a narrower container overflows, and overflow alignment
          falls back to start — which silently clips the right and bottom edges
          of the stage on every viewport. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate3d(${fitted.x}px, ${fitted.y}px, 0) scale(${fitted.scale})`,
          transformOrigin: "0 0",
          // Avoid a one-frame full-size flash before the first measurement.
          visibility: fitted.scale ? "visible" : "hidden",
          willChange: "transform",
        }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}

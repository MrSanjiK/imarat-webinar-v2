"use client";

import { useEffect } from "react";
import { DECK } from "./registry";

const decoded = new Set<string>();

function warm(url: string, priority: boolean): Promise<void> {
  if (decoded.has(url)) return Promise.resolve();
  decoded.add(url);
  const img = new Image();
  img.fetchPriority = priority ? "high" : "low";
  img.src = url;
  return (img.decode?.() ?? Promise.resolve()).catch(() => {});
}

/**
 * Decode the next two slides eagerly, then bring the rest of the deck into
 * memory while the machine is idle. By the second minute of the webinar every
 * image is already decoded, so no slide can pop in half-painted.
 */
export function usePreload(i: number) {
  useEffect(() => {
    for (const n of [i + 1, i + 2]) {
      DECK[n]?.assets?.forEach((u) => warm(u, true));
    }
  }, [i]);

  useEffect(() => {
    const all = DECK.flatMap((s) => s.assets ?? []);
    let idx = 0;

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    const ric =
      (window as IdleWindow).requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 90));

    let stopped = false;
    // One image in flight at a time. Firing the batch and moving on without
    // waiting queues ~90 requests within a second and Chrome answers the tail
    // of them with ERR_INSUFFICIENT_RESOURCES — the warmer then silently
    // achieves nothing, which is worse than warming slowly.
    const pump = () => {
      if (stopped || idx >= all.length) return;
      void warm(all[idx++], false).then(() => {
        if (!stopped) ric(pump, { timeout: 600 });
      });
    };

    const id = window.setTimeout(pump, 1200);
    return () => {
      stopped = true;
      clearTimeout(id);
    };
  }, []);
}

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Stage } from "./Stage";
import { SlideBoundary } from "./SlideBoundary";
import { VideoPool } from "./VideoPool";
import { LightboxLayer, LightboxProvider, type LightboxItem } from "./Lightbox";
import { Overview } from "./Overview";
import { Chrome } from "./Chrome";
import { makeReducer, parseHash, toHash, type DeckState } from "./state";
import { REPEAT_GUARD_MS, intentFor } from "./keys";
import { DUR, EASE, STAGE_W, type SlideDef } from "./types";
import { CHAPTERS, DECK } from "./registry";
import { useLangCtx } from "@/content/lang";
import { t } from "@/content/i18n";
import { usePreload } from "./usePreload";

const POS_KEY = "imarat-deck-pos";

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 64 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -64 }),
};

export function Deck() {
  const deck = DECK;
  const reducer = useMemo(() => makeReducer(deck), [deck]);

  const [state, dispatch] = useReducer(reducer, { i: 0, step: 0, dir: 1 } as DeckState);
  const [overview, setOverview] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [idle, setIdle] = useState(true);
  const { lang, toggle: toggleLang } = useLangCtx();

  const lastKey = useRef(0);
  const restored = useRef(false);
  // Read inside the key handler without re-subscribing it per open/close.
  const lightboxRef = useRef(lightbox);
  useEffect(() => {
    lightboxRef.current = lightbox;
  }, [lightbox]);
  const slide = deck[state.i];

  // ── restore position ───────────────────────────────────────────────────────
  //
  // Guarded so it reads the address bar exactly once. The effect below rewrites
  // the hash from the *initial* state on the same commit, so a second run would
  // read back `#/0/0` and undo the restore — which is precisely what happens
  // under StrictMode, and would turn an accidental F5 into a jump to slide one.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const fromHash = parseHash(window.location.hash);
    const stored = (() => {
      try {
        const raw = sessionStorage.getItem(POS_KEY);
        return raw ? (JSON.parse(raw) as { i: number; step: number }) : null;
      } catch {
        return null;
      }
    })();
    const at = fromHash ?? stored;
    if (at) dispatch({ type: "SLIDE", i: at.i, step: at.step });
  }, []);

  useEffect(() => {
    const h = toHash(state);
    if (window.location.hash !== h) history.replaceState(null, "", h);
    try {
      sessionStorage.setItem(POS_KEY, JSON.stringify({ i: state.i, step: state.step }));
    } catch {}
  }, [state]);

  // ── input ──────────────────────────────────────────────────────────────────
  const act = useCallback(
    (intent: ReturnType<typeof intentFor>) => {
      switch (intent) {
        case "fwd":
          if (overview) return;
          dispatch({ type: "FWD" });
          break;
        case "back":
          if (overview) return;
          dispatch({ type: "BACK" });
          break;
        case "first":
          dispatch({ type: "FIRST" });
          break;
        case "last":
          dispatch({ type: "LAST" });
          break;
        case "overview":
          setOverview((v) => !v);
          break;
        case "blackout":
          setBlackout((v) => !v);
          break;
        case "lang":
          toggleLang();
          break;
        case "fullscreen":
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen().catch(() => {});
          break;
        case "escape":
          setOverview(false);
          setBlackout(false);
          break;
      }
    },
    [overview, toggleLang],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Held keys must not fast-forward through the whole deck.
      if (e.repeat) return;
      const intent = intentFor(e);
      if (!intent) return;
      e.preventDefault();

      // An open lightbox absorbs every deck intent: the next clicker press
      // closes it, never advances the slide hidden behind it.
      if (lightboxRef.current) {
        setLightbox(null);
        return;
      }

      // Most presenter remotes emit a press twice within a few tens of ms.
      const now = performance.now();
      if (intent === "fwd" || intent === "back") {
        if (now - lastKey.current < REPEAT_GUARD_MS) return;
        lastKey.current = now;
      }
      act(intent);
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [act]);

  // Cursor hides itself so it never sits in the middle of the shared screen.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 2200);
    };
    window.addEventListener("mousemove", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      clearTimeout(timer);
    };
  }, []);

  // ── screen wake lock: no screensaver during Q&A ────────────────────────────
  useEffect(() => {
    type WakeLockNav = Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    let sentinel: { release: () => Promise<void> } | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const wl = (navigator as WakeLockNav).wakeLock;
        if (!wl) return;
        const s = await wl.request("screen");
        if (cancelled) void s.release();
        else sentinel = s;
      } catch {}
    };

    void acquire();
    const onVis = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void sentinel?.release();
    };
  }, []);

  usePreload(state.i);

  const onPointer = (e: React.MouseEvent) => {
    if (overview) return;
    // Clicks on the lightbox's own surfaces stop propagation; anything that
    // still reaches here (e.g. the native video controls) must not navigate.
    if (lightbox) return;
    const ratio = e.clientX / window.innerWidth;
    act(ratio > 0.35 ? "fwd" : "back");
  };

  const dark = slide.theme === "dark";

  return (
    <div
      className={`deck-root fixed inset-0 ${idle && !overview ? "cursor-none" : ""}`}
      onClick={onPointer}
    >
      <Stage>
        <VideoPool>
          <LightboxProvider value={setLightbox}>
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ background: dark ? "#1c1b19" : "#f4f1ea" }}
            >
              <AnimatePresence mode="sync" custom={state.dir} initial={false}>
                <motion.div
                  key={slide.id}
                  custom={state.dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: DUR, ease: EASE }}
                  className="absolute inset-0"
                  style={{ width: STAGE_W }}
                >
                  <SlideBoundary title={t(slide.label, lang)} dark={dark}>
                    <slide.Component step={state.step} active />
                  </SlideBoundary>
                </motion.div>
              </AnimatePresence>
            </div>
          </LightboxProvider>

          <Chrome
            deck={deck}
            chapters={CHAPTERS}
            i={state.i}
            step={state.step}
            dark={dark}
            lang={lang}
          />

          <AnimatePresence>
            {overview && (
              <Overview
                deck={deck}
                chapters={CHAPTERS}
                current={state.i}
                lang={lang}
                onPick={(i) => {
                  dispatch({ type: "SLIDE", i });
                  setOverview(false);
                }}
                onClose={() => setOverview(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {lightbox && (
              <LightboxLayer item={lightbox} onClose={() => setLightbox(null)} />
            )}
          </AnimatePresence>

          {/* Blackout is paper, not black: on a shared screen it reads as a
              deliberate pause rather than a dead signal. */}
          <AnimatePresence>
            {blackout && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: EASE }}
                className="absolute inset-0 z-50 grid place-items-center"
                style={{ background: "#f4f1ea" }}
              >
                <div className="font-hand text-ash" style={{ fontSize: 44 }}>
                  ● ● ●
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </VideoPool>
      </Stage>
    </div>
  );
}

export type { SlideDef };

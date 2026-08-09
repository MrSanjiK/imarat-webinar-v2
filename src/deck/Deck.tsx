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
const WEBINAR_KEY = "imarat-webinar-cfg";

type WebinarCfg = { width: number; side: "left" | "right" };
const WEBINAR_DEFAULT: WebinarCfg = { width: 30, side: "right" };
const WEBINAR_MIN = 16;
const WEBINAR_MAX = 60;

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
  const [webinar, setWebinar] = useState(false);
  const [webinarCfg, setWebinarCfg] = useState<WebinarCfg>(WEBINAR_DEFAULT);
  const [webinarPanelOpen, setWebinarPanelOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [idle, setIdle] = useState(true);
  const { lang, toggle: toggleLang } = useLangCtx();

  // Restore the presenter's own webinar layout once — a size dialled in during
  // rehearsal must survive an accidental refresh on the day.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEBINAR_KEY);
      if (raw) {
        const cfg = JSON.parse(raw) as Partial<WebinarCfg>;
        setWebinarCfg((c) => ({
          width: typeof cfg.width === "number" ? cfg.width : c.width,
          side: cfg.side === "left" || cfg.side === "right" ? cfg.side : c.side,
        }));
      }
    } catch {}
  }, []);

  const saveWebinarCfg = useCallback((cfg: WebinarCfg) => {
    setWebinarCfg(cfg);
    try {
      localStorage.setItem(WEBINAR_KEY, JSON.stringify(cfg));
    } catch {}
  }, []);

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
        case "webinar":
          setWebinar((v) => !v);
          break;
        case "webinar-expand":
          if (!webinar) return;
          saveWebinarCfg({ ...webinarCfg, width: Math.min(WEBINAR_MAX, webinarCfg.width + 2) });
          break;
        case "webinar-shrink":
          if (!webinar) return;
          saveWebinarCfg({ ...webinarCfg, width: Math.max(WEBINAR_MIN, webinarCfg.width - 2) });
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
          setWebinarPanelOpen(false);
          break;
      }
    },
    [overview, toggleLang, webinar, webinarCfg, saveWebinarCfg],
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
    if (dragging) return;
    const ratio = e.clientX / window.innerWidth;
    act(ratio > 0.35 ? "fwd" : "back");
  };

  // Drag the seam between stage and camera panel to resize live. A pointer
  // capture on the handle itself would let the presenter drag past the
  // window edge without losing the gesture.
  const dragStartRef = useRef<{ x: number; width: number } | null>(null);
  const onHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, width: webinarCfg.width };
    setDragging(true);
  };
  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();
    const dxPx = e.clientX - dragStartRef.current.x;
    const dxPct = (dxPx / window.innerWidth) * 100;
    const delta = webinarCfg.side === "right" ? -dxPct : dxPct;
    const width = Math.min(WEBINAR_MAX, Math.max(WEBINAR_MIN, dragStartRef.current.width + delta));
    setWebinarCfg((c) => ({ ...c, width }));
  };
  const onHandlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragStartRef.current = null;
    setDragging(false);
    saveWebinarCfg(webinarCfg);
  };

  const dark = slide.theme === "dark";
  const camSide = webinarCfg.side;
  const camPct = `${webinarCfg.width}%`;

  return (
    <div
      className={`deck-root fixed inset-0 ${idle && !overview ? "cursor-none" : ""}`}
      onClick={onPointer}
    >
      <Stage containerStyle={webinar ? { [camSide]: camPct } : undefined}>
        <VideoPool>
          <LightboxProvider value={setLightbox}>
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ background: dark ? "#051810" : "#FFFFFF" }}
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
                style={{ background: "#FFFFFF" }}
              >
                <div style={{ fontSize: 44, color: "#00A868", letterSpacing: "0.4em" }}>
                  ●●●
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </VideoPool>
      </Stage>

      {/* Webinar camera panel — presenter-sized and presenter-positioned. */}
      {webinar && (
        <>
          <div
            className="fixed top-0 bottom-0"
            style={{
              [camSide]: 0,
              width: camPct,
              background: "#030E07",
              [camSide === "right" ? "borderLeft" : "borderRight"]:
                "1px solid rgba(0,168,104,0.14)",
              display: "grid",
              placeItems: "center",
              zIndex: 200,
              pointerEvents: "none",
            }}
          >
            <div style={{ textAlign: "center", color: "rgba(0,168,104,0.32)", userSelect: "none" }}>
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="14" width="34" height="26" rx="5" />
                <path d="M38 22l10-7v22l-10-7" />
              </svg>
              <div style={{ fontSize: 13, letterSpacing: "0.18em", marginTop: 14, textTransform: "uppercase" }}>
                Kamera
              </div>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", marginTop: 6, opacity: 0.6 }}>
                Zoom/Telegram oyna shu joyga qo‘yiladi
              </div>
            </div>
          </div>

          {/* Drag handle on the seam — grabbing it live-resizes the split. */}
          <div
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onClick={(e) => e.stopPropagation()}
            className="fixed top-0 bottom-0"
            style={{
              [camSide]: `calc(${camPct} - 5px)`,
              width: 10,
              cursor: "col-resize",
              zIndex: 202,
              background: dragging ? "rgba(0,168,104,0.35)" : "transparent",
            }}
          />

          {/* Indicator + settings toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setWebinarPanelOpen((v) => !v);
            }}
            className="fixed"
            style={{
              bottom: 24,
              [camSide]: `calc(${camPct} + 14px)`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              letterSpacing: "0.14em",
              color: "rgba(0,168,104,0.8)",
              background: "rgba(3,14,7,0.55)",
              border: "1px solid rgba(0,168,104,0.3)",
              borderRadius: 999,
              padding: "8px 14px",
              fontFamily: "monospace",
              zIndex: 201,
              cursor: "pointer",
            }}
          >
            ◫ WEBINAR {Math.round(webinarCfg.width)}%
          </button>

          {webinarPanelOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed"
              style={{
                bottom: 64,
                [camSide]: `calc(${camPct} + 14px)`,
                zIndex: 203,
                background: "#0A1F14",
                border: "1px solid rgba(0,168,104,0.3)",
                borderRadius: 16,
                padding: 20,
                width: 260,
                color: "#F4F1EA",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: "0.14em", opacity: 0.6, marginBottom: 14 }}>
                WEBINAR SOZLAMALARI
              </div>

              <div style={{ fontSize: 13, marginBottom: 8, opacity: 0.85 }}>
                Kamera kengligi — {Math.round(webinarCfg.width)}%
              </div>
              <input
                type="range"
                min={WEBINAR_MIN}
                max={WEBINAR_MAX}
                value={webinarCfg.width}
                onChange={(e) =>
                  saveWebinarCfg({ ...webinarCfg, width: Number(e.target.value) })
                }
                style={{ width: "100%" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  opacity: 0.5,
                  marginTop: 4,
                }}
              >
                <span>{WEBINAR_MIN}%</span>
                <span>{WEBINAR_MAX}%</span>
              </div>

              <div style={{ fontSize: 13, marginTop: 20, marginBottom: 8, opacity: 0.85 }}>
                Kamera joyi
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["left", "right"] as const).map((side) => (
                  <button
                    key={side}
                    onClick={() => saveWebinarCfg({ ...webinarCfg, side })}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      fontSize: 12,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      background: webinarCfg.side === side ? "rgba(0,168,104,0.9)" : "rgba(255,255,255,0.06)",
                      color: webinarCfg.side === side ? "#051810" : "#F4F1EA",
                      border: "1px solid rgba(0,168,104,0.3)",
                    }}
                  >
                    {side === "left" ? "Chapda" : "O‘ngda"}
                  </button>
                ))}
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(244,241,234,0.12)",
                  fontSize: 11,
                  lineHeight: 1.6,
                  opacity: 0.55,
                }}
              >
                Chegarani sichqoncha bilan sudrab ham o‘lchamni o‘zgartirish mumkin. Klaviatura: <b>[</b> / <b>]</b> — kichraytirish / kattalashtirish, <b>W</b> — yoqish/o‘chirish.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export type { SlideDef };

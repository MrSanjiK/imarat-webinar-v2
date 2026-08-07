"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DECK } from "@/deck/registry";
import { VIDEOS } from "@/deck/videos";
import { SlideBoundary } from "@/deck/SlideBoundary";
import { VideoPool } from "@/deck/VideoPool";
import { LangProvider } from "@/content/lang";
import type { Lang } from "@/content/i18n";
import { STAGE_H, STAGE_W } from "@/deck/types";
import { M } from "@/ui/layout";

/**
 * The go/no-go screen, run about ten minutes before air.
 *
 * Everything here answers one question: is there anything on this machine, on
 * this connection, right now, that would fail in front of an audience? A green
 * board is permission to start. Anything red is worth the two minutes it takes
 * to fix while nobody is watching.
 */

type State = "idle" | "run" | "ok" | "warn" | "fail";

type Check = {
  id: string;
  label: string;
  state: State;
  detail?: string;
  /** Completed / total, for the checks that walk a list. */
  progress?: [number, number];
};

const ASSETS = [...new Set(DECK.flatMap((s) => s.assets ?? []))];

// Uzbek Cyrillic and the Latin ʻ (U+02BB). If any of these fall back to a
// system font the stage shows tofu, and it shows it in the middle of a
// sentence where nobody can miss it.
const GLYPHS = ["ʻ", "ў", "ғ", "ҳ", "қ", "Ў", "Ғ", "Ҳ", "Қ"];

/** The four stacks the stage actually renders with, not the raw families. */
const FONT_STACKS: [v: string, label: string][] = [
  ["--font-display", "sarlavha"],
  ["--font-sans", "matn"],
  ["--font-mono", "raqam"],
  ["--font-hand", "qoʻlyozma"],
];

/**
 * Text that leaves the safe area — off the side of the stage, or down into the
 * band where the progress rail and chapter tag live.
 *
 * Measured through the offset chain rather than getBoundingClientRect, because
 * the rect includes the in-flight reveal transform and would report a line as
 * 18 px lower than it will finally sit. Backgrounds and images are skipped: they
 * are full-bleed by design, and only text overlapping the chrome is a defect.
 *
 * `data-bleed` marks the deliberate exceptions — type that runs off the sheet
 * as decoration, like the 620 px chapter numeral. Without it the real spills
 * are outnumbered by intended ones and the check stops being read.
 */
function spilled(root: HTMLElement | null): string[] {
  if (!root) return [];
  const out: string[] = [];

  for (const el of root.querySelectorAll<HTMLElement>("*")) {
    if (el.children.length || !el.textContent?.trim()) continue;
    if (el.closest("[data-bleed]")) continue;

    let x = 0;
    let y = 0;
    for (let n: HTMLElement | null = el; n && n !== root; n = n.offsetParent as HTMLElement | null) {
      x += n.offsetLeft;
      y += n.offsetTop;
    }

    const right = x + el.offsetWidth;
    const bottom = y + el.offsetHeight;
    const side =
      bottom > M.bottom
        ? `pastga ${Math.round(bottom - M.bottom)}px`
        : y < 0
          ? `yuqoriga ${Math.round(-y)}px`
          : x < M.left - 1
            ? `chapga ${Math.round(M.left - x)}px`
            : right > STAGE_W - M.right + 1
              ? `o'ngga ${Math.round(right - (STAGE_W - M.right))}px`
              : null;

    if (side) out.push(`"${el.textContent.trim().slice(0, 22)}" ${side}`);
  }
  return out;
}

export default function Preflight() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);
  const [walk, setWalk] = useState<{ i: number; step: number; lang: Lang } | null>(null);
  const walkFail = useRef<string[]>([]);
  const walkSpill = useRef<string[]>([]);
  const walkBox = useRef<HTMLDivElement>(null);

  const put = useCallback((c: Check) => {
    setChecks((prev) => {
      const i = prev.findIndex((x) => x.id === c.id);
      if (i < 0) return [...prev, c];
      const next = [...prev];
      next[i] = c;
      return next;
    });
  }, []);

  // ── individual checks ──────────────────────────────────────────────────────

  const checkAssets = useCallback(async () => {
    const bad: string[] = [];
    for (let i = 0; i < ASSETS.length; i++) {
      put({ id: "assets", label: "Rasmlar", state: "run", progress: [i, ASSETS.length] });
      const url = ASSETS[i];
      try {
        const r = await fetch(url, { cache: "force-cache" });
        if (!r.ok) throw new Error(String(r.status));
        const img = new Image();
        img.src = url;
        await img.decode();
      } catch {
        bad.push(url.split("/").pop() ?? url);
      }
    }
    put({
      id: "assets",
      label: "Rasmlar",
      state: bad.length ? "fail" : "ok",
      progress: [ASSETS.length, ASSETS.length],
      detail: bad.length ? bad.join(", ") : `${ASSETS.length} ta rasm yuklandi va dekodlandi`,
    });
  }, [put]);

  const checkVideos = useCallback(async () => {
    const bad: string[] = [];
    for (let i = 0; i < VIDEOS.length; i++) {
      put({ id: "videos", label: "Videolar", state: "run", progress: [i, VIDEOS.length] });
      const v = VIDEOS[i];
      const el = document.createElement("video");
      el.preload = "auto";
      el.muted = true;
      el.src = v.src;
      const ok = await new Promise<boolean>((resolve) => {
        // readyState 4 = HAVE_ENOUGH_DATA. Anything less can still stall.
        const done = (val: boolean) => {
          el.removeAttribute("src");
          el.load();
          resolve(val);
        };
        const timer = setTimeout(() => done(el.readyState >= 3), 25_000);
        el.oncanplaythrough = () => {
          clearTimeout(timer);
          done(true);
        };
        el.onerror = () => {
          clearTimeout(timer);
          done(false);
        };
      });
      if (!ok) bad.push(v.id);
    }
    put({
      id: "videos",
      label: "Videolar",
      state: bad.length ? "fail" : "ok",
      progress: [VIDEOS.length, VIDEOS.length],
      detail: bad.length ? bad.join(", ") : `${VIDEOS.length} ta video to'liq buferlandi`,
    });
  }, [put]);

  const checkFonts = useCallback(async () => {
    await document.fonts.ready;

    // Every "X Fallback" next/font emits is a size-adjusted local system font
    // declared over U+0-10FFFF, so it answers for any glyph and would make this
    // check a formality. Only the real web faces count as coverage.
    const web = new Set(
      [...document.fonts].map((f) => f.family.replace(/^["']|["']$/g, "")).filter((f) => !/ Fallback$/.test(f)),
    );

    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) {
      put({ id: "fonts", label: "Shriftlar (kirill + ʻ)", state: "warn", detail: "canvas yoʻq" });
      return;
    }

    // document.fonts.check() reports whether a face is *loaded*, not whether it
    // has the glyph — so it passes both when the font is still in flight and
    // when a system serif quietly answers instead. Measure the drawn width
    // against a sentinel that is guaranteed not to resolve: if a family cannot
    // supply the glyph the two agree, because both fell through to the same
    // generic. Two generics, in case one coincides.
    const width = (stack: string, g: string) => {
      ctx.font = `400 64px ${stack}`;
      return ctx.measureText(g).width;
    };
    const supplies = (family: string, g: string) =>
      ["monospace", "serif"].some(
        (gen) => width(`"${family}", ${gen}`, g) !== width(`"__preflight_none__", ${gen}`, g),
      );

    const stacks = FONT_STACKS.map(([v, label]) => ({
      label,
      families: getComputedStyle(document.documentElement)
        .getPropertyValue(v)
        .split(",")
        .map((f) => f.trim().replace(/^["']|["']$/g, ""))
        .filter((f) => web.has(f)),
    })).filter((s) => s.families.length);

    for (const s of stacks) {
      for (const f of s.families) {
        await document.fonts.load(`400 64px "${f}"`, GLYPHS.join("")).catch(() => {});
      }
    }

    const missing: string[] = [];
    const substituted: string[] = [];
    for (const s of stacks) {
      for (const g of GLYPHS) {
        const by = s.families.find((f) => supplies(f, g));
        if (!by) missing.push(`${g} (${s.label})`);
        else if (by !== s.families[0]) substituted.push(`${g} → ${by} (${s.label})`);
      }
    }

    put({
      id: "fonts",
      label: "Shriftlar (kirill + ʻ)",
      state: !stacks.length || missing.length ? "fail" : substituted.length ? "warn" : "ok",
      detail: !stacks.length
        ? "shrift oʻzgaruvchilari topilmadi"
        : missing.length
          ? `qoplanmagan: ${missing.slice(0, 6).join(", ")}`
          : substituted.length
            ? `zaxira oiladan: ${substituted.slice(0, 4).join(", ")}`
            : `${stacks.length} stek · ${document.fonts.size} ta fayl · barcha glif joyida`,
    });
  }, [put]);

  const checkFps = useCallback(async () => {
    put({ id: "fps", label: "Kadr chastotasi", state: "run" });
    const frames: number[] = [];
    await new Promise<void>((resolve) => {
      let last = performance.now();
      const tick = (now: number) => {
        frames.push(now - last);
        last = now;
        if (frames.length < 120) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const worst = Math.max(...frames.slice(1));
    const fps = Math.round(1000 / (frames.slice(1).reduce((a, b) => a + b, 0) / (frames.length - 1)));
    put({
      id: "fps",
      label: "Kadr chastotasi",
      state: fps >= 50 ? "ok" : fps >= 30 ? "warn" : "fail",
      detail: `o'rtacha ${fps} FPS · eng uzun kadr ${worst.toFixed(1)} ms`,
    });
  }, [put]);

  // An active service worker is necessary but not sufficient: the caches are
  // populated at runtime, so what actually decides whether the radio can be
  // pulled mid-broadcast is how much of the deck has landed in them yet. Counting
  // the stage's own media answers that; counting cache entries does not.
  const checkOffline = useCallback(async () => {
    put({ id: "offline", label: "Oflayn kesh", state: "run" });
    const sw = await navigator.serviceWorker?.getRegistration();
    if (!sw?.active) {
      put({
        id: "offline",
        label: "Oflayn kesh",
        state: "warn",
        detail: "service worker yo'q — internet uzilsa sayt ochilmaydi",
      });
      return;
    }

    const held = async (urls: string[]) => {
      let n = 0;
      for (const u of urls) if (await caches.match(u, { ignoreVary: true })) n++;
      return n;
    };
    const img = await held(ASSETS);
    const vid = await held(VIDEOS.map((v) => v.src));
    const whole = img === ASSETS.length && vid === VIDEOS.length;

    put({
      id: "offline",
      label: "Oflayn kesh",
      state: whole ? "ok" : "warn",
      detail: `service worker faol · keshda ${img}/${ASSETS.length} rasm · ${vid}/${VIDEOS.length} video${
        whole ? "" : " — decki bir marta oxirigacha varaqlang"
      }`,
    });
  }, [put]);

  // ── run all slides ─────────────────────────────────────────────────────────
  //
  // Mounts every (slide, step) pair for 220 ms inside the same error boundary
  // the deck uses. A slide that throws only on its fourth build is invisible
  // until the presenter reaches it live; this finds it in under a minute.

  const runAllSlides = useCallback(async () => {
    walkFail.current = [];
    walkSpill.current = [];
    const pairs: { i: number; step: number; lang: Lang }[] = [];
    // Both alphabets: Cyrillic sets wider than Latin, so a line that fits in one
    // can wrap in the other, and the presenter can switch mid-talk.
    for (const lang of ["latn", "cyrl"] as Lang[]) {
      DECK.forEach((s, i) => {
        for (let step = 0; step < s.steps; step++) pairs.push({ i, step, lang });
      });
    }

    for (let n = 0; n < pairs.length; n++) {
      setWalk(pairs[n]);
      put({ id: "slides", label: "Barcha slaydlar", state: "run", progress: [n, pairs.length] });
      put({ id: "safe", label: "Xavfsiz maydon", state: "run", progress: [n, pairs.length] });
      await new Promise((r) => setTimeout(r, 220));
      const { i, step, lang } = pairs[n];
      for (const line of spilled(walkBox.current)) {
        walkSpill.current.push(`${DECK[i].id}@${step}·${lang === "latn" ? "lat" : "kir"} ${line}`);
      }
    }
    setWalk(null);

    const bad = walkFail.current;
    put({
      id: "slides",
      label: "Barcha slaydlar",
      state: bad.length ? "fail" : "ok",
      progress: [pairs.length, pairs.length],
      detail: bad.length
        ? bad.join(", ")
        : `${pairs.length} ta (slayd, qadam) juftligi xatosiz o'tdi`,
    });

    const spill = walkSpill.current;
    // The row can only show the first few, and a spill is fixed by editing a
    // slide — so the whole list goes somewhere it can be read and worked through.
    if (spill.length) console.warn("[preflight] xavfsiz maydondan chiqqan matn:", spill);
    put({
      id: "safe",
      label: "Xavfsiz maydon",
      state: spill.length ? "fail" : "ok",
      progress: [pairs.length, pairs.length],
      detail: spill.length
        ? `${spill.length} ta: ${spill.slice(0, 4).join(" · ")}${spill.length > 4 ? " …" : ""}`
        : `barcha matn ${M.left}–${STAGE_W - M.right} × 0–${M.bottom} ichida`,
    });
  }, [put]);

  // Cache state is read last, and that ordering is load-bearing: the asset and
  // video checks fetch every file through the service worker, which is what
  // fills the cache in the first place. Read earlier, the row reports 0/32 on a
  // cold profile and prints an instruction that the next two checks have already
  // carried out — a red light that is wrong by the time the board settles, which
  // is worse than no light at all.
  const runAll = useCallback(async () => {
    setRunning(true);
    setChecks([]);
    await checkFonts();
    await checkFps();
    await checkAssets();
    await checkVideos();
    await runAllSlides();
    await checkOffline();
    setRunning(false);
  }, [checkFonts, checkFps, checkOffline, checkAssets, checkVideos, runAllSlides]);

  // Fonts and cache state are cheap and are what the presenter most wants to
  // see the moment the page opens; the rest waits for the button.
  useEffect(() => {
    const id = window.setTimeout(() => {
      void checkFonts();
      void checkOffline();
    }, 0);
    return () => clearTimeout(id);
  }, [checkFonts, checkOffline]);

  const verdict: State = checks.some((c) => c.state === "fail")
    ? "fail"
    : checks.some((c) => c.state === "run")
      ? "run"
      : checks.some((c) => c.state === "warn")
        ? "warn"
        : checks.length
          ? "ok"
          : "idle";

  const slide = walk ? DECK[walk.i] : null;

  return (
    <LangProvider>
      <main
        className="min-h-full font-sans"
        style={{ background: "#F4F1EA", color: "#2B2A28", padding: "56px 64px" }}
      >
        <header style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
          <h1 className="font-display" style={{ fontSize: 48 }}>
            Preflight
          </h1>
          <span className="font-mono" style={{ fontSize: 15, color: "#8B867E", letterSpacing: "0.1em" }}>
            EFIRDAN 10 DAQIQA OLDIN ISHGA TUSHIRING
          </span>
          <Verdict state={verdict} />
        </header>

        <button
          onClick={() => void runAll()}
          disabled={running}
          className="font-mono"
          style={{
            marginTop: 28,
            padding: "14px 30px",
            fontSize: 16,
            letterSpacing: "0.12em",
            border: "2px solid #2B2A28",
            borderRadius: 4,
            background: running ? "transparent" : "#2B2A28",
            color: running ? "#8B867E" : "#F4F1EA",
            cursor: running ? "default" : "pointer",
          }}
        >
          {running ? "TEKSHIRILMOQDA…" : "HAMMASINI TEKSHIRISH"}
        </button>

        <ul style={{ marginTop: 36, display: "grid", gap: 2, maxWidth: 1100 }}>
          {checks.map((c) => (
            <Row key={c.id} check={c} />
          ))}
        </ul>

        {/* The walker renders off-screen at full stage size: a slide that
            depends on its real geometry must fail here the same way it would
            fail on stage, not be excused by a shrunken container. */}
        {slide && (
          <div
            ref={walkBox}
            aria-hidden
            style={{
              // Off to the side rather than display:none — a hidden subtree has
              // no layout, and layout is exactly what is being measured.
              position: "fixed",
              left: -99999,
              top: 0,
              width: STAGE_W,
              height: STAGE_H,
              overflow: "hidden",
            }}
          >
            {/* Video slides reach for the pool through context, so the walker
                has to supply one or every one of them throws here and passes
                on stage — the exact inversion of what this page is for. */}
            <VideoPool>
              {/* Nested provider — shadows the page's so the walk can force an
                  alphabet without touching what the presenter sees. */}
              <LangProvider key={walk?.lang} initial={walk?.lang}>
                <SlideBoundary
                  key={`${slide.id}-${walk?.step}`}
                  title={slide.id}
                  dark={slide.theme === "dark"}
                  onError={() =>
                    walkFail.current.push(`${slide.id}@${walk?.step}·${walk?.lang}`)
                  }
                >
                  <slide.Component step={walk?.step ?? 0} active />
                </SlideBoundary>
              </LangProvider>
            </VideoPool>
          </div>
        )}
      </main>
    </LangProvider>
  );
}

const TONE: Record<State, string> = {
  idle: "#8B867E",
  run: "#C8A24A",
  ok: "#0E5C43",
  warn: "#C8A24A",
  fail: "#C7502F",
};

const MARK: Record<State, string> = {
  idle: "·",
  run: "…",
  ok: "✓",
  warn: "!",
  fail: "✕",
};

function Verdict({ state }: { state: State }) {
  if (state === "idle") return null;
  const text =
    state === "ok" ? "GO" : state === "run" ? "…" : state === "warn" ? "GO (ogohlantirish bilan)" : "NO-GO";
  return (
    <span
      className="font-mono"
      style={{
        marginLeft: "auto",
        fontSize: 22,
        letterSpacing: "0.14em",
        color: TONE[state],
        border: `2px solid ${TONE[state]}`,
        padding: "8px 18px",
        borderRadius: 4,
      }}
    >
      {text}
    </span>
  );
}

function Row({ check }: { check: Check }) {
  const tone = TONE[check.state];
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "28px 260px 1fr",
        alignItems: "baseline",
        gap: 16,
        padding: "13px 0",
        borderBottom: "1px solid rgba(43,42,40,0.1)",
      }}
    >
      <span className="font-mono" style={{ color: tone, fontSize: 20 }}>
        {MARK[check.state]}
      </span>
      <span style={{ fontSize: 20, fontWeight: 500 }}>{check.label}</span>
      <span className="font-mono" style={{ fontSize: 15, color: check.state === "fail" ? tone : "#8B867E" }}>
        {check.progress && check.state === "run"
          ? `${check.progress[0]} / ${check.progress[1]}`
          : check.detail}
      </span>
    </li>
  );
}

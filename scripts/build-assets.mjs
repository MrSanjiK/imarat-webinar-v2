/**
 * Asset pipeline: media-src/ → app/public/media/
 *
 * Run one stage at a time — video transcoding is the long pole and should be
 * started early and left alone:
 *
 *   node scripts/build-assets.mjs images
 *   node scripts/build-assets.mjs video
 *   node scripts/build-assets.mjs catalog
 *   node scripts/build-assets.mjs qr
 *   node scripts/build-assets.mjs sheets     ← contact sheets, for authoring
 *   node scripts/build-assets.mjs all
 *
 * Every external command is invoked through execFileSync with an argument
 * array: the source filenames contain spaces, apostrophes and Cyrillic, and a
 * shell string would mangle all three.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import QRCode from "qrcode";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const ROOT = resolve(APP, "..");
// The source media lives outside the app so `next dev` never walks 543 MB.
// MEDIA_SRC lets it sit anywhere — the two repos are not always siblings.
const SRC = process.env.MEDIA_SRC ? resolve(process.env.MEDIA_SRC) : join(ROOT, "media-src");
const OUT = join(APP, "public", "media");
const DOCS = join(ROOT, "docs");

const FFMPEG = ffmpegPath;
const FFPROBE = ffprobeStatic.path;

// ── config the client can still change on the day ────────────────────────────

/** Telegram destination behind the QR. Overridden by TELEGRAM_URL in env. */
const TELEGRAM_URL = process.env.TELEGRAM_URL ?? "https://t.me/imarat_development";

/**
 * Three fragments cut from the 17-minute 1966 archive reel.
 *
 * The 20-frame contact sheet is too coarse at the head of the reel: its first
 * tile lands on the wall clock stopped near 05:23, which reads as the opening
 * shot. It is not. The reel spends 0–14 s on title cards and crew credits, then
 * 15–20 s on empty night streets, and only reaches the clock at 21 s. Cutting
 * from 0 puts a sound operator's name on screen under "Toshkent uygʻonmadi".
 */
const ARCHIVE_CUTS = [
  // Sleeping city → "ВНИМАНИЕ! ЗЕМЛЕТРЯСЕНИЕ" → the clock stopped at 5:23 → the
  // clock knocked askew → survivors' faces. Both ends are trimmed off a
  // blown-out frame, so the loop seam holds on a face instead of flashing white;
  // the slide can stay up for a minute and the restart never reads as a glitch.
  { id: "archive-1966-a", start: 22, dur: 18 },
  { id: "archive-1966-b", start: 96, dur: 20 },  // collapsed interiors
  { id: "archive-1966-c", start: 900, dur: 20 }, // the city clearing and rebuilding
];

// Untrimmed, with audio, for the lightbox. Never precached — these are only
// fetched when the presenter actually expands a clip, so they are allowed to be
// large. The archive film is a single 17-minute reel: all three slide cuts open
// into it, each seeking to its own moment, so the presenter can scrub either way
// from there.
const FULL_CUTS = [
  {
    src: "1966-tashkent-archive.mp4",
    out: "archive-1966-full.mp4",
    // 17 minutes of 1966 film stock. Grain is what makes archive footage
    // expensive to encode, so it is denoised first; the source is 600×480 and
    // upscaling it here only bought bitrate, not detail.
    vf: "hqdn3d=5:4:7:5",
    crf: 31,
  },
  { src: "studio-tour.mp4", out: "studio-tour-full.mp4", vf: "scale=720:1280:flags=lanczos", crf: 24 },
  { src: "vibro-test.mp4", out: "vibro-full.mp4", vf: "scale=720:1280:flags=lanczos", crf: 24 },
  { src: "turkey-2023-long.mp4", out: "turkey-long-full.mp4", crf: 24 },
  { src: "turkey-2023-short.mp4", out: "turkey-short-full.mp4", crf: 24 },
];

// ── helpers ──────────────────────────────────────────────────────────────────

const log = (...a) => console.log(...a);
const ensure = (p) => {
  mkdirSync(p, { recursive: true });
  return p;
};

function run(bin, args, label) {
  const t0 = Date.now();
  try {
    execFileSync(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    log(`  ✓ ${label}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (err) {
    const stderr = err.stderr?.toString().split("\n").slice(-14).join("\n") ?? String(err);
    log(`  ✗ ${label}\n${stderr}`);
    throw err;
  }
}

const ffmpeg = (args, label) => run(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", ...args], label);

function probe(file) {
  const out = execFileSync(FFPROBE, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height,duration,r_frame_rate",
    "-show_entries", "format=duration",
    "-of", "json",
    file,
  ]).toString();
  const j = JSON.parse(out);
  const s = j.streams?.[0] ?? {};
  return {
    w: s.width,
    h: s.height,
    dur: Number(s.duration ?? j.format?.duration ?? 0),
  };
}

const list = (dir, exts) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => exts.includes(extname(f).toLowerCase()))
        .sort()
    : [];

const mb = (p) => (statSync(p).size / 1e6).toFixed(1);

/** Skip work that is already done — reruns during a two-day build are constant. */
const fresh = (src, dst) =>
  existsSync(dst) && statSync(dst).mtimeMs > statSync(src).mtimeMs;

// ── images ───────────────────────────────────────────────────────────────────

/** 24 px blur-up placeholder, inlined into the slide as a data URI. */
async function lqip(file) {
  const buf = await sharp(file).resize(24, 24, { fit: "inside" }).webp({ quality: 42 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

async function emit(src, dst, { width, quality = 82, nearLossless = false, fit = "inside", band }) {
  if (fresh(src, dst)) return;
  ensure(dirname(dst));
  let p = sharp(src, { limitInputPixels: false }).rotate();
  const meta = await p.metadata();
  // `band: [topFraction, bottomFraction]` keeps only that horizontal slice of
  // the source, before any resize.
  if (band && meta.height) {
    const top = Math.round(meta.height * band[0]);
    p = sharp(
      await p.extract({ left: 0, top, width: meta.width, height: Math.round(meta.height * band[1]) - top }).toBuffer(),
    );
  }
  if (width && meta.width && meta.width > width) p = p.resize(width, null, { fit, withoutEnlargement: true });
  await p.webp(nearLossless ? { nearLossless: true, quality: 90 } : { quality, effort: 5 }).toFile(dst);
}

async function buildImages() {
  log("\n▸ images");
  const manifest = {};

  // Renders — the visual backbone of chapter 5.
  const renders = list(join(SRC, "renders"), [".jpg", ".jpeg", ".png"]);
  ensure(join(OUT, "renders"));
  for (const f of renders) {
    const n = f.replace(/\.[^.]+$/, "");
    const src = join(SRC, "renders", f);
    await emit(src, join(OUT, "renders", `render-${n}.webp`), { width: 2560, quality: 82 });
    await emit(src, join(OUT, "renders", `render-${n}-sm.webp`), { width: 640, quality: 74 });
    manifest[`render-${n}`] = await lqip(src);
  }
  log(`  ✓ ${renders.length} renders`);

  // Cover hero: the widest, highest-detail aerial we have.
  const heroSrc = join(SRC, "renders", renders[0] ?? "");
  if (existsSync(heroSrc)) {
    await emit(heroSrc, join(OUT, "renders", "hero.webp"), { width: 1600, quality: 84, fit: "cover" });
    log("  ✓ hero");
  }

  // Lifestyle squares. These are the marketing team's Instagram carousel
  // slides, so each one has a headline burned into its lower quarter; the grid
  // crops from the top to clear it. `excursion` is the exception — it also
  // carries a logo and a "25-oktabr 14:00 da" date chip along its top edge, and
  // a stale date on a 9-avgust deck is worse than no tile at all. Only the
  // middle band of that one is photograph.
  const LIFE_BAND = { excursion: [0.2, 0.7] };
  const life = list(join(SRC, "lifestyle"), [".jpg", ".jpeg", ".png"]);
  for (const f of life) {
    const n = f.replace(/\.[^.]+$/, "");
    const src = join(SRC, "lifestyle", f);
    await emit(src, join(OUT, "lifestyle", `${n}.webp`), {
      width: 1200,
      quality: 80,
      band: LIFE_BAND[n],
    });
    manifest[`life-${n}`] = await lqip(src);
  }
  log(`  ✓ ${life.length} lifestyle`);

  // Banners: grain is the point, so quality stays high and AVIF is skipped —
  // its denoising smears exactly the graphite texture we are paying for.
  const banners = list(join(SRC, "banners"), [".png", ".jpg"]);
  for (const f of banners) {
    const n = f.replace(/\.[^.]+$/, "");
    await emit(join(SRC, "banners", f), join(OUT, "banners", `${n}.webp`), {
      width: 2200,
      quality: 88,
    });
  }
  log(`  ✓ ${banners.length} banners`);

  // Infrastructure artboards are line art — near-lossless or they turn to mush.
  const infra = list(join(SRC, "infra"), [".png", ".jpg", ".jpeg"]);
  for (const f of infra) {
    const n = f.replace(/\.[^.]+$/, "");
    const isArt = n.startsWith("artboard");
    await emit(join(SRC, "infra", f), join(OUT, "infra", `${n}.webp`), {
      width: 2000,
      quality: isArt ? 90 : 82,
      nearLossless: isArt,
    });
  }
  log(`  ✓ ${infra.length} infra`);

  // Floor plans: thin black lines on white, near-lossless, no upscaling.
  const plans = list(join(SRC, "plans"), [".jpg", ".jpeg", ".png"]);
  for (const f of plans) {
    const n = f.replace(/\.[^.]+$/, "");
    const src = join(SRC, "plans", f);
    await emit(src, join(OUT, "plans", `${n}.webp`), { width: 1800, nearLossless: true });
    manifest[`plan-${n}`] = await lqip(src);
  }
  log(`  ✓ ${plans.length} plans`);

  // Logos keep their alpha.
  const logos = list(join(SRC, "logos"), [".png", ".svg"]);
  ensure(join(OUT, "logos"));
  for (const f of logos) {
    const n = f.replace(/\.[^.]+$/, "");
    const src = join(SRC, "logos", f);
    const dst = join(OUT, "logos", `${n}.webp`);
    if (extname(f) === ".svg") {
      writeFileSync(join(OUT, "logos", f), readFileSync(src));
      continue;
    }
    if (fresh(src, dst)) continue;
    await sharp(src).resize(900, null, { withoutEnlargement: true }).webp({ quality: 92 }).toFile(dst);
  }
  log(`  ✓ ${logos.length} logos`);

  ensure(OUT);
  writeFileSync(join(OUT, "lqip.json"), JSON.stringify(manifest, null, 0));
  log(`  ✓ lqip.json (${Object.keys(manifest).length})`);
}

// ── video ────────────────────────────────────────────────────────────────────

const X264 = (crf) => [
  "-c:v", "libx264",
  "-crf", String(crf),
  "-preset", "slow",
  "-profile:v", "high",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  "-an",
];

/** Lightbox variant: the untrimmed source, with its audio kept. */
const X264_FULL = (crf) => [
  "-c:v", "libx264",
  "-crf", String(crf),
  "-preset", "medium",
  "-profile:v", "high",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  "-c:a", "aac",
  "-b:a", "128k",
  "-ac", "2",
];

const dst = (p) => p.split(/[\\/]/).pop();

async function poster(mp4, at = 1.2) {
  const png = mp4.replace(/\.mp4$/, "-poster.png");
  const webp = mp4.replace(/\.mp4$/, "-poster.webp");
  if (fresh(mp4, webp)) return;
  ffmpeg(["-ss", String(at), "-i", mp4, "-frames:v", "1", png], `poster ${dst(mp4)}`);
  await sharp(png).webp({ quality: 78 }).toFile(webp);
  unlinkSync(png);
}

function buildVideo() {
  log("\n▸ video");
  ensure(join(OUT, "video"));

  const jobs = [];

  // 1966 archive: three short cuts, denoised and fully desaturated. The only
  // colour left anywhere in that chapter is the deck's own green.
  const archive = join(SRC, "video", "1966-tashkent-archive.mp4");
  if (existsSync(archive)) {
    for (const c of ARCHIVE_CUTS) {
      jobs.push({
        label: c.id,
        out: join(OUT, "video", `${c.id}.mp4`),
        args: [
          "-ss", String(c.start),
          "-t", String(c.dur),
          "-i", archive,
          "-vf",
          "hqdn3d=4:3:6:4.5,hue=s=0,eq=contrast=1.10:brightness=0.015,scale=960:768:flags=lanczos",
          ...X264(24),
        ],
      });
    }
  }

  const simple = [
    // Both portrait clips are displayed inside narrow frames — 408 and 544
    // stage px — so 720 wide still has headroom on a 4K panel. Encoding them
    // at source resolution would triple the precache for pixels nobody sees.
    { src: "studio-tour.mp4", out: "studio-tour.mp4", vf: "scale=720:1280:flags=lanczos", crf: 24 },
    // Only the last 14 s of the 170-s source is the test itself: the red rig
    // bolted to the roof slab, then the crowd watching the tower ride out the
    // shake. Everything before it is a blogger walking the site and talking to
    // camera — under the title "Sunʼiy zilzila" that footage is not neutral
    // filler, it is the wrong claim. Trimmed at the source, not in the player.
    {
      src: "vibro-test.mp4",
      out: "vibro.mp4",
      ss: 155.6,
      t: 13.9,
      vf: "scale=720:1280:flags=lanczos",
      crf: 22,
    },
    // Not a landscape clip. It is a 396-px-wide phone video pillarboxed into a
    // 1280×720 container, so 69 % of the frame is black bar — and the slide
    // uses it as a full-bleed backdrop, where that bar reads as a broken
    // element. cropdetect puts the footage at 396:720:442:0; the upscale to
    // stage height is invisible at the 0.32 opacity it is composited with.
    {
      src: "turkey-2023-long.mp4",
      out: "turkey-long.mp4",
      vf: "crop=396:720:442:0,scale=594:1080:flags=lanczos",
      crf: 24,
    },
    // 360×640 upscaled with lanczos: soft, but never blocky next to the wide cut.
    { src: "turkey-2023-short.mp4", out: "turkey-short.mp4", vf: "scale=540:960:flags=lanczos", crf: 22 },
  ];

  for (const s of simple) {
    const src = join(SRC, "video", s.src);
    if (!existsSync(src)) {
      log(`  · missing ${s.src}`);
      continue;
    }
    jobs.push({
      label: s.out,
      out: join(OUT, "video", s.out),
      args: [
        ...(s.ss ? ["-ss", String(s.ss)] : []),
        ...(s.t ? ["-t", String(s.t)] : []),
        "-i", src,
        ...(s.vf ? ["-vf", s.vf] : []),
        ...X264(s.crf),
      ],
    });
  }

  // Lightbox variants. The slide clips above are silent and, where the point of
  // the slide is one moment, trimmed to it — right for a backdrop that loops
  // under type for a minute. But when the presenter expands a clip the audience
  // has asked to actually watch it, and a soundless 14-second stub of a
  // 170-second shake test is the wrong answer. So each clip also gets an
  // untrimmed cut with its audio kept, fetched only once the deck is idle.
  for (const f of FULL_CUTS) {
    const src = join(SRC, "video", f.src);
    if (!existsSync(src)) continue;
    jobs.push({
      label: `${f.out} (full+audio)`,
      out: join(OUT, "video", f.out),
      args: ["-i", src, ...(f.vf ? ["-vf", f.vf] : []), ...X264_FULL(f.crf)],
    });
  }

  for (const j of jobs) {
    if (existsSync(j.out)) {
      log(`  · ${j.label} exists (${mb(j.out)} MB)`);
      continue;
    }
    ffmpeg([...j.args, j.out], j.label);
    log(`    ${mb(j.out)} MB`);
  }

  return jobs.map((j) => j.out).filter(existsSync);
}

async function buildPosters() {
  log("\n▸ posters");
  for (const f of list(join(OUT, "video"), [".mp4"])) {
    await poster(join(OUT, "video", f), 1.2);
  }
}

/**
 * A 5×4 tile of frames per source clip, written to docs/. Written for the
 * author, not the audience: picking a timecode from a sheet beats scrubbing a
 * 17-minute reel in a player.
 */
function buildSheets() {
  log("\n▸ contact sheets");
  ensure(DOCS);
  for (const f of list(join(SRC, "video"), [".mp4", ".mov"])) {
    const src = join(SRC, "video", f);
    const out = join(DOCS, `contact-${f.replace(/\.[^.]+$/, "")}.jpg`);
    if (existsSync(out)) {
      log(`  · ${dst(out)} exists`);
      continue;
    }
    const { dur } = probe(src);
    const every = Math.max(1, dur / 20);
    ffmpeg(
      [
        "-i", src,
        "-vf", `fps=1/${every.toFixed(3)},scale=320:-1,tile=5x4`,
        "-frames:v", "1",
        "-q:v", "3",
        out,
      ],
      dst(out),
    );
    log(`    ${dur.toFixed(0)}s → one frame per ${every.toFixed(0)}s`);
  }
}

// ── catalog ──────────────────────────────────────────────────────────────────

async function buildCatalog() {
  log("\n▸ catalog");
  const pdf = join(SRC, "catalog", "catalog.pdf");
  if (!existsSync(pdf)) return log("  · catalog.pdf missing");
  ensure(join(OUT, "catalog"));

  const { pdf: toImg } = await import("pdf-to-img");
  const doc = await toImg(pdf, { scale: 2 });
  let n = 0;
  for await (const page of doc) {
    n += 1;
    const out = join(OUT, "catalog", `page-${String(n).padStart(2, "0")}.webp`);
    if (existsSync(out)) continue;
    await sharp(page).resize(1600, null, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  }
  log(`  ✓ ${n} pages`);
}

// ── QR ───────────────────────────────────────────────────────────────────────

/**
 * Error correction Q and a fat quiet zone: Zoom's encoder eats thin dark
 * modules, and a QR that fails on the recipient's screen fails silently.
 */
async function buildQR() {
  log("\n▸ qr");
  ensure(join(OUT, "qr"));
  const svg = await QRCode.toString(TELEGRAM_URL, {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 3,
    width: 880,
    color: { dark: "#2B2A28", light: "#F4F1EA" },
  });
  writeFileSync(join(OUT, "qr", "telegram.svg"), svg);
  await QRCode.toFile(join(OUT, "qr", "telegram.png"), TELEGRAM_URL, {
    errorCorrectionLevel: "Q",
    margin: 3,
    width: 880,
    color: { dark: "#2B2A28", light: "#F4F1EA" },
  });
  writeFileSync(join(OUT, "qr", "target.txt"), TELEGRAM_URL);
  log(`  ✓ ${TELEGRAM_URL}`);
}

// ── main ─────────────────────────────────────────────────────────────────────

const stage = process.argv[2] ?? "all";
const t0 = Date.now();

if (!existsSync(SRC)) {
  console.error(`media-src not found at ${SRC}`);
  process.exit(1);
}
ensure(OUT);

if (stage === "images" || stage === "all") await buildImages();
if (stage === "video" || stage === "all") {
  buildVideo();
  await buildPosters();
}
if (stage === "posters") await buildPosters();
if (stage === "sheets") buildSheets();
if (stage === "catalog" || stage === "all") await buildCatalog();
if (stage === "qr" || stage === "all") await buildQR();

log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${OUT}\n`);

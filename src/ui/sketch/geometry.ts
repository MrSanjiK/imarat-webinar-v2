/**
 * Pencil geometry.
 *
 * Every wobble is derived from an integer seed and baked into the `d` string at
 * module/render time. Nothing here animates: an SVG `feTurbulence` would have to
 * re-rasterise the filter on every frame, which costs more than the whole rest
 * of the deck combined.
 */

/** mulberry32 — small, fast, and stable across reloads. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Pt = [number, number];

const round = (n: number) => Math.round(n * 100) / 100;

/** Catmull–Rom through the points, emitted as cubic beziers. */
export function smooth(pts: Pt[], closed = false): string {
  if (pts.length < 2) return "";
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M ${round(pts[0][0])} ${round(pts[0][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(x2)} ${round(y2)}`;
  }
  return closed ? d + " Z" : d;
}

/**
 * A straight run redrawn as if by hand: perpendicular noise that tapers to zero
 * at both ends, plus a small overshoot so corners read as pencil strokes.
 */
export function wobbleLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed = 1,
  amp = 1.5,
  overshoot = 0,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const ax = x1 - ux * overshoot;
  const ay = y1 - uy * overshoot;
  const bx = x2 + ux * overshoot;
  const by = y2 + uy * overshoot;

  const segs = Math.max(2, Math.min(14, Math.round(len / 55)));
  const r = rng(seed * 2654435761);
  const pts: Pt[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    // sin taper keeps the endpoints exactly where the caller asked for them
    const fall = Math.sin(Math.PI * t);
    const off = (r() - 0.5) * 2 * amp * fall;
    pts.push([ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off]);
  }
  return smooth(pts);
}

/** Four independent pencil strokes, so corners overshoot like a real drawing. */
export function wobbleRect(
  x: number,
  y: number,
  w: number,
  h: number,
  seed = 1,
  amp = 1.4,
  overshoot = 2.5,
): string {
  return [
    wobbleLine(x, y, x + w, y, seed + 1, amp, overshoot),
    wobbleLine(x + w, y, x + w, y + h, seed + 2, amp, overshoot),
    wobbleLine(x + w, y + h, x, y + h, seed + 3, amp, overshoot),
    wobbleLine(x, y + h, x, y, seed + 4, amp, overshoot),
  ].join(" ");
}

export function wobblePoly(pts: Pt[], seed = 1, amp = 1.3, closed = false): string {
  const parts: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    parts.push(wobbleLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], seed + i, amp));
  }
  if (closed && pts.length > 2) {
    const a = pts[pts.length - 1];
    const b = pts[0];
    parts.push(wobbleLine(a[0], a[1], b[0], b[1], seed + pts.length, amp));
  }
  return parts.join(" ");
}

/** Hand-drawn circle/ellipse. */
export function wobbleEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry = rx,
  seed = 1,
  amp = 1.6,
): string {
  const r = rng(seed * 40503);
  const n = 22;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const j = (r() - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * (rx + j), cy + Math.sin(a) * (ry + j)]);
  }
  return smooth(pts, true);
}

/**
 * 45° hatching across a box. Fills are never solid in this deck — hatching is
 * the single detail that sells "an architect drew this".
 */
export function hatch(
  x: number,
  y: number,
  w: number,
  h: number,
  gap = 9,
  angleDeg = 45,
  seed = 1,
  amp = 0.8,
): string {
  const a = (angleDeg * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const nx = -uy;
  const ny = ux;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const reach = (Math.abs(w) + Math.abs(h)) / 2 + 20;
  const count = Math.ceil((reach * 2) / gap);
  const parts: string[] = [];

  for (let i = -count; i <= count; i++) {
    const ox = cx + nx * i * gap;
    const oy = cy + ny * i * gap;
    parts.push(
      wobbleLine(ox - ux * reach, oy - uy * reach, ox + ux * reach, oy + uy * reach, seed + i * 7, amp),
    );
  }
  return parts.join(" ");
}

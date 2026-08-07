/**
 * One-shot: pull Uzbekistan's border out of Natural Earth (via the world-atlas
 * TopoJSON build) and print it as a literal vertex array for SeismicMapUZ.
 *
 * The map is a chapter-1 hero on a live webinar for an Uzbek audience, so a
 * hand-guessed silhouette is not good enough — a native viewer spots a wrong
 * outline of their own country instantly. Run once, paste the output, delete
 * nothing: the coordinates end up static in the component and this script is
 * only here to show where they came from.
 *
 *   node scripts/extract-uz-outline.mjs
 */

const URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const UZ_ID = "860"; // ISO 3166-1 numeric

const topo = await fetch(URL).then((r) => {
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
});

const obj = topo.objects.countries;
const feature = obj.geometries.find((g) => g.id === UZ_ID);
if (!feature) throw new Error("Uzbekistan not found in the countries object");

const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;

/** Delta-decoded and dequantised back to lon/lat. */
function arc(i) {
  const reversed = i < 0;
  const raw = topo.arcs[reversed ? ~i : i];
  let x = 0;
  let y = 0;
  const out = raw.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * sx + tx, y * sy + ty];
  });
  return reversed ? out.reverse() : out;
}

/** A ring is a list of arc indices; consecutive arcs share an endpoint. */
const ring = (indices) =>
  indices.flatMap((i, n) => (n === 0 ? arc(i) : arc(i).slice(1)));

const polygons = feature.type === "MultiPolygon" ? feature.arcs : [feature.arcs];
const rings = polygons.map((p) => ring(p[0]));
rings.sort((a, b) => b.length - a.length);
const border = rings[0];

/** Perpendicular distance from p to the segment ab, in degrees. */
function dist(p, a, b) {
  const [px, py] = p;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  let worst = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = dist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > worst) {
      worst = d;
      idx = i;
    }
  }
  if (worst <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}

/** N points spaced evenly along the ring's perimeter. */
function resample(pts, n) {
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push(d);
    total += d;
  }
  const out = [];
  const stride = total / n;
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const want = k * stride;
    while (acc + seg[i] < want) {
      acc += seg[i];
      i = (i + 1) % pts.length;
    }
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const t = seg[i] === 0 ? 0 : (want - acc) / seg[i];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

/** One [1,2,1]/4 pass around a closed ring. */
const blur = (pts) =>
  pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[(i + 1) % pts.length];
    return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4];
  });

/**
 * The drawing is ~740 px wide for a country 1 230 km across, so anything under
 * roughly a degree cannot resolve. Douglas-Peucker alone is the wrong filter
 * for that: it *keeps* spikes, which is exactly backwards here — the Fergana
 * entrance and the Syrdarya hook are serrated at the enclave scale, and the
 * Catmull-Rom pass that gives the outline its pencil quality loops over itself
 * trying to follow them. So DP only drops collinear runs, then the ring is
 * resampled at uniform arc length and low-passed: even spacing is also what
 * keeps Catmull-Rom from overshooting, since it overshoots on abrupt changes
 * in segment length.
 */
const TARGET = Number(process.argv[2] ?? 64);
const PASSES = Number(process.argv[3] ?? 2);

let pts = resample(simplify(border, 0.02), TARGET);
for (let i = 0; i < PASSES; i++) pts = blur(pts);

/**
 * Tashkent is the one point the map has to place, and it sits ~15 km from the
 * Kazakh border — so resampling that shaves the corner north-east of the city
 * can leave its 40 px crosshair straddling the outline. Reported in the
 * component's own pixels so the number is directly comparable.
 */
const PROJ = { LON0: 55.6, LAT0: 37.0, SX: 43, SY: 52, OX: 72, OY: 545 };
const proj = ([lon, lat]) => [
  PROJ.OX + (lon - PROJ.LON0) * PROJ.SX,
  PROJ.OY - (lat - PROJ.LAT0) * PROJ.SY,
];

function clearance(ring, p) {
  const q = proj(p);
  let min = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = proj(ring[i]);
    const b = proj(ring[(i + 1) % ring.length]);
    min = Math.min(min, dist(q, a, b));
  }
  return min;
}

const lons = pts.map((p) => p[0]);
const lats = pts.map((p) => p[1]);
const f = (n) => Number(n.toFixed(2));

console.log(`// ${pts.length} vertices, uniform arc length, ${PASSES} smoothing passes`);
console.log(
  `// Tashkent clearance: ${clearance(pts, [69.28, 41.31]).toFixed(1)} px (raw border ${clearance(
    border,
    [69.28, 41.31],
  ).toFixed(1)} px)`,
);
console.log(
  `// lon ${f(Math.min(...lons))}…${f(Math.max(...lons))}  lat ${f(Math.min(...lats))}…${f(Math.max(...lats))}`,
);
console.log("const UZ: Pt[] = [");
for (const [lon, lat] of pts) console.log(`  [${f(lon)}, ${f(lat)}],`);
console.log("];");

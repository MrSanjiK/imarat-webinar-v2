/**
 * Every number the deck says out loud, in one place.
 *
 * Nothing here may be inlined into a sentence: counters animate to these values
 * and diagrams scale off them, and the client can still change a price the
 * morning of the webinar without anyone hunting through 40 slides.
 */

export const N = {
  webinarDate: { d: 9, m: 8, y: 2026 },

  quake1966: {
    date: "1966.04.26",
    time: "05:23",
    magnitude: 5.2,
    homesDestroyed: 36_000,
    familiesHomeless: 78_000,
  },

  materials: {
    brickMassKg: [2.5, 4] as const,
    brickWallDensity: [1800, 1950] as const, // kg/m³
    aeratedDensity: [400, 700] as const, // kg/m³
    lighterFactor: [2, 4] as const,
    sovietConcrete: "M200–M300",
    modernConcrete: "M400–M500",
    sovietRebar: "A1 / A2 / A3",
    modernRebar: "A500S",
    bearingWallSpacing: [3, 6] as const, // metres
  },

  turkey: {
    date: "2023.02.06",
    magnitude: 7.8,
    epicentre: "Kahramanmaraş",
    deaths: 60_000,
    amnestyYear: 2018,
    amnestyBuildings: 7_000_000,
    prevQuakeYear: 1999,
  },

  testing: {
    mskFrom: 8,
    mskTo: 9,
    pressTonnes: [100, 150, 200] as const,
    vibroFrequencyHz: 12,
  },

  debt: {
    totalSoum: 220_000_000_000,
    defaultShare: 0.85,
    planPayYears: [4, 4.5] as const,
    planBuildYears: [2, 2.5] as const,
    planLiveYears: [2, 2.5] as const,
  },

  studio: {
    areaFrom: 21,
    areaTo: 23,
    tiers: [
      { floors: "13–16", usd: 9_700 },
      { floors: "9–12", usd: 10_500 },
      { floors: "4–8", usd: 11_300 },
      { floors: "2–3", usd: 12_000 },
    ],
  },

  /** Instalment plans, exactly as approved by the client. */
  plans: {
    a: {
      down: 38_000_000,
      terms: [
        { months: 40, monthly: 3_800_000 },
        { months: 20, monthly: 7_600_000 },
      ],
    },
    b: {
      discount: 0.1,
      total: 170_000_000,
      down: 76_000_000,
      terms: [
        { months: 40, monthly: 2_350_000 },
        { months: 20, monthly: 4_705_000 },
      ],
    },
  },

  vip: {
    minContractsPerYear: 1,
    freeRenovationFrom: 1,
    freeFurnishingFrom: 2,
    bundleSize: 5,
    bundleBonusIndex: 6,
    ladder: [
      { paid: 0.5, discount: 0.5 },
      { paid: 1.0, discount: 1.0 },
    ],
  },

  project: {
    renders: 31,
    floorPlans: 5,
    catalogPages: 22,
  },
} as const;

export type Tier = (typeof N.studio.tiers)[number];

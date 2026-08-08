import type { ChapterDef, SlideDef } from "./types";
import { S } from "@/content/strings";

import { Cover } from "@/slides/00-cover";
import {
  Quake1966,
  QuakeBearing,
  QuakeClose,
  QuakeLab,
  QuakeMass,
  QuakeOpen,
  QuakePanelMonolith,
  QuakeRebar,
  QuakeSeismic,
  QuakeTurkey,
  QuakeVibro,
} from "@/slides/01-quake";
import { EscrowImpact, EscrowOpen, EscrowWhat } from "@/slides/02-escrow";
import { ReadyDebt, ReadyOpen, ReadyProcess, ReadyStudio } from "@/slides/03-ready";
import {
  VipBonuses,
  VipCondition,
  VipFivePlusOne,
  VipIntro,
  VipOpen,
  VipPerks,
} from "@/slides/04-vip";
import {
  CityCatalog,
  CityGate,
  CityInfra,
  CityLife,
  CityMahalla,
  CityMaster,
  CityNight,
  CityOpen,
  CityPark,
  CityPlans,
} from "@/slides/05-city";
import {
  OfferCta,
  OfferEnd,
  OfferFirstDay,
  OfferInstallments,
  OfferIntro,
  OfferLadder,
  OfferOpen,
} from "@/slides/06-offer";

/**
 * The deck, in order. This array is the single source of truth: the reducer
 * clamps against it, the progress rail measures it, the overview grid draws it
 * and the preloader walks its `assets`.
 *
 * `assets` lists every image the slide paints. Anything left out simply loads
 * on demand — correct, but it can pop in on a cold machine, so keep it honest.
 */

const render = (n: string) => `/media/renders/render-${n}.webp`;

const LIFE = [
  "playground",
  "barbecue",
  "waterfront",
  "school-kindergarten",
  "neighbours",
  "outdoor-active",
  "grill",
  "excursion",
].map((k) => `/media/lifestyle/${k}.webp`);

const PLANS = ["studio-21-23", "1r-38-8", "2r-52-7", "2r-58-3", "2r-62-1"].map(
  (f) => `/media/plans/${f}.webp`,
);

const CATALOG = ["03", "07", "11", "15", "19"].map((p) => `/media/catalog/page-${p}.webp`);

export const DECK: SlideDef[] = [
  // ── cover ──────────────────────────────────────────────────────────────────
  {
    id: "cover",
    chapter: 0,
    steps: 2,
    theme: "paper",
    label: S.cover.title,
    assets: ["/media/renders/hero.webp"],
    Component: Cover,
  },

  // ── 1 · zilzila ────────────────────────────────────────────────────────────
  {
    id: "c1-open",
    chapter: 1,
    steps: 1,
    theme: "dark",
    label: S.chapters.c1.title,
    // No backdrop by design — a Sergeli City render behind a chapter heading
    // about buildings killing people reads as advertising the disaster.
    Component: QuakeOpen,
  },
  {
    id: "q-1966",
    chapter: 1,
    steps: 4,
    theme: "dark",
    label: S.quake.y1966.title,
    Component: Quake1966,
  },
  {
    id: "q-seismic",
    chapter: 1,
    // 5: the last step zooms the map into Tashkent after the city is marked.
    steps: 5,
    theme: "dark",
    label: S.quake.seismic.title,
    Component: QuakeSeismic,
  },
  {
    id: "q-panel-monolith",
    chapter: 1,
    steps: 4,
    theme: "dark",
    label: S.quake.panelVsMonolith.title,
    Component: QuakePanelMonolith,
  },
  {
    id: "q-mass",
    chapter: 1,
    steps: 4,
    theme: "dark",
    label: S.quake.mass.title,
    Component: QuakeMass,
  },
  {
    id: "q-bearing",
    chapter: 1,
    // 4, not 3: the plan's last beat removes the middle cross-wall and shifts
    // the load onto its neighbours. That is the slide's whole argument, and at
    // 3 it was unreachable.
    steps: 4,
    theme: "dark",
    label: S.quake.bearing.title,
    Component: QuakeBearing,
  },
  {
    id: "q-rebar",
    chapter: 1,
    steps: 5,
    theme: "dark",
    label: S.quake.rebar.title,
    Component: QuakeRebar,
  },
  {
    id: "q-turkey",
    chapter: 1,
    steps: 5,
    theme: "dark",
    label: S.quake.turkey.title,
    Component: QuakeTurkey,
  },
  {
    id: "q-vibro",
    chapter: 1,
    steps: 4,
    theme: "dark",
    label: S.quake.vibro.title,
    Component: QuakeVibro,
  },
  {
    id: "q-lab",
    chapter: 1,
    steps: 3,
    theme: "dark",
    label: S.quake.vibro.labTitle,
    Component: QuakeLab,
  },
  {
    id: "q-close",
    chapter: 1,
    steps: 3,
    theme: "dark",
    label: S.quake.close.title,
    Component: QuakeClose,
  },

  // ── 2 · escrow ─────────────────────────────────────────────────────────────
  {
    id: "c2-open",
    chapter: 2,
    steps: 1,
    theme: "paper",
    label: S.chapters.c2.title,
    assets: [render("004")],
    Component: EscrowOpen,
  },
  {
    id: "e-what",
    chapter: 2,
    steps: 4,
    theme: "paper",
    label: S.escrow.what.title,
    Component: EscrowWhat,
  },
  {
    id: "e-impact",
    chapter: 2,
    steps: 6,
    theme: "paper",
    label: S.escrow.impact.title,
    Component: EscrowImpact,
  },

  // ── 3 · tayyor uylar ───────────────────────────────────────────────────────
  {
    id: "c3-open",
    chapter: 3,
    steps: 1,
    theme: "paper",
    label: S.chapters.c3.title,
    assets: [render("025")],
    Component: ReadyOpen,
  },
  {
    id: "r-debt",
    chapter: 3,
    steps: 5,
    theme: "paper",
    label: S.ready.debt.title,
    Component: ReadyDebt,
  },
  {
    id: "r-process",
    chapter: 3,
    steps: 6,
    theme: "paper",
    label: S.ready.process.title,
    Component: ReadyProcess,
  },
  {
    id: "r-studio",
    chapter: 3,
    steps: 3,
    theme: "paper",
    label: S.ready.studio.title,
    assets: [PLANS[0]],
    Component: ReadyStudio,
  },

  // ── 4 · VIP Club ───────────────────────────────────────────────────────────
  {
    id: "c4-open",
    chapter: 4,
    steps: 1,
    theme: "paper",
    label: S.chapters.c4.title,
    assets: [render("011")],
    Component: VipOpen,
  },
  {
    id: "v-intro",
    chapter: 4,
    steps: 2,
    theme: "paper",
    label: S.vip.intro.title,
    Component: VipIntro,
  },
  {
    id: "v-perks",
    chapter: 4,
    steps: 6,
    theme: "paper",
    label: S.vip.perks.title,
    Component: VipPerks,
  },
  {
    id: "v-condition",
    chapter: 4,
    steps: 3,
    theme: "paper",
    label: S.vip.condition.title,
    Component: VipCondition,
  },
  {
    id: "v-bonuses",
    chapter: 4,
    steps: 7,
    theme: "paper",
    label: S.vip.bonuses.title,
    Component: VipBonuses,
  },
  {
    id: "v-five-plus-one",
    chapter: 4,
    steps: 4,
    theme: "paper",
    label: S.vip.fivePlusOne.title,
    Component: VipFivePlusOne,
  },

  // ── 5 · Sergeli City ───────────────────────────────────────────────────────
  {
    id: "c5-open",
    chapter: 5,
    steps: 1,
    theme: "dark",
    label: S.chapters.c5.title,
    assets: [render("008")],
    Component: CityOpen,
  },
  {
    id: "ci-master",
    chapter: 5,
    steps: 2,
    theme: "dark",
    // The slide's own title is "Sergeli City", which is right for the hero shot
    // and wrong for the overview: there it sits directly under a chapter heading
    // of the same name, giving the one screen meant for "where am I" two
    // identical adjacent rows. The caption is the distinguishing half.
    label: S.city.master.caption,
    assets: [render("008")],
    Component: CityMaster,
  },
  {
    id: "ci-gate",
    chapter: 5,
    steps: 1,
    theme: "dark",
    label: S.city.gate.title,
    assets: [render("024")],
    Component: CityGate,
  },
  {
    id: "ci-night",
    chapter: 5,
    steps: 2,
    theme: "dark",
    label: S.city.night.title,
    assets: [render("005")],
    Component: CityNight,
  },
  {
    id: "ci-mahalla",
    chapter: 5,
    steps: 2,
    theme: "dark",
    label: S.city.mahalla.title,
    assets: [render("013")],
    Component: CityMahalla,
  },
  {
    id: "ci-park",
    chapter: 5,
    steps: 2,
    theme: "dark",
    label: S.city.park.title,
    assets: [render("030")],
    Component: CityPark,
  },
  {
    id: "ci-life",
    chapter: 5,
    steps: 3,
    theme: "paper",
    label: S.city.life.title,
    assets: LIFE,
    Component: CityLife,
  },
  {
    id: "ci-infra",
    chapter: 5,
    steps: 5,
    theme: "paper",
    label: S.city.infra.title,
    Component: CityInfra,
  },
  {
    id: "ci-plans",
    chapter: 5,
    steps: 6,
    theme: "paper",
    label: S.city.plans.title,
    assets: PLANS,
    Component: CityPlans,
  },
  {
    id: "ci-catalog",
    chapter: 5,
    steps: 2,
    theme: "dark",
    label: S.city.catalog.title,
    assets: [render("009"), ...CATALOG],
    Component: CityCatalog,
  },

  // ── 6 · aksiya ─────────────────────────────────────────────────────────────
  {
    id: "c6-open",
    chapter: 6,
    steps: 1,
    theme: "paper",
    label: S.chapters.c6.title,
    assets: [render("027")],
    Component: OfferOpen,
  },
  {
    id: "o-intro",
    chapter: 6,
    steps: 3,
    theme: "paper",
    label: S.offer.intro.title,
    Component: OfferIntro,
  },
  {
    id: "o-ladder",
    chapter: 6,
    steps: 5,
    theme: "paper",
    label: S.offer.ladder.title,
    Component: OfferLadder,
  },
  {
    id: "o-first-day",
    chapter: 6,
    steps: 3,
    theme: "paper",
    label: S.offer.firstDay.title,
    assets: [render("016")],
    Component: OfferFirstDay,
  },
  {
    id: "o-installments",
    chapter: 6,
    steps: 4,
    theme: "paper",
    label: S.offer.installments.title,
    Component: OfferInstallments,
  },
  {
    id: "o-cta",
    chapter: 6,
    steps: 3,
    theme: "paper",
    label: S.offer.cta.title,
    assets: ["/media/qr/telegram.svg"],
    Component: OfferCta,
  },
  {
    id: "o-end",
    chapter: 6,
    steps: 2,
    theme: "dark",
    label: S.offer.end.title,
    assets: [render("008")],
    Component: OfferEnd,
  },
];

/**
 * Chapter 1 starts at index 0, not 1: the progress rail has to account for the
 * cover, and a rail that begins one slide in reads as a rendering bug. The
 * cover's own `chapter: 0` still keeps Chrome from labelling it.
 */
export const CHAPTERS: ChapterDef[] = [1, 2, 3, 4, 5, 6].map((n) => {
  const from = n === 1 ? 0 : DECK.findIndex((s) => s.chapter === n);
  const key = `c${n}` as keyof typeof S.chapters;
  return { n, title: S.chapters[key].title, from };
});

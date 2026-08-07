"use client";

import { STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal, Stagger } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  At,
  Backdrop,
  Body,
  Caption,
  Kicker,
  M,
  Rule,
  Slide,
  Title,
} from "@/ui/layout";
import { C, SketchRect } from "@/ui/sketch";
import { InfraMap } from "@/ui/diagrams/InfraMap";
import { ChapterOpener, ShowcaseSlide } from "./common";

/** Chapter 5 — the project itself. Five full-bleed renders back to back, then
 *  the three things a render cannot show: how it lives, what surrounds it, and
 *  what you actually buy. */

const R = (n: string) => `/media/renders/render-${n}.webp`;

export function CityOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={5}
      step={step}
      title={S.chapters.c5.title}
      lead={S.chapters.c5.lead}
      theme="dark"
      image={R("008")}
    />
  );
}

export function CityMaster({ step, active }: SlideProps) {
  return (
    <ShowcaseSlide
      step={step}
      active={active}
      image={R("008")}
      title={S.city.master.title}
      caption={S.city.master.caption}
      body={S.city.master.body}
    />
  );
}

export function CityGate({ step, active }: SlideProps) {
  return (
    <ShowcaseSlide
      step={step}
      active={active}
      image={R("024")}
      title={S.city.gate.title}
      caption={S.city.gate.caption}
    />
  );
}

export function CityNight({ step, active }: SlideProps) {
  return (
    <ShowcaseSlide
      step={step}
      active={active}
      image={R("005")}
      title={S.city.night.title}
      caption={S.city.night.caption}
    />
  );
}

export function CityMahalla({ step, active }: SlideProps) {
  return (
    <ShowcaseSlide
      step={step}
      active={active}
      image={R("013")}
      title={S.city.mahalla.title}
      caption={S.city.mahalla.caption}
    />
  );
}

export function CityPark({ step, active }: SlideProps) {
  return (
    <ShowcaseSlide
      step={step}
      active={active}
      image={R("030")}
      title={S.city.park.title}
      caption={S.city.park.caption}
    />
  );
}

// ── lifestyle grid ───────────────────────────────────────────────────────────

const LIFE = [
  "playground",
  "barbecue",
  "waterfront",
  "school-kindergarten",
  "neighbours",
  "outdoor-active",
  "grill",
  "excursion",
] as const;

/**
 * Eight squares on paper. Each tile carries its caption underneath rather than
 * over the image — text on top of eight different photographs is eight
 * different contrast problems.
 *
 * The sources are the marketing team's Instagram carousel slides: a 1080²
 * photograph with a two-line headline burned into the lower quarter, and the
 * headline is a fragment ("Barbekyu maydoni bu —") that only completes on the
 * next slide of the carousel. Cropping from the centre put a knife through
 * that text. `top` shows the first 72 % of the square instead, which clears
 * the highest of the eight headlines (playground, y≈828) by fifty pixels.
 */
export function CityLife({ step }: SlideProps) {
  const lang = useLang();
  const c = S.city.life;

  const cols = 4;
  const cell = 372;
  const gap = 26;
  const x0 = (STAGE_W - (cols * cell + (cols - 1) * gap)) / 2;

  return (
    <Slide grid={false}>
      <At x={x0} y={M.top - 24} w={cols * cell + (cols - 1) * gap}>
        <Reveal at={0} step={step} y={16}>
          <Title size={62}>{t(c.title, lang)}</Title>
        </Reveal>
      </At>

      {LIFE.map((k, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return (
          <At
            key={k}
            x={x0 + col * (cell + gap)}
            y={230 + row * (cell * 0.72 + 74)}
            w={cell}
          >
            <Stagger at={1} step={step} i={i} y={20} gap={0.055}>
              <div
                style={{
                  width: cell,
                  height: cell * 0.72,
                  overflow: "hidden",
                  borderRadius: 6,
                  background: C.paper2,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/media/lifestyle/${k}.webp`}
                  alt=""
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0";
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    display: "block",
                  }}
                />
              </div>
              <Caption size={23} style={{ marginTop: 14, color: C.ink2 }}>
                {t(c.items[i], lang)}
              </Caption>
            </Stagger>
          </At>
        );
      })}
    </Slide>
  );
}

// ── infrastructure ───────────────────────────────────────────────────────────

export function CityInfra({ step }: SlideProps) {
  const lang = useLang();
  const c = S.city.infra;

  return (
    <Slide>
      <At x={M.left} y={M.top + 30} w={560}>
        <Reveal at={0} step={step} y={20}>
          <Title size={66}>{t(c.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.1} style={{ marginTop: 26 }}>
          <Rule w={124} color={C.forest} delay={0.16} />
        </Reveal>
        <Reveal at={0} step={step} delay={0.16} style={{ marginTop: 28 }}>
          <Body size={28}>{t(c.body, lang)}</Body>
        </Reveal>

        <div style={{ marginTop: 46, display: "grid", gap: 26 }}>
          {c.pins.map((p, i) => (
            <Reveal key={i} at={i + 1} step={step} y={14} x={10}>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span
                  className="tnum font-mono"
                  style={{ fontSize: 18, color: C.forest, width: 26, flexShrink: 0 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div style={{ fontSize: 29, fontWeight: 400, color: C.ink, lineHeight: 1.2 }}>
                    {t(p.t, lang)}
                  </div>
                  <Caption size={22} style={{ marginTop: 5 }}>
                    {t(p.d, lang)}
                  </Caption>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </At>

      {/*
        The map carries this slide alone. A photo strip used to sit under it,
        swapping with the focused pin, but /media/infra/artboard-*.webp are
        portrait social posters — headline text, logo, @handle — so a 940 × 176
        cover crop only ever showed an arbitrary band out of their middle. It
        also promised to track the list and then couldn't: there is no Eco Park
        artboard, so the fourth beat silently kept showing the highway.
      */}
      <At x={820} y={168} w={940}>
        <div style={{ height: 560 }}>
          <InfraMap step={step} />
        </div>
      </At>
    </Slide>
  );
}

// ── floor plans ──────────────────────────────────────────────────────────────

const PLAN_FILES = ["studio-21-23", "1r-38-8", "2r-52-7", "2r-58-3", "2r-62-1"] as const;

/**
 * Five plans on one sheet. The plan under the current step is drawn at full
 * strength; the others sit back at 30% so the eye knows where to look without
 * anything having to move.
 */
export function CityPlans({ step }: SlideProps) {
  const lang = useLang();
  const c = S.city.plans;
  const focus = step - 1; // step 0 = all quiet, steps 1..5 = one plan each

  const cell = 300;
  const gap = 24;
  const x0 = M.left;

  return (
    <Slide grid={false}>
      <At x={M.left} y={M.top - 20} w={900}>
        <Reveal at={0} step={step} y={16}>
          <Title size={64}>{t(c.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.1} style={{ marginTop: 18 }}>
          <Body size={28}>{t(c.body, lang)}</Body>
        </Reveal>
      </At>

      {PLAN_FILES.map((f, i) => {
        const on = focus < 0 || focus === i;
        return (
          <At key={f} x={x0 + i * (cell + gap)} y={352} w={cell}>
            <Stagger at={0} step={step} i={i} y={22} gap={0.07}>
              <div
                style={{
                  opacity: on ? 1 : 0.3,
                  transition: "opacity 340ms",
                }}
              >
                {/* No card behind the plan. The five drawings run from 0.53 to
                    1.36 in aspect — a studio really is tall and narrow, a 62 m²
                    two-room really is wide — so a fixed box gives the widest one
                    deep white bands top and bottom. Left transparent, the
                    multiply blend drops each plan straight onto the paper and
                    the leftover area is simply paper. */}
                <div style={{ width: cell, height: 330, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/media/plans/${f}.webp`}
                    alt=""
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0";
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                      mixBlendMode: "multiply",
                    }}
                  />
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 27, fontWeight: 400, color: C.ink }}>
                    {t(c.items[i].t, lang)}
                  </div>
                  <Caption size={22} style={{ marginTop: 4, color: C.forest }}>
                    {t(c.items[i].d, lang)}
                  </Caption>
                </div>
              </div>
            </Stagger>
          </At>
        );
      })}

      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        width={STAGE_W}
        height={STAGE_H}
      >
        {focus >= 0 && focus < PLAN_FILES.length && (
          <SketchRect
            x={x0 + focus * (cell + gap) - 12}
            y={340}
            w={cell + 24}
            h={354}
            seed={71 + focus}
            amp={1.5}
            on
            stroke={C.forest}
            width={2.5}
            duration={0.55}
          />
        )}
      </svg>

      <At x={M.left} y={854} w={1600}>
        <Reveal at={5} step={step} delay={0.2}>
          <Caption size={24}>
            {`${N.project.floorPlans} ${lang === "latn" ? "format" : "формат"} · ${N.project.catalogPages} ${
              lang === "latn" ? "sahifalik katalog" : "саҳифалик каталог"
            }`}
          </Caption>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── catalog ──────────────────────────────────────────────────────────────────

/** A fan of catalog spreads. Sells the existence of the document; the document
 *  itself lives in the bot, which is where the lead actually gets captured. */
export function CityCatalog({ step }: SlideProps) {
  const lang = useLang();
  const c = S.city.catalog;
  const pages = ["03", "07", "11", "15", "19"];

  // The catalog "pages" are 1600 × 562 — landscape spreads, 2.85 : 1. Fanned as
  // 330 × 466 portraits they were cropped to an eighth of their width, so each
  // card showed an arbitrary vertical band out of a two-panel layout. Cards now
  // carry the source's own aspect and cascade downward instead, each sheet
  // showing the top third of the one beneath it.
  const cw = 760;
  const ch = Math.round(cw / 2.847);

  return (
    <Slide theme="dark" grid={false}>
      <Backdrop src={R("009")} theme="dark" scrim="full" opacity={0.34} />

      <At x={M.left} y={M.top + 40} w={620} z={10}>
        <Reveal at={0} step={step} y={18}>
          <Kicker theme="dark" color="#3ED66A">
            {t(S.brand.project, lang)}
          </Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={22} delay={0.06} style={{ marginTop: 20 }}>
          <Title theme="dark" size={88}>
            {t(c.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 30 }}>
          <Body theme="dark" size={32}>
            {t(c.body, lang)}
          </Body>
        </Reveal>
      </At>

      {pages.map((p, i) => (
        <At key={p} x={850 + i * 30} y={183 + i * 105} w={cw} z={10 + i}>
          <Stagger at={1} step={step} i={i} y={26} gap={0.08}>
            <div
              style={{
                width: cw,
                height: ch,
                overflow: "hidden",
                borderRadius: 4,
                background: "#fff",
                transform: `rotate(${(2 - i) * 0.8}deg)`,
                boxShadow: "0 18px 48px rgba(0,0,0,0.34)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/media/catalog/page-${p}.webp`}
                alt=""
                draggable={false}
                onError={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </Stagger>
        </At>
      ))}
    </Slide>
  );
}

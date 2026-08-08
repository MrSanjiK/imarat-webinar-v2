"use client";

import { STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal, Stagger } from "@/deck/Reveal";
import { useLang } from "@/content/lang";
import { t, num, soum, usd } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  At,
  Backdrop,
  Body,
  Caption,
  Chip,
  Kicker,
  Lead,
  M,
  Note,
  Rule,
  Slide,
  Stat,
  Title,
} from "@/ui/layout";
import { C, Counter, SketchLine } from "@/ui/sketch";
import { FloorPriceLadder } from "@/ui/diagrams/FloorPriceLadder";
import { InstallmentVariants } from "@/ui/diagrams/InstallmentVariants";
import { useLightbox } from "@/deck/Lightbox";
import { ChapterOpener } from "./common";

/** Chapter 6 — the ask. Everything before this was argument; this chapter is
 *  arithmetic. Gold carries the money, green carries the gift, and the last
 *  slide holds one QR code and nothing else. */

export function OfferOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={6}
      step={step}
      title={S.chapters.c6.title}
      lead={S.chapters.c6.lead}
      image="/media/renders/render-027.webp"
    />
  );
}

export function OfferIntro({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.intro;

  return (
    <Slide grid={false}>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", paddingBottom: 70 }}>
          <Reveal at={0} step={step} y={14}>
            <Chip color={C.gold} filled size={22}>
              {t(o.badge, lang)}
            </Chip>
          </Reveal>

          <Reveal at={0} step={step} y={26} delay={0.1} style={{ marginTop: 40 }}>
            <Title size={104} align="center" style={{ maxWidth: 1400 }}>
              {t(o.title, lang)}
            </Title>
          </Reveal>

          <Reveal at={1} step={step} style={{ marginTop: 36 }}>
            <Lead align="center" color={C.ash}>
              {t(o.subtitle, lang)}
            </Lead>
          </Reveal>

          <Reveal at={2} step={step} y={20} style={{ marginTop: 56 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, justifyContent: "center" }}>
              <span style={{ fontSize: 40, fontWeight: 300, color: C.ash }}>
                {lang === "latn" ? "narxi" : "нархи"}
              </span>
              <Counter
                to={N.studio.tiers[0].usd}
                on={step >= 2}
                format={(v) => usd(Math.round(v))}
                duration={1.2}
                className="font-display"
                style={{
                  fontSize: 150,
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  color: C.gold,
                  lineHeight: 1,
                }}
              />
              <span style={{ fontSize: 40, fontWeight: 300, color: C.ash }}>
                {lang === "latn" ? "dan" : "дан"}
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}

// ── price ladder ─────────────────────────────────────────────────────────────

/**
 * Four price tiers, top floor first. The hero number ($9 700) is the highest
 * band on the building, so the list is deliberately read top-down — the eye
 * lands on the cheapest apartment before it reads any of the others.
 */
export function OfferLadder({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.ladder;
  const tiers = N.studio.tiers;

  return (
    <Slide>
      <At x={M.left} y={M.top + 20} w={620}>
        <Reveal at={0} step={step} y={20}>
          <Title size={70}>{t(o.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 26 }}>
          <Rule w={140} color={C.gold} delay={0.18} />
        </Reveal>
        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 30 }}>
          <Body size={28}>{t(o.note, lang)}</Body>
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 60 }}>
          <Chip color={C.gold}>{t(o.heroNote, lang)}</Chip>
        </Reveal>
        <Reveal at={1} step={step} delay={0.08} style={{ marginTop: 22 }}>
          <Stat
            value={
              <Counter
                to={tiers[0].usd}
                on={step >= 1}
                format={(v) => usd(Math.round(v))}
                duration={1.1}
              />
            }
            label={`${N.studio.areaFrom}–${N.studio.areaTo} m² · ${t(o.floorsLabel, lang)} ${tiers[0].floors}`}
            color={C.gold}
            size={116}
          />
        </Reveal>
      </At>

      <At x={880} y={M.top} w={420}>
        <div style={{ height: 720 }}>
          <FloorPriceLadder step={step} />
        </div>
      </At>

      <At x={1360} y={M.top + 10} w={400}>
        <div style={{ display: "grid", gap: 22 }}>
          {tiers.map((tier, i) => {
            const hero = i === 0;
            return (
              <Stagger key={tier.floors} at={1} step={step} i={i} y={16} gap={0.1}>
                <div
                  style={{
                    borderTop: `2px solid ${hero ? C.gold : "rgba(43,42,40,0.16)"}`,
                    paddingTop: 16,
                    opacity: step >= 1 + i ? 1 : 0.34,
                    transition: "opacity 300ms",
                  }}
                >
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 20,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: hero ? C.gold : C.ash,
                    }}
                  >
                    {`${tier.floors} ${t(o.floorsLabel, lang)}`}
                  </div>
                  <div
                    className="tnum font-display"
                    style={{
                      marginTop: 8,
                      fontSize: hero ? 62 : 52,
                      fontWeight: hero ? 600 : 400,
                      letterSpacing: "-0.02em",
                      color: hero ? C.gold : C.ink,
                      lineHeight: 1,
                    }}
                  >
                    {usd(tier.usd)}
                  </div>
                </div>
              </Stagger>
            );
          })}
        </div>
      </At>

      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchLine
          x1={800}
          y1={M.top}
          x2={800}
          y2={M.bottom - 60}
          seed={41}
          amp={1.5}
          on={step >= 1}
          stroke="rgba(43,42,40,0.18)"
          width={1.5}
          duration={0.8}
        />
      </svg>
    </Slide>
  );
}

// ── first-day bonus ──────────────────────────────────────────────────────────

export function OfferFirstDay({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.firstDay;

  return (
    <Slide grid={false}>
      {/* Paper scrim, not the component's dark default: this slide sets ink
          text and dark chrome, and a black left ramp buried both. */}
      <Backdrop src="/media/renders/render-016.webp" theme="paper" scrim="left" opacity={0.5} />

      <At x={M.left} y={M.top + 70} w={820} z={10}>
        <Reveal at={0} step={step} y={16}>
          <Kicker color={C.gold}>{`${N.webinarDate.d}-${lang === "latn" ? "avgust" : "август"}, ${N.webinarDate.y}`}</Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={24} delay={0.08} style={{ marginTop: 24 }}>
          <Title size={88}>{t(o.title, lang)}</Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 36 }}>
          <Body size={32}>{t(o.body, lang)}</Body>
        </Reveal>

        <Reveal at={2} step={step} y={22} style={{ marginTop: 52 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 24,
              border: `2.5px solid ${C.forest}`,
              borderRadius: 14,
              padding: "26px 40px",
              background: "rgba(244,241,234,0.72)",
            }}
          >
            <span
              className="font-display"
              style={{ fontSize: 56, fontWeight: 600, color: C.forest, lineHeight: 1 }}
            >
              {t(o.badge, lang)}
            </span>
            <span style={{ fontSize: 30, fontWeight: 300, color: C.ink2 }}>
              {lang === "latn" ? "— sovgʻa" : "— совға"}
            </span>
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── instalments ──────────────────────────────────────────────────────────────

/**
 * Two columns, two ways to pay. Variant B is the one with the discount, so it
 * gets the gold border and lands one step after A — the audience compares
 * rather than chooses blind.
 */
export function OfferInstallments({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.installments;

  return (
    <Slide>
      <At x={M.left} y={M.top - 10} w={900}>
        <Reveal at={0} step={step} y={18}>
          <Title size={66}>{t(o.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.12} style={{ marginTop: 24 }}>
          <Rule w={130} color={C.gold} delay={0.18} />
        </Reveal>
      </At>

      <At x={M.left} y={318} w={1600}>
        <div style={{ height: 64 }}>
          <InstallmentVariants step={step} />
        </div>
      </At>

      <At x={M.left} y={420} w={760}>
        <Reveal at={1} step={step} y={22}>
          <PlanCard
            label={t(o.v1, lang)}
            downLabel={t(o.downLabel, lang)}
            down={soum(N.plans.a.down, lang)}
            terms={N.plans.a.terms.map((x) => ({
              months: `${x.months} ${t(o.monthsLabel, lang)}`,
              monthly: `${soum(x.monthly, lang)} / ${t(o.monthlyLabel, lang)}`,
            }))}
            or={t(o.or, lang)}
          />
        </Reveal>
      </At>

      <At x={1000} y={420} w={760}>
        <Reveal at={2} step={step} y={22}>
          <PlanCard
            accent
            label={t(o.v2, lang)}
            badge={`−${Math.round(N.plans.b.discount * 100)}% ${t(o.discountLabel, lang)}`}
            downLabel={t(o.downLabel, lang)}
            down={soum(N.plans.b.down, lang)}
            terms={N.plans.b.terms.map((x) => ({
              months: `${x.months} ${t(o.monthsLabel, lang)}`,
              monthly: `${soum(x.monthly, lang)} / ${t(o.monthlyLabel, lang)}`,
            }))}
            or={t(o.or, lang)}
            total={`${t(o.totalLabel, lang)} — ${num(N.plans.b.total)} ${lang === "latn" ? "soʻm" : "сўм"}`}
          />
        </Reveal>
      </At>

      <At x={M.left} y={866} w={1600}>
        <Reveal at={3} step={step} delay={0.1}>
          <Note size={30} color={C.forest}>
            {t(o.bonus, lang)}
          </Note>
        </Reveal>
      </At>
    </Slide>
  );
}

function PlanCard({
  label,
  badge,
  downLabel,
  down,
  terms,
  or,
  total,
  accent = false,
}: {
  label: string;
  badge?: string;
  downLabel: string;
  down: string;
  terms: { months: string; monthly: string }[];
  or: string;
  total?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        border: `${accent ? 2.5 : 1.5}px solid ${accent ? C.gold : "rgba(43,42,40,0.18)"}`,
        borderRadius: 14,
        padding: "34px 38px 32px",
        width: 760,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span
          className="font-mono"
          style={{
            fontSize: 21,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: accent ? C.gold : C.ash,
          }}
        >
          {label}
        </span>
        {badge && (
          <Chip color={C.gold} size={19} filled>
            {badge}
          </Chip>
        )}
      </div>

      <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontSize: 24, fontWeight: 300, color: C.ash }}>{downLabel}</span>
        <span
          className="tnum font-display"
          style={{ fontSize: 46, fontWeight: 500, color: C.ink, letterSpacing: "-0.02em" }}
        >
          {down}
        </span>
      </div>

      <div style={{ marginTop: 26, display: "grid", gap: 14 }}>
        {terms.map((x, i) => (
          <div key={i}>
            {i > 0 && (
              <div
                className="font-mono"
                style={{ fontSize: 18, color: C.ash, letterSpacing: "0.1em", marginBottom: 12 }}
              >
                {or}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span
                className="tnum font-mono"
                style={{ fontSize: 22, color: accent ? C.gold : C.forest, width: 108, flexShrink: 0 }}
              >
                {x.months}
              </span>
              <span style={{ fontSize: 29, fontWeight: 400, color: C.ink }}>{x.monthly}</span>
            </div>
          </div>
        ))}
      </div>

      {total && (
        <div style={{ marginTop: 26, paddingTop: 20, borderTop: `1.5px solid ${C.gold}` }}>
          <span className="tnum" style={{ fontSize: 26, fontWeight: 400, color: C.gold }}>
            {total}
          </span>
        </div>
      )}
    </div>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────────────

/**
 * One QR code, drawn from the build-time SVG. Zoom's encoder mangles thin dark
 * modules, so the code sits at 440 stage px on its own paper card with a wide
 * quiet zone, and the handle is printed underneath for anyone re-typing it.
 */
export function OfferCta({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.cta;
  const openLightbox = useLightbox();

  return (
    <Slide grid={false}>
      <At x={M.left} y={M.top + 90} w={820}>
        <Reveal at={0} step={step} y={18}>
          <Kicker color={C.forest}>{t(S.brand.company, lang)}</Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={24} delay={0.08} style={{ marginTop: 26 }}>
          <Title size={96}>{t(o.title, lang)}</Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 32 }}>
          <Rule w={160} color={C.forest} delay={0.26} />
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 40 }}>
          <Body size={32}>{t(o.body, lang)}</Body>
        </Reveal>
        <Reveal at={2} step={step} y={16} style={{ marginTop: 46 }}>
          <div
            className="font-mono"
            style={{ fontSize: 38, letterSpacing: "0.02em", color: C.forest }}
          >
            {t(o.handleFallback, lang)}
          </div>
        </Reveal>
      </At>

      <At x={1104} y={224} w={640}>
        <Reveal at={1} step={step} y={26} delay={0.12}>
          <div
            style={{
              width: 560,
              padding: 40,
              background: "#F4F1EA",
              border: `1.5px solid rgba(43,42,40,0.16)`,
              borderRadius: 10,
              cursor: "zoom-in",
            }}
            onClick={(e) => {
              e.stopPropagation();
              openLightbox({ kind: "image", src: "/media/qr/telegram.svg", bg: "paper" });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/qr/telegram.svg"
              alt=""
              draggable={false}
              onError={(e) => {
                e.currentTarget.style.opacity = "0";
              }}
              style={{ width: 480, height: 480, display: "block", margin: "0 auto" }}
            />
            <Caption size={24} align="center" style={{ marginTop: 26 }}>
              {t(o.scan, lang)}
            </Caption>
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── end ──────────────────────────────────────────────────────────────────────

export function OfferEnd({ step }: SlideProps) {
  const lang = useLang();
  const o = S.offer.end;

  return (
    <Slide theme="dark" grid={false}>
      <Backdrop src="/media/renders/render-008.webp" theme="dark" scrim="full" opacity={0.3} />

      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 10 }}>
        <div style={{ textAlign: "center", paddingBottom: 60 }}>
          <Reveal at={0} step={step} y={26}>
            <Title theme="dark" size={132} align="center">
              {t(o.title, lang)}
            </Title>
          </Reveal>
          <Reveal at={1} step={step} style={{ marginTop: 40 }}>
            <Lead theme="dark" align="center" color="#CFC8BA">
              {t(o.body, lang)}
            </Lead>
          </Reveal>
          <Reveal at={1} step={step} delay={0.16} style={{ marginTop: 64 }}>
            <div
              className="font-mono"
              style={{
                fontSize: 24,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#3ED66A",
              }}
            >
              {t(o.sign, lang)}
            </div>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}

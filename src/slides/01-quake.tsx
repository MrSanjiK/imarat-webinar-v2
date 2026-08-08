"use client";

import { STAGE_H, STAGE_W, type SlideProps } from "@/deck/types";
import { Reveal, Stagger } from "@/deck/Reveal";
import { VideoSlot } from "@/deck/VideoPool";
import { ExpandCorner, VideoExpand } from "@/deck/Lightbox";
import { useLang } from "@/content/lang";
import { num, t } from "@/content/i18n";
import { S } from "@/content/strings";
import { N } from "@/content/figures";
import {
  At,
  Body,
  Caption,
  Chip,
  Kicker,
  M,
  Note,
  Rule,
  Slide,
  Stat,
  Title,
  tone,
} from "@/ui/layout";
import { C, Counter, SketchLine, SketchRect } from "@/ui/sketch";
import { BearingWallPlan } from "@/ui/diagrams/BearingWallPlan";
import { MassPhysics } from "@/ui/diagrams/MassPhysics";
import { RebarCollapse } from "@/ui/diagrams/RebarCollapse";
import { PanelVsMonolith } from "@/ui/diagrams/PanelVsMonolith";
import { SeismicMapUZ } from "@/ui/diagrams/SeismicMapUZ";
import { TurkeyTimeline } from "@/ui/diagrams/TurkeyTimeline";
import { VibroOverlay } from "@/ui/diagrams/VibroOverlay";
import { ChapterOpener, StatementSlide } from "./common";

/**
 * Chapter 1 — the earthquake argument.
 *
 * Runs dark. It is the only part of the hour that is allowed to feel heavy, and
 * the contrast is what makes the paper chapters afterwards read as relief.
 */

const TH = "dark" as const;
const ACC = tone.ACCENT.dark;

/** Hairline frame around archive footage: a monitor, not a hero video. */
function Monitor({
  x,
  y,
  w,
  h,
  label,
  on,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  on: boolean;
}) {
  return (
    <>
      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 20 }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchRect
          x={x - 16}
          y={y - 16}
          w={w + 32}
          h={h + 32}
          seed={41}
          amp={1.4}
          on={on}
          stroke="rgba(244,241,234,0.34)"
          width={1.5}
          duration={0.9}
        />
      </svg>
      {label && (
        <div
          className="font-mono"
          style={{
            position: "absolute",
            left: x - 16,
            top: y + h + 30,
            fontSize: 17,
            letterSpacing: "0.16em",
            color: "rgba(244,241,234,0.42)",
            zIndex: 20,
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

// ── 01 · Chapter opener ──────────────────────────────────────────────────────

export function QuakeOpen({ step }: SlideProps) {
  return (
    <ChapterOpener
      n={1}
      step={step}
      theme={TH}
      title={S.chapters.c1.title}
      lead={S.chapters.c1.lead}
    />
  );
}

// ── 02 · 1966 ────────────────────────────────────────────────────────────────

export function Quake1966({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.y1966;

  return (
    <Slide theme={TH} grid={false}>
      <VideoSlot
        id="archive-1966-a"
        x={900}
        y={188}
        w={880}
        h={690}
        playing={step >= 1}
        loop
        muted
        fit="cover"
        z={8}
        opacity={step >= 1 ? 1 : 0.34}
      />
      {/* Height matches the slot above; the timecode hangs 30 px under it and
          has to clear the progress rail. */}
      <Monitor x={900} y={188} w={880} h={690} label={`${N.quake1966.date} · ${N.quake1966.time}`} on={step >= 1} />
      {step >= 1 && <VideoExpand id="archive-1966-a" x={900} y={188} w={880} h={690} />}

      <At x={M.left} y={M.top + 40} w={640}>
        <Reveal at={0} step={step} y={16}>
          <Kicker theme={TH} color={ACC}>
            {t(q.kicker, lang)}
          </Kicker>
        </Reveal>

        <Reveal at={0} step={step} y={22} delay={0.06} style={{ marginTop: 20 }}>
          <Title theme={TH} size={76}>
            {t(q.title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.16} style={{ marginTop: 30 }}>
          <Rule w={140} color={ACC} delay={0.2} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 30 }}>
          <Body theme={TH}>{t(q.body, lang)}</Body>
        </Reveal>
      </At>

      <At x={M.left} y={664} w={660}>
        <div style={{ display: "flex", gap: 84 }}>
          <Reveal at={2} step={step} y={20}>
            <Stat
              theme={TH}
              color={ACC}
              size={92}
              value={<Counter to={N.quake1966.homesDestroyed} on={step >= 2} format={(v) => num(Math.round(v))} />}
              label={q.statHomes}
            />
          </Reveal>
          <Reveal at={3} step={step} y={20}>
            <Stat
              theme={TH}
              color={ACC}
              size={92}
              value={<Counter to={N.quake1966.familiesHomeless} on={step >= 3} format={(v) => num(Math.round(v))} />}
              label={q.statFamilies}
            />
          </Reveal>
        </div>
      </At>

      <At x={M.left} y={848} w={640}>
        <Reveal at={3} step={step} delay={0.18}>
          <Note theme={TH} size={32} color="rgba(244,241,234,0.6)">
            {t(q.note, lang)}
          </Note>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 03 · Seismic map ─────────────────────────────────────────────────────────

export function QuakeSeismic({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.seismic;

  return (
    <Slide theme={TH}>
      <At x={M.left} y={M.top + 40} w={600}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={72}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 28 }}>
          <Body theme={TH}>{t(q.body, lang)}</Body>
        </Reveal>
        <Reveal at={3} step={step} style={{ marginTop: 44 }}>
          <Note theme={TH} size={34} color={ACC}>
            {t(q.annotation, lang)}
          </Note>
        </Reveal>
      </At>

      <At x={860} y={168} w={900}>
        <div style={{ height: 640 }}>
          <SeismicMapUZ step={step} />
        </div>
      </At>

      <At x={860} y={848} w={900}>
        <Reveal at={2} step={step}>
          <div style={{ display: "flex", gap: 40 }}>
            <Legend theme={TH} color={ACC} label={t(q.legendFault, lang)} />
            <Legend theme={TH} color={C.ember} label={t(q.legendCity, lang)} />
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

function Legend({ color, label, theme }: { color: string; label: string; theme: "paper" | "dark" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 26, height: 3, background: color, borderRadius: 2 }} />
      <Caption theme={theme}>{label}</Caption>
    </div>
  );
}

// ── 04 · Panel vs monolith ───────────────────────────────────────────────────

export function QuakePanelMonolith({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.panelVsMonolith;

  return (
    <Slide theme={TH} grid={false}>
      <At x={M.left} y={M.top} w={1200}>
        <Reveal at={0} step={step} y={18}>
          <Title theme={TH} size={68}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.1} style={{ marginTop: 22 }}>
          <Body theme={TH} size={28} style={{ maxWidth: 1100 }}>
            {t(q.body, lang)}
          </Body>
        </Reveal>
      </At>

      {/* Test condition, set as a spec note: the sentence, then the value on
          its own line. Inline the frequency and Cyrillic pushes it onto a
          second line anyway, orphaning an em dash at the start of it. */}
      <At x={1280} y={M.top} w={480}>
        <Reveal at={1} step={step}>
          <Caption theme={TH} size={21} style={{ textAlign: "right" }}>
            {t(q.caption, lang)}
          </Caption>
          <div
            className="font-mono"
            style={{
              marginTop: 8,
              textAlign: "right",
              fontSize: 22,
              letterSpacing: "0.1em",
              color: C.leaf,
            }}
          >
            {`${N.testing.vibroFrequencyHz} Hz`}
          </div>
        </Reveal>
      </At>

      <At x={M.left} y={352} w={1600}>
        <div style={{ height: 336 }}>
          <PanelVsMonolith step={step} />
        </div>
      </At>

      {/* Two evidence columns, revealed one at a time so the comparison lands. */}
      <At x={M.left} y={716} w={740}>
        <Reveal at={2} step={step} y={18}>
          <Chip theme={TH} color="rgba(244,241,234,0.55)" size={19}>
            {t(q.leftLabel, lang)}
          </Chip>
          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            {q.leftPoints.map((p, i) => (
              <Stagger key={i} at={2} step={step} i={i} y={10}>
                <Caption theme={TH} size={24} color="rgba(244,241,234,0.66)">
                  {t(p, lang)}
                </Caption>
              </Stagger>
            ))}
          </div>
        </Reveal>
      </At>

      <At x={1020} y={716} w={740}>
        <Reveal at={3} step={step} y={18}>
          <Chip theme={TH} color={ACC} size={19}>
            {t(q.rightLabel, lang)}
          </Chip>
          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            {q.rightPoints.map((p, i) => (
              <Stagger key={i} at={3} step={step} i={i} y={10}>
                <Caption theme={TH} size={24} color="rgba(244,241,234,0.86)">
                  {t(p, lang)}
                </Caption>
              </Stagger>
            ))}
          </div>
        </Reveal>
      </At>

    </Slide>
  );
}

// ── 05 · Mass ────────────────────────────────────────────────────────────────

export function QuakeMass({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.mass;

  return (
    <Slide theme={TH}>
      <At x={M.left} y={M.top + 40} w={620}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={68}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 28 }}>
          <Body theme={TH}>{t(q.body, lang)}</Body>
        </Reveal>

        <Reveal at={2} step={step} style={{ marginTop: 52 }}>
          <div
            className="font-display tnum"
            style={{ fontSize: 84, fontWeight: 500, color: ACC, letterSpacing: "0.02em" }}
          >
            {q.formula}
          </div>
          <Note theme={TH} size={30} style={{ marginTop: 14 }}>
            {t(q.formulaNote, lang)}
          </Note>
        </Reveal>

        <Reveal at={3} step={step} style={{ marginTop: 44 }}>
          <Chip theme={TH} color={ACC} filled size={20}>
            {t(q.result, lang)}
          </Chip>
        </Reveal>
      </At>

      <At x={880} y={200} w={880}>
        <div style={{ height: 600 }}>
          <MassPhysics step={step} />
        </div>
      </At>

      <At x={880} y={836} w={880}>
        <Reveal at={1} step={step}>
          <div style={{ display: "flex", gap: 60 }}>
            <Caption theme={TH}>
              {`${t(q.brickLabel, lang)} — ${N.materials.brickWallDensity[0]}–${N.materials.brickWallDensity[1]} ${q.unit}`}
            </Caption>
            <Caption theme={TH} color={ACC}>
              {`${t(q.blockLabel, lang)} — ${N.materials.aeratedDensity[0]}–${N.materials.aeratedDensity[1]} ${q.unit}`}
            </Caption>
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 06 · Bearing walls ───────────────────────────────────────────────────────

export function QuakeBearing({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.bearing;

  return (
    <Slide theme={TH}>
      <At x={M.left} y={M.top + 40} w={640}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={68}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 28 }}>
          <Body theme={TH}>{t(q.body, lang)}</Body>
        </Reveal>

        <Reveal at={1} step={step} delay={0.1} style={{ marginTop: 44 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <Legend theme={TH} color={C.ember} label={t(q.pointA, lang)} />
            <Legend theme={TH} color="rgba(244,241,234,0.45)" label={t(q.pointB, lang)} />
          </div>
        </Reveal>

        <Reveal at={2} step={step} style={{ marginTop: 48 }}>
          <div
            style={{
              borderLeft: `3px solid ${C.ember}`,
              paddingLeft: 22,
            }}
          >
            <Body theme={TH} size={30} color="rgba(244,241,234,0.92)">
              {t(q.warn, lang)}
            </Body>
          </div>
        </Reveal>
      </At>

      {/* The plan dimensions every bay itself and the body copy already states
          the 3–6 m spacing, so a third unanchored copy of the figure below the
          drawing only read as a stray label. */}
      <At x={900} y={200} w={860}>
        <div style={{ height: 600 }}>
          <BearingWallPlan step={step} />
        </div>
      </At>
    </Slide>
  );
}

// ── 07 · Rebar cut → progressive collapse ────────────────────────────────────

export function QuakeRebar({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.rebar;
  const stages = [q.step1, q.step2, q.step3, q.step4];

  return (
    <Slide theme={TH} grid={false}>
      <At x={M.left} y={M.top} w={1100}>
        <Reveal at={0} step={step} y={18}>
          <Title theme={TH} size={68}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={0} step={step} delay={0.1} style={{ marginTop: 22 }}>
          <Body theme={TH} size={28} style={{ maxWidth: 1000 }}>
            {t(q.body, lang)}
          </Body>
        </Reveal>
      </At>

      <At x={M.left} y={352} w={1600}>
        <div style={{ height: 420 }}>
          <RebarCollapse step={step} />
        </div>
      </At>

      {/* Stage ticker: the diagram's own caption line. Sits at 790 so the
          punchline below it clears M.bottom — at 806 the ticker ran to 887 and
          left the note no room above the chrome. */}
      <At x={M.left} y={790} w={1600}>
        <div style={{ display: "flex", gap: 0 }}>
          {stages.map((s, i) => {
            const on = step >= i + 1;
            return (
              <div key={i} style={{ flex: 1, paddingRight: 32 }}>
                <div
                  style={{
                    height: 2,
                    background: on ? (i >= 2 ? C.ember : ACC) : "rgba(244,241,234,0.16)",
                    borderRadius: 2,
                    transition: "background 300ms",
                  }}
                />
                <div
                  className="font-mono"
                  style={{
                    marginTop: 14,
                    fontSize: 17,
                    letterSpacing: "0.1em",
                    color: on ? "rgba(244,241,234,0.5)" : "rgba(244,241,234,0.24)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 25,
                    fontWeight: 300,
                    lineHeight: 1.25,
                    color: on ? "rgba(244,241,234,0.92)" : "rgba(244,241,234,0.3)",
                    transition: "color 300ms",
                  }}
                >
                  {t(s, lang)}
                </div>
              </div>
            );
          })}
        </div>
      </At>

      {/* 900, not STAGE_H − 116: this is the one slide carrying a four-column
          ticker *and* a punchline, and at 964 the punchline sat on top of the
          chapter tag. 28 rather than the usual 32 for the same reason. */}
      <At x={M.left} y={900} w={900}>
        <Reveal at={4} step={step}>
          <Note theme={TH} size={28} color={C.ember}>
            {t(q.note, lang)}
          </Note>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 08 · Turkey ──────────────────────────────────────────────────────────────

export function QuakeTurkey({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.turkey;

  return (
    <Slide theme={TH} grid={false}>
      {/* Diptych: landscape footage left, portrait footage right, hairline gap. */}
      <VideoSlot
        id="turkey-long"
        x={0}
        y={0}
        w={1180}
        h={STAGE_H}
        playing={step >= 1}
        loop
        muted
        fit="cover"
        z={4}
        opacity={0.32}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          background:
            "linear-gradient(90deg, rgba(20,19,18,0.94) 0%, rgba(20,19,18,0.86) 44%, rgba(20,19,18,0.7) 100%)",
        }}
      />
      {step >= 1 && <ExpandCorner item={{ kind: "video", id: "turkey-long" }} />}

      <At x={M.left} y={M.top + 20} w={720} z={10}>
        <Reveal at={0} step={step} y={18}>
          <Kicker theme={TH} color={C.ember}>
            {`${N.turkey.date} · M${N.turkey.magnitude}`}
          </Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={22} delay={0.06} style={{ marginTop: 20 }}>
          <Title theme={TH} size={76}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 28 }}>
          <Body theme={TH}>{t(q.body, lang)}</Body>
        </Reveal>

        <div style={{ marginTop: 46, display: "grid", gap: 18 }}>
          {[q.t1999, q.t2018, q.t2023].map((line, i) => (
            <Stagger key={i} at={2} step={step} i={i} x={-14} y={0}>
              <div style={{ display: "flex", gap: 18, alignItems: "baseline" }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: i === 2 ? C.ember : "rgba(244,241,234,0.45)",
                    flexShrink: 0,
                  }}
                />
                <Caption theme={TH} size={25} color="rgba(244,241,234,0.82)">
                  {t(line, lang)}
                </Caption>
              </div>
            </Stagger>
          ))}
        </div>

        <div style={{ marginTop: 52, display: "flex", gap: 76 }}>
          <Reveal at={3} step={step} y={16}>
            <Stat
              theme={TH}
              color="rgba(244,241,234,0.92)"
              size={72}
              value={<Counter to={N.turkey.amnestyBuildings} on={step >= 3} format={(v) => num(Math.round(v))} />}
              label={q.amnestyLabel}
              labelSize={21}
            />
          </Reveal>
          <Reveal at={4} step={step} y={16}>
            <Stat
              theme={TH}
              color={C.ember}
              size={72}
              value={
                <>
                  ~<Counter to={N.turkey.deaths} on={step >= 4} format={(v) => num(Math.round(v))} />
                </>
              }
              label={q.deathsLabel}
              labelSize={21}
            />
          </Reveal>
        </div>
      </At>

      {/* Sea-sand side note. */}
      <At x={1140} y={M.top + 20} w={620} z={10}>
        <Reveal at={2} step={step} x={18} y={0} delay={0.16}>
          <div
            style={{
              border: "1.5px solid rgba(244,241,234,0.22)",
              borderRadius: 10,
              padding: "36px 34px",
              background: "rgba(20,19,18,0.55)",
            }}
          >
            <Kicker theme={TH} color={C.gold}>
              {t(q.seaSandTitle, lang)}
            </Kicker>
            <Body theme={TH} size={27} style={{ marginTop: 20 }}>
              {t(q.seaSandBody, lang)}
            </Body>
          </div>
        </Reveal>
      </At>

      <At x={1140} y={520} w={620} z={10}>
        <Reveal at={3} step={step} delay={0.1}>
          <div style={{ height: 340 }}>
            <TurkeyTimeline step={step} />
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 09 · Vibrodynamic test ───────────────────────────────────────────────────

export function QuakeVibro({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.vibro;

  // Portrait clip, framed as a masked column — never letterboxed.
  const vx = 1216;
  const vw = 544;
  const vh = 968;
  const vy = 56;

  return (
    <Slide theme={TH} grid={false}>
      <VideoSlot
        id="vibro"
        x={vx}
        y={vy}
        w={vw}
        h={vh}
        radius={8}
        playing={step >= 1}
        loop
        muted
        fit="cover"
        z={8}
      />
      <Monitor x={vx} y={vy} w={vw} h={vh} on={step >= 1} />
      {step >= 1 && <VideoExpand id="vibro" x={vx} y={vy} w={vw} h={vh} radius={8} />}

      <At x={M.left} y={M.top + 30} w={620}>
        <Reveal at={0} step={step} y={16}>
          <Kicker theme={TH} color={ACC}>
            {t(q.subtitle, lang)}
          </Kicker>
        </Reveal>
        <Reveal at={0} step={step} y={22} delay={0.06} style={{ marginTop: 20 }}>
          <Title theme={TH} size={76}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 28 }}>
          <Body theme={TH}>{t(q.body, lang)}</Body>
        </Reveal>
      </At>

      {/* The diagram calls out the accelerometer, the exciter and the MSK 8–9
          band in place, next to the thing each one names, and stamps the trace
          it certifies. A detached key and a second stamp out here only competed
          with it — the key's third row landed on top of the exciter callout. */}
      <At x={M.left} y={636} w={1000}>
        <div style={{ height: 230 }}>
          <VibroOverlay step={step} />
        </div>
      </At>
    </Slide>
  );
}

// ── 10 · Own laboratory ──────────────────────────────────────────────────────

export function QuakeLab({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.vibro;

  return (
    <Slide theme={TH}>
      <At x={M.left} y={M.top + 60} w={700}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={72}>
            {t(q.labTitle, lang)}
          </Title>
        </Reveal>
        <Reveal at={1} step={step} style={{ marginTop: 30 }}>
          <Body theme={TH}>{t(q.labBody, lang)}</Body>
        </Reveal>
      </At>

      {/* The cards carry the same measure as the rule above them. At a fixed
          300 px they clustered into the left third and left the right half of a
          dark slide empty, which reads as an unfinished slide rather than as
          air; stretched, the row becomes a spec band. */}
      <At x={M.left} y={520} w={1600}>
        <div style={{ display: "flex", gap: 40 }}>
          {N.testing.pressTonnes.map((tn, i) => (
            <Stagger key={tn} at={2} step={step} i={i} y={22} gap={0.1} style={{ flex: 1 }}>
              <div
                style={{
                  padding: "48px 44px",
                  border: "1.5px solid rgba(244,241,234,0.2)",
                  borderRadius: 12,
                }}
              >
                <div
                  className="tnum font-display"
                  style={{ fontSize: 96, lineHeight: 1, fontWeight: 600, color: ACC }}
                >
                  <Counter to={tn} on={step >= 2} format={(v) => String(Math.round(v))} />
                </div>
                <Caption theme={TH} style={{ marginTop: 14 }}>
                  {lang === "latn" ? "tonna" : "тонна"}
                </Caption>
              </div>
            </Stagger>
          ))}
        </div>
      </At>

      <At x={M.left} y={856} w={1100}>
        <Reveal at={2} step={step} delay={0.36}>
          <Note theme={TH} size={32}>
            {lang === "latn"
              ? "Har partiya beton — o‘z laboratoriyamizda sinaladi."
              : "Ҳар партия бетон — ўз лабораториямизда синалади."}
          </Note>
        </Reveal>
      </At>

      <svg
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        width={STAGE_W}
        height={STAGE_H}
      >
        <SketchLine
          x1={M.left}
          y1={470}
          x2={STAGE_W - M.right}
          y2={470}
          seed={9}
          amp={1.4}
          on={step >= 1}
          stroke="rgba(244,241,234,0.2)"
          width={1.5}
          duration={1}
        />
      </svg>
    </Slide>
  );
}

// ── 11 · Chapter close ───────────────────────────────────────────────────────

export function QuakeClose({ step }: SlideProps) {
  return (
    <StatementSlide
      step={step}
      active
      theme={TH}
      title={S.quake.close.title}
      accentTitle={S.quake.close.answer}
      body={S.quake.close.body}
    />
  );
}

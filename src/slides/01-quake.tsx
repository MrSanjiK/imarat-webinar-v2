"use client";

import { motion } from "motion/react";
import { EASE, STAGE_H, type SlideProps } from "@/deck/types";
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
  Rule,
  Slide,
  Stat,
  Title,
  tone,
} from "@/ui/layout";
import { Card, CountUp, Glow, Mesh, V } from "@/ui/vivid";
import { BearingWallPlan } from "@/ui/diagrams/BearingWallPlan";
import { MassPhysics } from "@/ui/diagrams/MassPhysics";
import { RebarCollapse } from "@/ui/diagrams/RebarCollapse";
import { PanelVsMonolith } from "@/ui/diagrams/PanelVsMonolith";
import { SeismicMapUZ } from "@/ui/diagrams/SeismicMapUZ";
import { TurkeyTimeline } from "@/ui/diagrams/TurkeyTimeline";
import { VibroOverlay } from "@/ui/diagrams/VibroOverlay";
import { ChapterOpener, StatementSlide } from "./common";

/**
 * Chapter 1 — the earthquake argument, in "IMARAT Vivid".
 *
 * The only dark chapter. Night ground, near-white type, emerald for what holds
 * and ember for what fails — nothing else is allowed to be red. It runs on one
 * oversized element per slide and as few words as the argument survives on:
 * the presenter is the narration, the stage is the evidence.
 */

const TH = "dark" as const;
const ACC = tone.ACCENT.dark;

/** Near-white bodies on night, at the three weights this chapter needs. */
const PAPER = "rgba(244,251,244,0.94)";
const PAPER_2 = "rgba(214,236,220,0.72)";
const PAPER_3 = "rgba(214,236,220,0.40)";

/**
 * Rounded frame drawn over a pool video. The clip itself lives in the pool
 * layer with its own radius; this is only the hairline and the light it sits
 * in, so nothing here can ever cover the picture.
 */
function VideoFrame({
  x,
  y,
  w,
  h,
  radius = 32,
  on,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  on: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ opacity: on ? 1 : 0.34, scale: on ? 1 : 0.985 }}
      transition={{ duration: 0.7, ease: EASE }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: radius,
        border: "1.5px solid rgba(62,214,106,0.34)",
        boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
        pointerEvents: "none",
        zIndex: 20,
      }}
    />
  );
}

/** Colour key row: a fat emerald/ember bar, then the thing it names. */
function Key({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ width: 34, height: 6, borderRadius: 3, background: color, flexShrink: 0 }} />
      <Caption theme={TH} size={24} color={PAPER_2}>
        {label}
      </Caption>
    </div>
  );
}

// ── 01 · Chapter opener ──────────────────────────────────────────────────────

/**
 * Deliberately imageless. A Sergeli City render behind a heading about
 * buildings killing people would read as advertising the disaster, so the
 * chapter opens on type alone: the bleeding numeral, the word, the rule.
 */
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

/**
 * Steps: 0 the date and the sentence · 1 the archive footage starts · 2 the
 * homes · 3 the families, then the line that turns the whole chapter — the
 * force was ordinary, the construction was not.
 */
export function Quake1966({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.y1966;

  const vx = 900;
  const vy = 188;
  const vw = 880;
  const vh = 690;

  return (
    <Slide theme={TH} grid={false}>
      <Mesh variant="night" />
      <Glow x={1340} y={520} r={470} color="0,168,104" opacity={0.2} />

      <VideoSlot
        id="archive-1966-a"
        x={vx}
        y={vy}
        w={vw}
        h={vh}
        radius={32}
        playing={step >= 1}
        loop
        muted
        fit="cover"
        z={8}
        opacity={step >= 1 ? 1 : 0.26}
      />
      <VideoFrame x={vx} y={vy} w={vw} h={vh} on={step >= 1} />
      {step >= 1 && <VideoExpand id="archive-1966-a" x={vx} y={vy} w={vw} h={vh} radius={32} />}

      {/* Mono timecode under the frame, clear of the progress rail at 988. */}
      <At x={vx} y={vy + vh + 26} w={vw} z={21}>
        <Reveal at={1} step={step} y={10} delay={0.24}>
          <div
            className="font-mono tnum"
            style={{ fontSize: 20, letterSpacing: "0.18em", color: PAPER_3 }}
          >
            {`${N.quake1966.date} · ${N.quake1966.time}`}
          </div>
        </Reveal>
      </At>

      <At x={M.left} y={190} w={680}>
        <Reveal at={0} step={step} y={16}>
          <Chip theme={TH} color={ACC} size={20}>
            {t(q.kicker, lang)}
          </Chip>
        </Reveal>

        <Reveal at={0} step={step} y={24} delay={0.08} style={{ marginTop: 30 }}>
          <Title theme={TH} size={52} style={{ maxWidth: 660, letterSpacing: "-0.022em" }}>
            {t(q.title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.2} style={{ marginTop: 34 }}>
          <Rule w={160} color={V.gold} thickness={4} delay={0.26} />
        </Reveal>
      </At>

      <At x={M.left} y={570} w={680}>
        <div style={{ display: "flex", gap: 60 }}>
          <Reveal at={2} step={step} y={22} style={{ width: 310 }}>
            <Stat
              theme={TH}
              color={ACC}
              size={84}
              labelSize={20}
              value={<CountUp to={N.quake1966.homesDestroyed} on={step >= 2} format={num} />}
              label={q.statHomes}
            />
          </Reveal>
          <Reveal at={3} step={step} y={22} style={{ width: 310 }}>
            <Stat
              theme={TH}
              color={ACC}
              size={84}
              labelSize={20}
              value={<CountUp to={N.quake1966.familiesHomeless} on={step >= 3} format={num} />}
              label={q.statFamilies}
            />
          </Reveal>
        </div>
      </At>

      <At x={M.left} y={744} w={680}>
        <Reveal at={3} step={step} delay={0.22}>
          <div style={{ borderLeft: `4px solid ${V.ember}`, paddingLeft: 26 }}>
            <Body theme={TH} size={31} color={PAPER}>
              {t(q.note, lang)}
            </Body>
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 03 · Seismic map ─────────────────────────────────────────────────────────

/**
 * Steps: 0 the claim · 1 the land draws · 2 the faults and their key · 3 the
 * city and the question · 4 the map pushes in on Tashkent. The diagram owns
 * two thirds of the stage; the column beside it is four short lines.
 */
export function QuakeSeismic({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.seismic;

  return (
    <Slide theme={TH} grid={false}>
      <Mesh variant="night" />
      <Glow x={1240} y={540} r={520} color="0,168,104" opacity={0.18} />

      <At x={650} y={128} w={1130} z={4}>
        <div style={{ height: 790 }}>
          <SeismicMapUZ step={step} />
        </div>
      </At>

      <At x={M.left} y={180} w={460} z={10}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={42} style={{ letterSpacing: "-0.02em" }}>
            {t(q.title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.16} style={{ marginTop: 40 }}>
          <Rule w={130} color={V.gold} thickness={4} delay={0.22} />
        </Reveal>
      </At>

      <At x={M.left} y={476} w={460} z={10}>
        <div style={{ display: "grid", gap: 20 }}>
          <Stagger at={2} step={step} i={0} y={12}>
            <Key color={ACC} label={t(q.legendFault, lang)} />
          </Stagger>
          <Stagger at={2} step={step} i={1} y={12}>
            <Key color={V.ember} label={t(q.legendCity, lang)} />
          </Stagger>
        </div>
      </At>

      <At x={M.left} y={636} w={470} z={10}>
        <Reveal at={3} step={step} y={20}>
          <Title theme={TH} size={36} color={V.leaf} style={{ lineHeight: 1.26 }}>
            {t(q.annotation, lang)}
          </Title>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 04 · Panel vs monolith ───────────────────────────────────────────────────

/**
 * Steps: 0 the pair · 1 the test condition and the shake begins · 2 what the
 * panel house is made of · 3 what the frame is made of. The two spec cards
 * arrive one at a time so the comparison is read, not scanned.
 */
export function QuakePanelMonolith({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.panelVsMonolith;

  return (
    <Slide theme={TH} grid={false}>
      <Mesh variant="night" />

      <At x={M.left} y={112} w={1040}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={46} style={{ letterSpacing: "-0.025em" }}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
      </At>

      {/* The test condition, stamped as a figure. Inline, the frequency pushes
          the sentence onto a second line and orphans the em dash. */}
      <At x={1240} y={124} w={520}>
        <Reveal at={1} step={step} y={14} style={{ textAlign: "right" }}>
          <Chip theme={TH} color={V.gold} filled size={22}>
            {`${N.testing.vibroFrequencyHz} Hz`}
          </Chip>
          <Caption theme={TH} size={21} color={PAPER_3} align="right" style={{ marginTop: 16 }}>
            {t(q.caption, lang)}
          </Caption>
        </Reveal>
      </At>

      <At x={M.left} y={262} w={1600}>
        <div style={{ height: 368 }}>
          <PanelVsMonolith step={step} />
        </div>
      </At>

      {/* No chip on either card: each one sits directly under the body it
          describes and the diagram already names that body in a pill. A header
          here restated the same two words a hand's width apart. The border
          carries the colour coding instead. */}
      <At x={M.left} y={648} w={740}>
        <Reveal at={2} step={step} y={26}>
          <Card
            dark
            h={280}
            radius={28}
            style={{
              width: "100%",
              padding: "30px 34px",
              borderColor: "rgba(255,90,60,0.30)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 10, width: "100%" }}>
              {q.leftPoints.map((p, i) => (
                <Stagger key={i} at={2} step={step} i={i} y={10}>
                  <Caption theme={TH} size={24} color={PAPER_2}>
                    {t(p, lang)}
                  </Caption>
                </Stagger>
              ))}
            </div>
          </Card>
        </Reveal>
      </At>

      <At x={1020} y={648} w={740}>
        <Reveal at={3} step={step} y={26}>
          <Card
            dark
            h={280}
            radius={28}
            style={{
              width: "100%",
              padding: "30px 34px",
              borderColor: "rgba(62,214,106,0.34)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 10, width: "100%" }}>
              {q.rightPoints.map((p, i) => (
                <Stagger key={i} at={3} step={step} i={i} y={10}>
                  <Caption theme={TH} size={24} color={PAPER}>
                    {t(p, lang)}
                  </Caption>
                </Stagger>
              ))}
            </div>
          </Card>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 05 · Mass ────────────────────────────────────────────────────────────────

/**
 * Steps: 0 the claim · 1 the two wall masses · 2 F = m · a · 3 the result.
 * The formula is the oversized element — it is the one line of the hour that
 * an engineer and a first-time buyer both already understand.
 */
export function QuakeMass({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.mass;

  return (
    <Slide theme={TH} grid={false}>
      <Mesh variant="night" />
      <Glow x={1280} y={470} r={460} color="0,168,104" opacity={0.16} />

      <At x={780} y={160} w={1000}>
        <div style={{ height: 650 }}>
          <MassPhysics step={step} />
        </div>
      </At>

      <At x={780} y={838} w={1000}>
        <Reveal at={1} step={step} y={12}>
          <div style={{ display: "flex", gap: 56 }}>
            <Caption theme={TH} size={22} color={PAPER_3}>
              {`${t(q.brickLabel, lang)} — ${N.materials.brickWallDensity[0]}–${N.materials.brickWallDensity[1]} ${q.unit}`}
            </Caption>
            <Caption theme={TH} size={22} color={ACC}>
              {`${t(q.blockLabel, lang)} — ${N.materials.aeratedDensity[0]}–${N.materials.aeratedDensity[1]} ${q.unit}`}
            </Caption>
          </div>
        </Reveal>
      </At>

      <At x={M.left} y={168} w={580}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={44} style={{ letterSpacing: "-0.02em" }}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
      </At>

      <At x={M.left} y={400} w={580}>
        <Reveal at={0} step={step} delay={0.14}>
          <Rule w={130} color={V.gold} thickness={4} delay={0.2} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 42 }}>
          <Body theme={TH} size={27} color={PAPER_2}>
            {t(q.body, lang)}
          </Body>
        </Reveal>
      </At>

      <At x={M.left} y={640} w={580}>
        <Reveal at={2} step={step} y={22}>
          <div
            className="font-display tnum"
            style={{
              fontSize: 84,
              lineHeight: 1,
              fontWeight: 600,
              color: ACC,
              letterSpacing: "0.01em",
            }}
          >
            {q.formula}
          </div>
          <Caption theme={TH} size={25} color={PAPER_2} style={{ marginTop: 16 }}>
            {t(q.formulaNote, lang)}
          </Caption>
        </Reveal>
      </At>

      <At x={M.left} y={820} w={580}>
        <Reveal at={3} step={step} y={18}>
          <Chip theme={TH} color={ACC} filled size={21}>
            {t(q.result, lang)}
          </Chip>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 06 · Bearing walls ───────────────────────────────────────────────────────

/**
 * Steps: 0 the rule · 1 the plan draws and its key · 2 what a bearing wall
 * does · 3 the middle cross-wall is taken out and the warning lands with it.
 */
export function QuakeBearing({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.bearing;

  return (
    <Slide theme={TH} grid={false}>
      <Mesh variant="night" />
      <Glow x={1270} y={500} r={470} color="0,168,104" opacity={0.16} />

      <At x={760} y={150} w={1020}>
        <div style={{ height: 700 }}>
          <BearingWallPlan step={step} />
        </div>
      </At>

      <At x={M.left} y={168} w={560}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={44} style={{ letterSpacing: "-0.02em" }}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
      </At>

      <At x={M.left} y={428} w={560}>
        <Reveal at={0} step={step} delay={0.14}>
          <Rule w={130} color={V.gold} thickness={4} delay={0.2} />
        </Reveal>

        <div style={{ marginTop: 46, display: "grid", gap: 20 }}>
          <Stagger at={1} step={step} i={0} y={12}>
            <Key color={V.ember} label={t(q.pointA, lang)} />
          </Stagger>
          <Stagger at={1} step={step} i={1} y={12}>
            <Key color={PAPER_3} label={t(q.pointB, lang)} />
          </Stagger>
        </div>
      </At>

      <At x={M.left} y={614} w={560}>
        <Reveal at={2} step={step}>
          <Body theme={TH} size={27} color={PAPER_2}>
            {t(q.body, lang)}
          </Body>
        </Reveal>
      </At>

      <At x={M.left} y={796} w={560}>
        <Reveal at={3} step={step} y={20}>
          <div style={{ borderLeft: `4px solid ${V.ember}`, paddingLeft: 26 }}>
            <Body theme={TH} size={29} color={PAPER}>
              {t(q.warn, lang)}
            </Body>
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 07 · Rebar cut → progressive collapse ────────────────────────────────────

/**
 * Chapter climax. The diagram runs nearly edge to edge and everything else is
 * a caption: title top-left, the punchline top-right at the last beat, and a
 * four-column ticker under the drawing that names each stage as it happens.
 *
 * Steps 1–4 map one-to-one onto the four ticker columns, so the presenter can
 * read the stage name off the screen without looking back at the notes.
 */
export function QuakeRebar({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.rebar;
  const stages = [q.step1, q.step2, q.step3, q.step4];

  return (
    <Slide theme={TH} grid={false}>
      <Mesh variant="night" />

      <At x={M.left} y={116} w={900}>
        <Reveal at={0} step={step} y={20}>
          <Title theme={TH} size={48} style={{ letterSpacing: "-0.022em" }}>
            {t(q.title, lang)}
          </Title>
        </Reveal>
      </At>

      <At x={1120} y={132} w={640}>
        <Reveal at={4} step={step} y={18}>
          <Body theme={TH} size={30} color={V.ember} align="right">
            {t(q.note, lang)}
          </Body>
        </Reveal>
      </At>

      <At x={110} y={300} w={1700}>
        <div style={{ height: 446 }}>
          <RebarCollapse step={step} />
        </div>
      </At>

      <At x={M.left} y={782} w={1600}>
        <div style={{ display: "flex" }}>
          {stages.map((s, i) => {
            const on = step >= i + 1;
            // Damage is ember from the third stage on — the first two beats are
            // still a drawing of a column, not yet a failure.
            const fill = i >= 2 ? V.ember : ACC;
            return (
              <div key={i} style={{ flex: 1, paddingRight: 34 }}>
                <div
                  style={{
                    position: "relative",
                    height: 3,
                    borderRadius: 3,
                    background: "rgba(214,236,220,0.16)",
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{ scaleX: on ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: fill,
                      borderRadius: 3,
                      transformOrigin: "left center",
                    }}
                  />
                </div>
                <Reveal at={i + 1} step={step} y={12} delay={0.08}>
                  <div
                    className="font-mono tnum"
                    style={{
                      marginTop: 16,
                      fontSize: 18,
                      letterSpacing: "0.14em",
                      color: fill,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 24,
                      fontWeight: 300,
                      lineHeight: 1.3,
                      color: PAPER,
                    }}
                  >
                    {t(s, lang)}
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </At>
    </Slide>
  );
}

// ── 08 · Turkey ──────────────────────────────────────────────────────────────

/**
 * Steps: 0 the date and the name · 1 the footage runs · 2 the three-line
 * chronology and the sea-sand note · 3 the seven million legalised buildings ·
 * 4 the toll. The footage is ground, not illustration: it stays at a third of
 * its own opacity under a hard scrim so the numbers keep the eye.
 */
export function QuakeTurkey({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.turkey;

  return (
    <Slide theme={TH} grid={false}>
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
            "linear-gradient(90deg, rgba(5,24,16,0.95) 0%, rgba(5,24,16,0.88) 46%, rgba(5,24,16,0.74) 100%)",
        }}
      />
      {step >= 1 && <ExpandCorner item={{ kind: "video", id: "turkey-long" }} />}

      <At x={M.left} y={150} w={680} z={10}>
        <Reveal at={0} step={step} y={16}>
          <Kicker theme={TH} color={V.ember} size={21} className="tnum">
            {`${N.turkey.date} · M${N.turkey.magnitude}`}
          </Kicker>
        </Reveal>

        <Reveal at={0} step={step} y={24} delay={0.08} style={{ marginTop: 26 }}>
          <Title theme={TH} size={62} style={{ letterSpacing: "-0.028em" }}>
            {t(q.title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.22} style={{ marginTop: 34 }}>
          <Rule w={150} color={V.ember} thickness={4} delay={0.28} />
        </Reveal>
      </At>

      <At x={M.left} y={438} w={680} z={10}>
        <div style={{ display: "grid", gap: 18 }}>
          {[q.t1999, q.t2018, q.t2023].map((line, i) => (
            <Stagger key={i} at={2} step={step} i={i} x={-16} y={0} gap={0.08}>
              <div style={{ display: "flex", gap: 18, alignItems: "baseline" }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    background: i === 2 ? V.ember : PAPER_3,
                    flexShrink: 0,
                  }}
                />
                <Caption theme={TH} size={23} color={i === 2 ? PAPER : PAPER_2}>
                  {t(line, lang)}
                </Caption>
              </div>
            </Stagger>
          ))}
        </div>
      </At>

      <At x={M.left} y={706} w={680} z={10}>
        <div style={{ display: "flex", gap: 60 }}>
          <Reveal at={3} step={step} y={18} style={{ width: 330 }}>
            <Stat
              theme={TH}
              color={PAPER}
              size={58}
              labelSize={19}
              value={<CountUp to={N.turkey.amnestyBuildings} on={step >= 3} format={num} />}
              label={q.amnestyLabel}
            />
          </Reveal>
          <Reveal at={4} step={step} y={18} style={{ width: 280 }}>
            <Stat
              theme={TH}
              color={V.ember}
              size={58}
              labelSize={19}
              value={
                <>
                  ~<CountUp to={N.turkey.deaths} on={step >= 4} format={num} />
                </>
              }
              label={q.deathsLabel}
            />
          </Reveal>
        </div>
      </At>

      {/* The quiet half of the lesson: the failure you cannot see from outside. */}
      <At x={1120} y={140} w={640} z={10}>
        <Reveal at={2} step={step} x={20} y={0} delay={0.14}>
          <Card dark h={306} radius={28} style={{ width: "100%", padding: "34px 36px" }}>
            <Kicker theme={TH} color={V.gold} size={21}>
              {t(q.seaSandTitle, lang)}
            </Kicker>
            <Body theme={TH} size={25} color={PAPER_2} style={{ marginTop: 20 }}>
              {t(q.seaSandBody, lang)}
            </Body>
          </Card>
        </Reveal>
      </At>

      <At x={1120} y={500} w={640} z={10}>
        <Reveal at={3} step={step} delay={0.1}>
          <div style={{ height: 364 }}>
            <TurkeyTimeline step={step} />
          </div>
        </Reveal>
      </At>
    </Slide>
  );
}

// ── 09 · Vibrodynamic test ───────────────────────────────────────────────────

/**
 * Steps: 0 the name of the test · 1 the clip runs and the instrument frame
 * appears · 2 the trace runs at the MSK band · 3 the certificate stamp.
 * The overlay reads the same `step`, so the trace and the footage are one
 * instrument, not a video with a decoration next to it.
 */
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
      <Mesh variant="night" />
      <Glow x={900} y={420} r={480} color="0,168,104" opacity={0.16} />

      <VideoSlot
        id="vibro"
        x={vx}
        y={vy}
        w={vw}
        h={vh}
        radius={28}
        playing={step >= 1}
        loop
        muted
        fit="cover"
        z={8}
      />
      <VideoFrame x={vx} y={vy} w={vw} h={vh} radius={28} on={step >= 1} />
      {step >= 1 && <VideoExpand id="vibro" x={vx} y={vy} w={vw} h={vh} radius={28} />}

      <At x={M.left} y={150} w={640}>
        <Reveal at={0} step={step} y={16}>
          <Kicker theme={TH} color={ACC} size={21}>
            {t(q.subtitle, lang)}
          </Kicker>
        </Reveal>

        <Reveal at={0} step={step} y={24} delay={0.08} style={{ marginTop: 26 }}>
          <Title theme={TH} size={62} style={{ letterSpacing: "-0.028em" }}>
            {t(q.title, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.22} style={{ marginTop: 34 }}>
          <Rule w={150} color={V.gold} thickness={4} delay={0.28} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 40 }}>
          <Body theme={TH} size={27} color={PAPER_2}>
            {t(q.body, lang)}
          </Body>
        </Reveal>
      </At>

      {/* The overlay calls out the accelerometer, the exciter and the MSK band
          in place, next to the thing each one names, and stamps the trace it
          certifies. A detached key out here only competed with it — a gold
          "MSK 8–9" chip used to sit above the chart, a hand's width from the
          gold label the chart already prints on the band itself. */}
      <At x={M.left} y={670} w={1000}>
        <div style={{ height: 230 }}>
          <VibroOverlay step={step} />
        </div>
      </At>
    </Slide>
  );
}

// ── 10 · Own laboratory ──────────────────────────────────────────────────────

/**
 * Steps: 0 the claim · 1 the press · 2 the three capacities. The tonnage is
 * the whole slide, so the numbers are set at display size and the unit is a
 * symbol rather than a word — it has to read identically in both alphabets.
 */
export function QuakeLab({ step }: SlideProps) {
  const lang = useLang();
  const q = S.quake.vibro;

  return (
    <Slide theme={TH} grid={false}>
      <Mesh variant="night" />
      <Glow x={1500} y={300} r={440} color="0,168,104" opacity={0.16} />

      <At x={M.left} y={186} w={900}>
        <Reveal at={0} step={step} y={22}>
          <Title theme={TH} size={64} style={{ letterSpacing: "-0.028em" }}>
            {t(q.labTitle, lang)}
          </Title>
        </Reveal>

        <Reveal at={0} step={step} delay={0.16} style={{ marginTop: 34 }}>
          <Rule w={150} color={V.gold} thickness={4} delay={0.22} />
        </Reveal>

        <Reveal at={1} step={step} style={{ marginTop: 40 }}>
          <Body theme={TH} size={30} color={PAPER_2} style={{ maxWidth: 880 }}>
            {t(q.labBody, lang)}
          </Body>
        </Reveal>
      </At>

      {/* Full-measure divider: the slide splits into claim above, evidence
          below, and the rule is what makes that read as a spec sheet. */}
      <At x={M.left} y={556} w={1600}>
        <Rule w={1600} thickness={1.5} color="rgba(214,236,220,0.22)" on={step >= 1} delay={0.2} />
      </At>

      {/* Names the row once, so the three cards can be pure numbers. */}
      <At x={M.left} y={578} w={1600}>
        <Reveal at={2} step={step} y={10}>
          <div
            className="font-mono"
            style={{
              fontSize: 21,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: PAPER_3,
            }}
          >
            {t(q.labPressLabel, lang)}
          </div>
        </Reveal>
      </At>

      <At x={M.left} y={636} w={1600}>
        <div style={{ display: "flex", gap: 40 }}>
          {N.testing.pressTonnes.map((tn, i) => (
            <Stagger key={tn} at={2} step={step} i={i} y={24} gap={0.1} style={{ flex: 1 }}>
              <Card dark h={228} radius={28} style={{ width: "100%", padding: "40px 44px" }}>
                <div
                  style={{
                    width: 56,
                    height: 5,
                    borderRadius: 3,
                    background: ACC,
                    marginBottom: 28,
                  }}
                />
                <div
                  className="tnum font-display"
                  style={{
                    fontSize: 104,
                    lineHeight: 1,
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    color: ACC,
                  }}
                >
                  <CountUp to={tn} on={step >= 2} format={(v) => String(v)} />
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 30,
                      letterSpacing: "0.06em",
                      color: PAPER_3,
                      marginLeft: 14,
                      verticalAlign: "super",
                    }}
                  >
                    t
                  </span>
                </div>
              </Card>
            </Stagger>
          ))}
        </div>
      </At>
    </Slide>
  );
}

// ── 11 · Chapter close ───────────────────────────────────────────────────────

/**
 * Steps: 0 the question the audience arrived with · 1 the answer · 2 what the
 * answer is made of. Nothing but type, centred — the chapter ends on the same
 * bare stage it opened on.
 */
export function QuakeClose({ step, active }: SlideProps) {
  return (
    <StatementSlide
      step={step}
      active={active}
      theme={TH}
      title={S.quake.close.title}
      accentTitle={S.quake.close.answer}
      body={S.quake.close.body}
    />
  );
}

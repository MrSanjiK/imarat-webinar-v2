import type { SlideDef } from "./types";

export type DeckState = {
  i: number;
  step: number;
  /** +1 forward, -1 backward. Drives the slide transition direction. */
  dir: 1 | -1;
};

export type DeckAction =
  | { type: "FWD" }
  | { type: "BACK" }
  | { type: "SLIDE"; i: number; step?: number }
  | { type: "FIRST" }
  | { type: "LAST" };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function makeReducer(deck: SlideDef[]) {
  const stepsOf = (i: number) => Math.max(1, deck[i]?.steps ?? 1);

  return function reducer(s: DeckState, a: DeckAction): DeckState {
    switch (a.type) {
      case "FWD": {
        if (s.step < stepsOf(s.i) - 1) return { ...s, step: s.step + 1, dir: 1 };
        if (s.i >= deck.length - 1) return s;
        return { i: s.i + 1, step: 0, dir: 1 };
      }

      case "BACK": {
        if (s.step > 0) return { ...s, step: s.step - 1, dir: -1 };
        if (s.i === 0) return s;
        // Land on the previous slide's *last* build, not its first — replaying a
        // build the audience already watched reads as a mistake.
        const prev = s.i - 1;
        return { i: prev, step: stepsOf(prev) - 1, dir: -1 };
      }

      case "SLIDE": {
        const i = clamp(a.i, 0, deck.length - 1);
        const step = clamp(a.step ?? 0, 0, stepsOf(i) - 1);
        if (i === s.i && step === s.step) return s;
        return { i, step, dir: i >= s.i ? 1 : -1 };
      }

      case "FIRST":
        return { i: 0, step: 0, dir: -1 };

      case "LAST": {
        const i = deck.length - 1;
        return { i, step: stepsOf(i) - 1, dir: 1 };
      }
    }
  };
}

/** `#/14/2` — survives an accidental F5 mid-presentation. */
export function parseHash(hash: string): { i: number; step: number } | null {
  const m = /^#\/(\d+)(?:\/(\d+))?$/.exec(hash);
  if (!m) return null;
  return { i: Number(m[1]), step: Number(m[2] ?? 0) };
}

export const toHash = (s: DeckState) => `#/${s.i}/${s.step}`;

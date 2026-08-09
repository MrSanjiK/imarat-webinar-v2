/**
 * Presenter remotes are not standardised. Most send PageDown/PageUp, some send
 * arrows, a few send B and F5 for blank/start. We accept the whole union, then
 * debounce, because a large share of clickers double-fire a single press.
 */

export const FORWARD_KEYS = new Set([
  "ArrowRight",
  "ArrowDown",
  "PageDown",
  " ",
  "Spacebar",
  "Enter",
  "n",
  "N",
  "MediaTrackNext",
]);

export const BACK_KEYS = new Set([
  "ArrowLeft",
  "ArrowUp",
  "PageUp",
  "Backspace",
  "p",
  "P",
  "MediaTrackPrevious",
]);

/** Some remotes report only `code`, not a useful `key`. */
export const FORWARD_CODES = new Set(["PageDown", "Space", "Enter", "ArrowRight", "ArrowDown"]);
export const BACK_CODES = new Set(["PageUp", "Backspace", "ArrowLeft", "ArrowUp"]);

export type Intent =
  | "fwd"
  | "back"
  | "first"
  | "last"
  | "overview"
  | "blackout"
  | "lang"
  | "fullscreen"
  | "webinar"
  | "webinar-expand"
  | "webinar-shrink"
  | "help"
  | "escape"
  | null;

export function intentFor(e: KeyboardEvent): Intent {
  const k = e.key;

  switch (k) {
    case "Home":
      return "first";
    case "End":
      return "last";
    case "Escape":
      return "escape";
    case "g":
    case "G":
      return "overview";
    case "b":
    case "B":
    case ".":
      return "blackout";
    case "l":
    case "L":
      return "lang";
    case "f":
    case "F":
      return "fullscreen";
    case "w":
    case "W":
      return "webinar";
    case "[":
      return "webinar-shrink";
    case "]":
      return "webinar-expand";
    case "?":
      return "help";
  }

  if (FORWARD_KEYS.has(k) || FORWARD_CODES.has(e.code)) return "fwd";
  if (BACK_KEYS.has(k) || BACK_CODES.has(e.code)) return "back";
  return null;
}

/** Clickers fire twice within a few tens of ms; humans do not. */
export const REPEAT_GUARD_MS = 160;

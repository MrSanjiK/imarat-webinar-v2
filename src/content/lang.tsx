"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { type L, type Lang, t } from "./i18n";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void };

const LangCtx = createContext<Ctx>({ lang: "latn", setLang: () => {}, toggle: () => {} });

const KEY = "imarat-deck-lang";

export function LangProvider({
  children,
  initial = "latn",
}: {
  children: React.ReactNode;
  /** Lets /preflight walk the deck once per alphabet in nested providers. */
  initial?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      sessionStorage.setItem(KEY, l);
    } catch {}
  }, []);

  const toggle = useCallback(
    () => setLang(lang === "latn" ? "cyrl" : "latn"),
    [lang, setLang],
  );

  const value = useMemo(() => ({ lang, setLang, toggle }), [lang, setLang, toggle]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLangCtx = () => useContext(LangCtx);
export const useLang = () => useContext(LangCtx).lang;

/** `const tr = useT(); tr(S.cover.title)` */
export function useT() {
  const { lang } = useContext(LangCtx);
  return useCallback((v: L) => t(v, lang), [lang]);
}

export const readStoredLang = (): Lang => {
  try {
    return sessionStorage.getItem(KEY) === "cyrl" ? "cyrl" : "latn";
  } catch {
    return "latn";
  }
};

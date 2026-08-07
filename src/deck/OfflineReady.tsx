"use client";

import { useEffect } from "react";

/**
 * Registers the offline shell.
 *
 * Production only: a service worker sitting in front of the dev server fights
 * hot reload, and a stale chunk served from cache while a slide is being
 * authored costs more time than it saves.
 */
export function OfflineReady() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const id = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }, 1200);

    return () => clearTimeout(id);
  }, []);

  return null;
}

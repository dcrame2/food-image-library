"use client";

import { useEffect } from "react";
import { applyMode, getMode } from "@/lib/theme";

/**
 * Reapplies the resolved theme when the OS light/dark preference changes,
 * but only while the user is on "system" mode. The initial paint is handled
 * by THEME_INIT_SCRIPT in the root layout.
 */
export function ThemeSync() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (getMode() === "system") applyMode("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return null;
}

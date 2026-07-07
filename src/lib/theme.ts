export interface Accent {
  id: string;
  label: string;
  /** HSL triplet matching the --primary CSS variable format. */
  hsl: string;
}

export const ACCENTS: Accent[] = [
  { id: "red", label: "Red", hsl: "0 84% 60%" },
  { id: "orange", label: "Orange", hsl: "25 95% 53%" },
  { id: "green", label: "Green", hsl: "142 76% 46%" },
  { id: "blue", label: "Blue", hsl: "217 91% 60%" },
  { id: "violet", label: "Violet", hsl: "262 83% 66%" },
  { id: "pink", label: "Pink", hsl: "330 81% 60%" },
];

export const DEFAULT_ACCENT = "red";
export const ACCENT_STORAGE_KEY = "ca-accent";

export type ThemeMode = "system" | "light" | "dark";
export const DEFAULT_MODE: ThemeMode = "dark";
export const MODE_STORAGE_KEY = "ca-mode";

export function applyAccent(accentId: string) {
  const accent = ACCENTS.find((a) => a.id === accentId) ?? ACCENTS[0];
  const root = document.documentElement;
  root.style.setProperty("--primary", accent.hsl);
  root.style.setProperty("--ring", accent.hsl);
}

export function setAccent(accentId: string) {
  localStorage.setItem(ACCENT_STORAGE_KEY, accentId);
  applyAccent(accentId);
}

export function getAccent(): string {
  if (typeof localStorage === "undefined") return DEFAULT_ACCENT;
  return localStorage.getItem(ACCENT_STORAGE_KEY) ?? DEFAULT_ACCENT;
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return mode;
}

export function applyMode(mode: ThemeMode) {
  document.documentElement.classList.toggle("light", resolveMode(mode) === "light");
}

export function setMode(mode: ThemeMode) {
  localStorage.setItem(MODE_STORAGE_KEY, mode);
  applyMode(mode);
}

export function getMode(): ThemeMode {
  if (typeof localStorage === "undefined") return DEFAULT_MODE;
  return (localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode) ?? DEFAULT_MODE;
}

/**
 * Inline script for the root layout: applies the stored accent and mode before
 * first paint so there is no flash. Keep the accent map in sync with ACCENTS.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m={red:"0 84% 60%",orange:"25 95% 53%",green:"142 76% 46%",blue:"217 91% 60%",violet:"262 83% 66%",pink:"330 81% 60%"};var r=document.documentElement;var a=localStorage.getItem("${ACCENT_STORAGE_KEY}");if(a&&m[a]&&a!=="${DEFAULT_ACCENT}"){r.style.setProperty("--primary",m[a]);r.style.setProperty("--ring",m[a]);}var md=localStorage.getItem("${MODE_STORAGE_KEY}")||"${DEFAULT_MODE}";var light=md==="light"||(md==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches);if(light)r.classList.add("light");}catch(e){}})();`;

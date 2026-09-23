"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "runown-theme";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

// useSyncExternalStore, not useState+useEffect: the current theme lives
// outside React (a DOM attribute + localStorage), and this hook is exactly
// what React ships for reading that kind of state safely across server and
// client renders - getServerSnapshot below stands in for the render that
// happens with no DOM/localStorage available at all.
function subscribe(callback: () => void) {
  listeners.add(callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", callback);
  };
}

function getSnapshot(): boolean {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "dark") return true;
  if (explicit === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSnapshot(): boolean {
  // Matches the bare :root (light) tokens in globals.css, which is what
  // the server-rendered HTML uses since there's no request-time way to
  // know a visitor's saved preference. The blocking script in layout.tsx
  // already applies the real choice before paint, so this only governs the
  // very first React render used to check against server-rendered markup.
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing / blocked storage - toggle still works for this
      // page view, it just won't be remembered next visit.
    }
    notify();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      aria-pressed={isDark}
      className="flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 font-mono text-xs font-bold tracking-wide text-dim uppercase transition-colors hover:text-ember"
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full bg-ember text-ember-ink"
        aria-hidden="true"
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        )}
      </span>
      {isDark ? "Dark" : "Light"}
    </button>
  );
}

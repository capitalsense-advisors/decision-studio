"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const resolved = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const frame = requestAnimationFrame(() => {
      setTheme(resolved);
      setReady(true);
      document.documentElement.classList.add("theme-ready");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("decision-studio-theme", next);
    applyTheme(next);
  };

  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "dark"} data-ready={ready ? "true" : "false"}>
      <span className="theme-toggle-icon theme-toggle-sun" aria-hidden="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>
      </span>
      <span className="theme-toggle-track" aria-hidden="true"><i /></span>
      <span className="theme-toggle-icon theme-toggle-moon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/></svg>
      </span>
      <span className="sr-only">{theme === "dark" ? "Dark" : "Light"} mode</span>
    </button>
  );
}

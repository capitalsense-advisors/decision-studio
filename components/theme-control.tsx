"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const stored = (localStorage.getItem("decision-studio-theme") as Theme | null) ?? "system";
    applyTheme(stored);
    const frame = requestAnimationFrame(() => setTheme(stored));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <label className="theme-control">Appearance
      <select value={theme} onChange={(event) => {
        const next = event.target.value as Theme;
        setTheme(next); localStorage.setItem("decision-studio-theme", next); applyTheme(next);
      }}>
        <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
      </select>
    </label>
  );
}

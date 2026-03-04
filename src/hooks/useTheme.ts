import { create } from "zustand";

export type Theme = "light" | "dark" | "gray" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.classList.remove("light", "dark", "gray");

  if (theme === "system") {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(systemDark ? "dark" : "light");
  } else {
    root.classList.add(theme);
  }
}

export const useTheme = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("theme") as Theme) || "system",

  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    set({ theme });
  },
}));

// 🔥 inicializa automaticamente
applyTheme((localStorage.getItem("theme") as Theme) || "system");
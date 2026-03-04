import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useMemo } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Ordem de rotação dos temas
  const themes = ["light", "dark", "gray", "system"] as const;

  const currentIndex = themes.indexOf(theme);
  const nextTheme = themes[(currentIndex + 1) % themes.length];

  const Icon = useMemo(() => {
    switch (theme) {
      case "light":
        return Sun;
      case "dark":
        return Moon;
      case "gray":
        return Monitor;
      case "system":
        return Monitor;
      default:
        return Sun;
    }
  }, [theme]);

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Tema Claro";
      case "dark":
        return "Tema Escuro";
      case "gray":
        return "Tema Cinza";
      case "system":
        return "Tema do Sistema";
      default:
        return "Alternar Tema";
    }
  };

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      aria-label={getLabel()}
      title={getLabel()}
      className="
        p-2 rounded-full
        transition-all duration-300
        text-zinc-600 dark:text-zinc-400
        hover:bg-zinc-100 dark:hover:bg-zinc-800
        hover:text-zinc-900 dark:hover:text-zinc-100
        focus:outline-none focus:ring-2 focus:ring-zinc-400
        active:scale-95
      "
    >
      <Icon className="w-5 h-5 transition-transform duration-300" />
    </button>
  );
}
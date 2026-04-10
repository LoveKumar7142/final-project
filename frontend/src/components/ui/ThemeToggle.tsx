import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="panel inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[var(--text)]"
      aria-label="Toggle theme"
    >
      <span className="text-sm">{theme === "light" ? "Moon" : "Sun"}</span>
      <span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}


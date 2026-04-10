import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeIconToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="panel inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--text)] transition hover:-translate-y-0.5"
      aria-label="Toggle theme"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
    </button>
  );
}

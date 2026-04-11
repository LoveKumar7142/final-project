import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getSystemTheme);
  const [hasManualOverride, setHasManualOverride] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applySystemTheme = () => {
      if (!hasManualOverride) {
        setTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    applySystemTheme();

    const listener = (event: MediaQueryListEvent) => {
      if (!hasManualOverride) {
        setTheme(event.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [hasManualOverride]);

  useEffect(() => {
    document.documentElement.classList.add("theme-transition");
    document.documentElement.classList.toggle("dark", theme === "dark");
    
    const timeout = setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 750);
    
    return () => clearTimeout(timeout);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        setHasManualOverride(true);
        setTheme((current) => (current === "light" ? "dark" : "light"));
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

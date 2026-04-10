import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import ThemeIconToggle from "./ui/ThemeIconToggle";
import Button from "./ui/Button";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Projects", to: "/projects" },
  { label: "Hire", to: "/hire" },
  { label: "Contact", to: "/contact" },
  { label: "Dashboard", to: "/dashboard" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logoSrc = theme === "light" ? "/love-kumar-logo-light.png" : "/love-kumar-logo.png";

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        <div className="panel flex items-center justify-between gap-3 rounded-[28px] px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/")} className="min-w-0 flex items-center gap-3 rounded-full text-left">
            <img
              src={logoSrc}
              alt="Love Kumar logo"
              className="h-11 w-11 rounded-2xl object-cover"
            />
            <div className="hidden min-w-0 text-left sm:block">
              <p className="text-sm font-semibold">Love Kumar</p>
              <p className="truncate text-xs text-[var(--muted)]">Love Kumar</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 rounded-full bg-black/5 px-2 py-2 dark:bg-white/5 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${
                    isActive ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="hidden rounded-full px-3 py-2 text-sm text-[var(--muted)] xl:block"
                >
                  {user?.name?.split(" ")[0] || user?.email}
                </button>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  Sign Up
                </Button>
              </>
            )}
            <ThemeIconToggle />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeIconToggle />
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="panel inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--text)] transition hover:-translate-y-0.5"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="panel overflow-hidden rounded-[28px] px-4 py-4 sm:px-5 lg:hidden">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-[var(--accent)] text-[var(--bg)]"
                        : "bg-[var(--bg-soft)] text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 border-t border-[var(--border)] pt-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--muted)]">
                    Signed in as <span className="font-medium text-[var(--text)]">{user?.name || user?.email}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        navigate("/dashboard");
                        setIsMenuOpen(false);
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      navigate("/login");
                      setIsMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigate("/register");
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

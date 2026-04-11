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
  const logoSrc =
    theme === "light" ? "/love-kumar-logo-light.png" : "/love-kumar-logo.png";

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
          <button
            onClick={() => navigate("/")}
            className="min-w-0 flex items-center gap-3 rounded-full text-left"
          >
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
                    isActive
                      ? "bg-[var(--accent)] text-[var(--bg)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
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
              aria-label={
                isMenuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <FiX className="text-lg" />
              ) : (
                <FiMenu className="text-lg" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`pointer-events-none fixed inset-x-0 top-[100px] z-30 lg:hidden transition-all duration-700 ease-out ${
          isMenuOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className={`pointer-events-auto mx-auto w-[92%] max-w-md min-h-[calc(100vh-80px)] origin-top-right overflow-hidden rounded-[28px] border-l border-b border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_24px_90px_rgba(0,0,0,0.18)] transition-all duration-700 ease-out  ${
            isMenuOpen
              ? "translate-x-0 translate-y-0 scale-100"
              : "translate-x-full -translate-y-10 scale-90"
          }`}
        >
          <div className="relative flex min-h-[calc(100vh-80px)] flex-col px-6 pb-24 pt-24 sm:px-10">

            <nav className="flex flex-1 flex-col items-center justify-start gap-5 pt-10 sm:gap-6 sm:pt-14">
              {navItems.map((item, index) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full max-w-sm px-5 py-2 text-center text-lg font-medium tracking-[0.02em] transition-all duration-500 ${
                      isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--text)] hover:text-[var(--accent)]"
                    }`
                  }
                  style={{
                    transitionDelay: isMenuOpen ? `${index * 60}ms` : "0ms",
                  }}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div
              className={`mt-6 space-y-3 transition-all duration-500 ${
                isMenuOpen
                  ? "translate-y-0 opacity-100 delay-300"
                  : "translate-y-4 opacity-0"
              }`}
            >
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] px-5 py-4 text-sm text-[var(--muted)]">
                    Signed in as{" "}
                    <span className="font-medium text-[var(--text)]">
                      {user?.name || user?.email}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
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
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
      </div>
    </header>
  );
}

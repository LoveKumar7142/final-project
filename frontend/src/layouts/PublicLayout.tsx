import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import type { AboutContentResponse } from "../types/contentModels";
import { FiMail, FiMapPin, FiPhone, FiStar } from "react-icons/fi";
import { getIconComponent } from "../lib/iconMap";
import { useTheme } from "../context/ThemeContext";
import GlobalProgress from "../components/GlobalProgress";

export default function PublicLayout() {
  const { theme } = useTheme();
  const { data } = useQuery({
    queryKey: ["about-content", "footer"],
    queryFn: async () => {
      const response = await api.get<AboutContentResponse>("/api/content/about");
      return response.data;
    },
  });

  return (
    <div className="relative min-h-screen pb-10">
      <GlobalProgress />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_45%)]" />
      <Navbar />
      <main className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-6 sm:gap-14 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
      <footer className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="panel rounded-[32px] px-6 py-7 sm:px-8">
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_0.95fr_1.05fr]">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src={theme === "light" ? "/love-kumar-logo-light.png" : "/love-kumar-logo.png"}
                  alt="Love Kumar logo"
                  className="h-12 w-12 rounded-2xl object-cover"
                />
                <p className="text-lg font-semibold">{data?.profile?.full_name || "Love Kumar"}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {data?.profile?.headline || data?.profile?.hero_description || "Update footer content from database."}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Contact</p>
              <div className="mt-3 space-y-2 text-sm">
                {data?.profile?.email ? <a href={`mailto:${data.profile.email}`} className="flex items-center gap-2 hover:underline"><FiMail className="text-[var(--muted)]" />{data.profile.email}</a> : null}
                {data?.profile?.phone ? <a href={`tel:${data.profile.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:underline"><FiPhone className="text-[var(--muted)]" />{data.profile.phone}</a> : null}
                {data?.profile?.location ? <p className="flex items-center gap-2 text-[var(--muted)]"><FiMapPin />{data.profile.location}</p> : null}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Social Links</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                {data?.socialLinks?.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2 transition hover:-translate-y-0.5"
                  >
                    {(() => {
                      const Icon = getIconComponent(link.icon, FiStar);
                      return <Icon className="text-sm" />;
                    })()}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 {data?.profile?.full_name || "Love Kumar"}.</p>
            <p>{data?.closingNote?.title || "Built and curated by Love Kumar."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

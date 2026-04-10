import { useQuery } from "@tanstack/react-query";
import { FiAward, FiBookOpen, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import Card from "../components/ui/Card";
import api from "../api/axios";
import type { AboutContentResponse } from "../types/contentModels";
import { getIconComponent } from "../lib/iconMap";
import { getSiteAssetUrl } from "../hooks/useSiteAssets";

export default function About() {
  const { data } = useQuery({
    queryKey: ["about-content"],
    queryFn: async () => {
      const response = await api.get<AboutContentResponse>("/api/content/about");
      return response.data;
    },
  });

  const profileSnapshot = getSiteAssetUrl(data?.siteAssets, "about_profile_snapshot", "/editorial/about/profile-snapshot.jpg");
  const educationImage = getSiteAssetUrl(data?.siteAssets, "about_education", "/editorial/about/education.jpg");
  const contactSocialsImage = getSiteAssetUrl(data?.siteAssets, "about_contact_socials", "/editorial/about/contact-socials.jpg");

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="grid items-start gap-5 lg:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">About Me</p>
          <h1 className="section-title mt-3">{data?.story?.title || data?.profile?.full_name || "About"}</h1>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
            {(data?.story?.description || data?.profile?.about_intro || "")
              .split("\n")
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
        </Card>

        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">Profile Snapshot</p>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-[var(--border)]">
            <img
              src={profileSnapshot}
              alt="Professional profile workspace"
              className="h-70 w-full object-cover"
            />
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
              <p className="font-semibold">Current Role</p>
              <p className="text-sm text-[var(--muted)]">{data?.profile?.current_role || "Update current role from database"}</p>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
              <p className="font-semibold">Current Company</p>
              <p className="text-sm text-[var(--muted)]">{data?.profile?.current_company || "Update current company from database"}</p>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
              <p className="font-semibold">Location</p>
              <p className="text-sm text-[var(--muted)]">{data?.profile?.location || "Update location from database"}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">Education</p>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-[var(--border)]">
            <img
              src={educationImage}
              alt="Education and study related visual"
              className="h-44 w-full object-cover"
            />
          </div>
          <div className="mt-5 space-y-4">
            {(data?.education || []).map((item) => (
              <div key={item.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <div className="flex items-start gap-3">
                  {(() => {
                    const Icon = getIconComponent(item.icon, FiBookOpen);
                    return <Icon className="mt-1 text-lg" />;
                  })()}
                  <div>
                    <h2 className="text-xl font-semibold">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">Achievements & Milestones</p>
          <div className="mt-5 space-y-3">
            {(data?.achievements || []).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                {(() => {
                  const Icon = getIconComponent(item.icon, FiAward);
                  return <Icon className="shrink-0 text-base text-[var(--text)]" />;
                })()}
                <span>{item.title || item.description}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">Real Project Journey</p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
            {(data?.projectJourney || []).slice(0, 2).map((item) => (
              <p key={item.id}>{item.description || item.title}</p>
            ))}
          </div>
          <div className="chip-grid mt-5">
            {(data?.projectJourney || []).map((item) => (
              <span key={item.id} className="chip-pill">
                {item.title}
              </span>
            ))}
          </div>
        </Card>

        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">Current Work Experience</p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
            {(data?.currentWork?.description || "")
              .split("\n")
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
        </Card>
      </section>

      <section className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">What Makes Me Different</p>
          <div className="mt-5 space-y-3">
            {(data?.differentiators || []).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                {(() => {
                  const Icon = getIconComponent(item.icon, FiAward);
                  return <Icon className="shrink-0 text-base text-[var(--text)]" />;
                })()}
                <span>{item.title || item.description}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-5 text-sm leading-6 text-[var(--muted)]">
            {(data?.learningNow || []).map((item) => item.title || item.description).join(", ")}
          </div>
        </Card>

        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">Contact & Socials</p>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-[var(--border)]">
            <img
              src={contactSocialsImage}
              alt="Contact and digital communication setup"
              className="h-44 w-full object-cover"
            />
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
              {data?.profile?.email ? <div className="flex items-center gap-3"><FiMail /><a href={`mailto:${data.profile.email}`}>{data.profile.email}</a></div> : null}
              {data?.profile?.phone ? <div className="mt-3 flex items-center gap-3"><FiPhone /><a href={`tel:${data.profile.phone.replace(/\s+/g, "")}`}>{data.profile.phone}</a></div> : null}
              {data?.profile?.location ? <div className="mt-3 flex items-center gap-3"><FiMapPin /><span>{data.profile.location}</span></div> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(data?.socialLinks || []).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm font-medium transition hover:-translate-y-0.5"
                >
                  {(() => {
                    const Icon = getIconComponent(item.icon, FiAward);
                    return <Icon className="text-base" />;
                  })()}
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card className="rounded-[36px] p-7 sm:p-8">
          <div className="flex items-start gap-4">
            <FiAward className="mt-1 text-xl" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Closing Note</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
                {data?.closingNote?.description || data?.closingNote?.title || "Add closing note from database"}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

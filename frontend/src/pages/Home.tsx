import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowRight, FiBriefcase, FiMapPin, FiMic, FiMusic, FiStar } from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ProjectCard from "../components/ProjectCard";
import api from "../api/axios";
import type { HomeContentResponse } from "../types/contentModels";
import { getIconComponent } from "../lib/iconMap";
import { editorialImages } from "../lib/editorialImages";
import { getSiteAssetUrl } from "../hooks/useSiteAssets";

export default function Home() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["home-content"],
    queryFn: async () => {
      const response = await api.get<HomeContentResponse>("/api/content/home");
      return response.data;
    },
  });

  const profile = data?.profile;
  const capabilityImages = [
    getSiteAssetUrl(data?.siteAssets, "home_capability_1", editorialImages.executionWorkspace),
    getSiteAssetUrl(data?.siteAssets, "home_capability_2", editorialImages.conversionCollab),
    getSiteAssetUrl(data?.siteAssets, "home_capability_3", editorialImages.fastDeliveryCode),
  ] as const;
  const serviceImages = [
    getSiteAssetUrl(data?.siteAssets, "home_service_1", editorialImages.serviceBuild),
    getSiteAssetUrl(data?.siteAssets, "home_service_2", editorialImages.serviceRevamp),
    getSiteAssetUrl(data?.siteAssets, "home_service_3", editorialImages.serviceBackend),
  ] as const;

  return (
    <div className="space-y-12 lg:space-y-16">
      <section className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="space-y-6"
        >
          <div className="inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-700 sm:px-4 sm:text-sm dark:text-amber-300">
            <FiStar /> {profile?.headline || "Update hero headline from database"}
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)] sm:text-sm sm:tracking-[0.28em]">Hello, I&apos;m {profile?.full_name || "Developer"}</p>
            <h1 className="section-title max-w-3xl text-4xl sm:text-5xl xl:text-6xl">
              {profile?.hero_title || "Add hero title from database"}
            </h1>
            <p className="section-copy max-w-2xl text-base sm:text-lg">
              {profile?.hero_description || "Add hero description from database"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate("/projects")}>
              View Projects <FiArrowRight />
            </Button>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => navigate("/hire")}>
              Hire Me <FiBriefcase />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(data?.stats || []).map((stat) => (
              <Card key={stat.id} className="balanced-card rounded-[24px] p-5">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{stat.label}</p>
              </Card>
            ))}
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="rounded-[24px] p-4 animate-pulse">
                    <div className="h-8 w-16 rounded bg-black/10 dark:bg-white/10" />
                    <div className="mt-3 h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                  </Card>
                ))
              : null}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="relative order-first mx-auto flex w-full max-w-[360px] items-end justify-center px-2 py-2 sm:max-w-[470px] sm:px-4 sm:py-4 lg:order-none lg:max-w-[600px] lg:px-4 lg:py-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 w-full"
          >
            <div className="absolute inset-x-6 bottom-10 top-14 rounded-[48px] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--highlight)_18%,transparent),transparent_52%)] blur-3xl sm:inset-x-10 lg:bottom-14" />
            {profile?.hero_image ? (
              <img
                src={profile.hero_image}
                alt={profile.full_name}
                className="relative z-10 mx-auto h-auto max-h-[420px] w-full object-contain object-bottom drop-shadow-[0_24px_40px_rgba(15,23,42,0.18)] sm:max-h-[520px] lg:max-h-[660px] lg:drop-shadow-[0_28px_50px_rgba(15,23,42,0.22)]"
              />
            ) : (
              <div className="panel h-[320px] w-full rounded-[42px] bg-black/5 sm:h-[420px] dark:bg-white/5" />
            )}
          </motion.div>
        </motion.div>
      </section>

      <section id="about" className="grid items-start gap-6 xl:grid-cols-[1fr_1.02fr]">
        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">About</p>
          <h2 className="section-title mt-3">{profile?.subheadline || "Add profile subheadline from database"}</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
            {(profile?.about_intro || "")
              .split("\n")
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
        </Card>

        <div className="grid h-fit gap-4 self-start">
          {(data?.capabilities || []).map((item, index) => (
            <Card key={item.id} className="balanced-card rounded-[30px] p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 sm:pr-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-black/5 text-lg dark:bg-white/5">
                    {(() => {
                      const Icon = getIconComponent(item.icon, FiStar);
                      return <Icon />;
                    })()}
                  </span>
                  <div className="mt-5 max-w-2xl">
                    <h3 className="text-2xl font-semibold tracking-[-0.03em]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-8 text-[var(--muted)] sm:text-base">{item.description}</p>
                  </div>
                </div>
                <div className="w-full max-w-[240px] self-start overflow-hidden rounded-[26px] border border-[var(--border)] sm:ml-6 sm:w-[200px] sm:self-center lg:w-[220px]">
                  <img
                    src={capabilityImages[index % capabilityImages.length]}
                    alt={item.title}
                    className="h-32 w-full object-cover object-center sm:h-[126px] lg:h-[132px]"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div>
          <p className="eyebrow">Services</p>
          <h2 className="section-title">Production-style help you can actually hire me for.</h2>
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data?.services || []).map((service, index) => (
            <Card key={service.id} className="balanced-card rounded-[30px] p-6">
              <div className="flex h-full min-h-[290px] flex-col">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/5 text-lg dark:bg-white/5">
                    {(() => {
                      const Icon = getIconComponent(service.icon, FiBriefcase);
                      return <Icon />;
                    })()}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold">{service.title}</h3>
                  </div>
                </div>
                <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--border)]">
                  <img
                    src={serviceImages[index % serviceImages.length]}
                    alt={service.title}
                    className="h-36 w-full object-cover"
                  />
                </div>
                {service.badge ? (
                  <p className="mt-4 inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    {service.badge}
                  </p>
                ) : null}
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{service.description}</p>
                <div className="mt-auto pt-6">
                  <Button variant="ghost" onClick={() => navigate("/hire")}>
                    {service.cta_text || "Hire Me"} <FiArrowRight />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="balanced-card rounded-[30px] p-6">
          <p className="eyebrow">Project Journey</p>
          <h3 className="mt-3 text-2xl font-semibold">Built with consistency</h3>
          <div className="chip-grid mt-4">
            {(data?.projectJourney || []).map((item) => (
              <span key={item.id} className="chip-pill">
                {item.title}
              </span>
            ))}
          </div>
        </Card>
        <Card className="balanced-card rounded-[30px] p-6">
          <p className="eyebrow">Current Work</p>
          <h3 className="mt-3 text-2xl font-semibold">{data?.currentWork?.title || "Current role"}</h3>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{data?.currentWork?.description || "Add current work summary in database"}</p>
        </Card>
        <Card className="balanced-card rounded-[30px] p-6">
          <p className="eyebrow">Beyond Code</p>
          <h3 className="mt-3 text-2xl font-semibold">Always growing</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            {(data?.learningNow || []).slice(0, 2).map((item) => (
              <p key={item.id}>{item.title || item.description}</p>
            ))}
            <div className="flex flex-wrap gap-3 pt-2 text-[var(--text)]">
              {profile?.location ? <span className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-2 dark:bg-white/5"><FiMapPin /> {profile.location}</span> : null}
              <span className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-2 dark:bg-white/5"><FiMusic /> Music</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-2 dark:bg-white/5"><FiMic /> Communication</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">Currently Working At</p>
          <h2 className="section-title mt-3">{data?.currentWork?.title || "Add current work title from database"}</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
            {(data?.currentWork?.description || "")
              .split("\n")
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
        </Card>

        <Card className="balanced-card rounded-[36px] p-7 sm:p-8">
          <p className="eyebrow">Learning Now</p>
          <h3 className="mt-3 text-2xl font-semibold">Continuously upgrading skills for real-world product building.</h3>
          <div className="mt-5 space-y-3">
            {(data?.learningNow || []).map((item) => (
              <div key={item.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--muted)]">
                {item.title || item.description}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="section-shell">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Featured projects</p>
            <h2 className="section-title">Explore work built to convert curiosity into trust.</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate("/projects")} className="hidden md:inline-flex">
            View all <FiArrowRight />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(data?.featuredProjects || []).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section>
        <Card className="rounded-[36px] p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Let&apos;s Connect</p>
              <h2 className="section-title mt-3">This is just the beginning of my journey and I&apos;m excited for what&apos;s coming next.</h2>
              <p className="section-copy mt-4 text-base">
                I am always open to collaborations, internships, freelance opportunities, and meaningful product work. Let&apos;s build something amazing together.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/contact")}>
              Contact Me <FiArrowRight />
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}

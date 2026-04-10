import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import Card from "./ui/Card";
import type { Project } from "../types/contentModels";
import { getProjectFallbackImage } from "../lib/editorialImages";
import { formatLocalPrice, getPricingMeta } from "../lib/pricing";
import { useCurrency } from "../hooks/useCurrency";

export default function ProjectCard({ project }: { project: Project }) {
  const { currency } = useCurrency();
  const coverImage =
    project.hero_image || getProjectFallbackImage(project.slug || project.id);
  const pricing = getPricingMeta(project);

  return (
    <Card className="group overflow-hidden rounded-[30px] p-0">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
        <img
          src={coverImage}
          alt={project.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
        <div className="absolute left-5 top-5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {project.category || (Number(project.price) === 0 ? "Free" : "Paid")}
        </div>
        <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-white backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">
            {project.tech.slice(0, 2).join(" • ")}
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{project.title}</h3>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="text-base font-semibold">
            {project.tagline || project.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {project.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tech.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[var(--muted)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Price
            </p>
            {pricing.isFree ? (
              <p className="mt-1 text-xl font-bold">Free</p>
            ) : (
              <div className="mt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xl font-bold">
                    {formatLocalPrice(
                      pricing.currentPrice,
                      undefined,
                      currency,
                    )}
                  </p>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {pricing.discountPercent}% OFF
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)] line-through">
                  {formatLocalPrice(pricing.originalPrice, undefined, currency)}
                </p>
              </div>
            )}
          </div>
          <Link
            to={`/projects/${project.slug || project.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition group-hover:-translate-y-0.5"
          >
            View <FiArrowUpRight />
          </Link>
        </div>
      </div>
    </Card>
  );
}

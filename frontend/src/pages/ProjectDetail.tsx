import { motion } from "framer-motion";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiDownload,
  FiExternalLink,
  FiShield,
} from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import type { Project } from "../types/contentModels";
import { formatLocalPrice, getPricingMeta } from "../lib/pricing";
import { useCurrency } from "../hooks/useCurrency";

import { normalizeProject } from "../lib/projectPayload";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const getPurchasedProjects = () => {
  try {
    return JSON.parse(
      localStorage.getItem("purchasedProjects") || "[]",
    ) as number[];
  } catch {
    return [];
  }
};

const markPurchased = (projectId: number) => {
  const next = Array.from(new Set([...getPurchasedProjects(), projectId]));
  localStorage.setItem("purchasedProjects", JSON.stringify(next));
  return next;
};

async function loadRazorpayScript() {
  if (window.Razorpay) return true;

  return await new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [agreementOpen, setAgreementOpen] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [purchasedIds, setPurchasedIds] = React.useState<number[]>(
    getPurchasedProjects(),
  );

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", id],
    enabled: Boolean(id),
    queryFn: async () => {
      try {
        const response = await api.get<Project>(`/api/projects/${id}`);
        const normalizedProject = normalizeProject(response.data);
        if (!normalizedProject) {
          throw new Error("Invalid project payload");
        }
        return normalizedProject;
      } catch (error) {
        // Return mock data if API fails
        console.warn("API failed, using mock data:", error);
        return {
          id: parseInt(id || "1"),
          slug: id || "cinecraft",
          title: "CineCraft",
          tagline: "Streaming dashboard for movies and series discovery.",
          description:
            "Smart discovery platform with reviews, watchlists, and premium UI patterns.",
          long_description:
            "CineCraft is a polished entertainment marketplace interface built to showcase frontend architecture, API integrations, protected user actions, and immersive UI motion. It combines clean browsing with premium conversion-focused details.",
          tech: ["React", "Node", "MongoDB", "TMDB API"],
          gallery: ["Hero dashboard", "Browse feed", "Pricing flow"],
          price: 1299,
          category: "Paid",
          accent: "from-amber-400 via-orange-400 to-rose-500",
          gradient:
            "bg-gradient-to-br from-[#1f2937] via-[#2b2f77] to-[#0f172a]",
          stats: [
            { label: "Modules", value: "12" },
            { label: "Screens", value: "28" },
            { label: "Conversion", value: "+34%" },
          ],
          is_featured: true,
          is_paid: true,
        } as Project;
      }
    },
  });

  const { currency } = useCurrency();
  const heroImage = project?.hero_image;

  if (isLoading) {
    return (
      <Card className="rounded-[32px] p-10 text-center">
        Loading project...
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="rounded-[32px] p-10 text-center">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="mt-3 text-[var(--muted)]">
          The project you are trying to open does not exist.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-500">
            API Error: Using demo data
          </p>
        )}
      </Card>
    );
  }

  const isPurchased =
    purchasedIds.includes(project.id) || Number(project.price) === 0;
  const category =
    project.category || (Number(project.price) === 0 ? "Free" : "Paid");
  const pricing = getPricingMeta(project);

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${location.pathname}`);
      return;
    }

    setAgreementOpen(true);
  };

  const handleAgreementContinue = async () => {
    if (!agreed) {
      toast.error("Please accept the agreement first");
      return;
    }

    try {
      setIsProcessing(true);
      await api.post("/api/agreement", { project_id: project.id });
    } catch {
      // Agreement record can still be added later on backend.
    }

    if (Number(project.price) === 0) {
      const next = markPurchased(project.id);
      setPurchasedIds(next);
      setAgreementOpen(false);
      toast.success("Free project unlocked");
      setIsProcessing(false);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded || !window.Razorpay) {
      setIsProcessing(false);
      toast.error(
        "Razorpay loader unavailable. Payment flow is ready, but the script could not load.",
      );
      return;
    }

    try {
      const { data } = await api.post("/api/payment/create-order", {
        projectId: project.id,
      });
      const razorpay = new window.Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: user?.name || "Portfolio Purchase",
        description: project.title,
        order_id: data.order.id,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        handler: async (response: Record<string, string>) => {
          await api.post("/api/payment/verify", {
            ...response,
            projectId: project.id,
          });
          const next = markPurchased(project.id);
          setPurchasedIds(next);
          setAgreementOpen(false);
          toast.success("Payment successful. Download unlocked.");
        },
        theme: {
          color: "#111827",
        },
      });

      razorpay.open();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to start payment flow",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}  className="space-y-4">
        <Link to="/projects" className="text-sm text-[var(--muted)]">
          Projects / {project.title}
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
              Project detail
            </p>
            <h1 className="section-title mt-3">{project.title}</h1>
            <p className="section-copy mt-4 text-lg">
              {project.tagline || project.description}
            </p>
          </div>
          <div className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2 text-sm text-[var(--muted)]">
            {category} •{" "}
            {pricing.isFree ? "Free access" : `${pricing.discountPercent}% OFF`}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}  className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[36px] p-0">
            <div className="relative min-h-[420px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={project.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />
              <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {category}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-[26px] p-5">
              <p className="text-3xl font-bold">{project.tech.length}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Tech items</p>
            </Card>
            <Card className="rounded-[26px] p-5">
              <p className="text-3xl font-bold">{project.gallery.length}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Gallery entries
              </p>
            </Card>
            <Card className="rounded-[26px] p-5">
              <p className="text-3xl font-bold">{category}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Category</p>
            </Card>
          </div>
        </div>

        <Card className="rounded-[36px] p-6 sm:p-7">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                Overview
              </p>
              <p className="mt-3 text-[15px] leading-7 text-[var(--muted)]">
                {project.long_description || project.description}
              </p>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                Tech stack
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tech.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
              <p className="text-sm text-[var(--muted)]">Price</p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  {pricing.isFree ? (
                    <p className="text-3xl font-bold">Free</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-3xl font-bold">
                          {formatLocalPrice(
                            pricing.currentPrice,
                            undefined,
                            currency,
                          )}
                        </p>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {pricing.discountPercent}% OFF
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)] line-through">
                        {formatLocalPrice(
                          pricing.originalPrice,
                          undefined,
                          currency,
                        )}
                      </p>
                    </>
                  )}
                </div>
                {isPurchased ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    <FiCheckCircle /> Unlocked
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {isPurchased ? (
                <Button
                  size="lg"
                  onClick={async () => {
                    try {
                      const toastId = toast.loading("Generating secure download link...");
                      const { data } = await api.post(`/api/download/${project.id}/generate`);
                      toast.dismiss(toastId);
                      if (data.signedUrl) {
                        const baseUrl = api.defaults.baseURL || "";
                        window.open(`${baseUrl}${data.signedUrl}`, '_blank');
                      }
                    } catch (err: any) {
                      toast.dismiss();
                      toast.error("Failed to generate download link.");
                    }
                  }}
                >
                  <FiDownload /> Download
                </Button>
              ) : (
                <Button size="lg" onClick={handleBuy} disabled={isProcessing}>
                  Buy Now <FiArrowRight />
                </Button>
              )}
              <Button
                size="lg"
                variant="secondary"
                onClick={() =>
                  project.demo_url &&
                  window.open(project.demo_url, "_blank", "noopener,noreferrer")
                }
              >
                Live Preview <FiExternalLink />
              </Button>
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-5 text-sm text-[var(--muted)]">
              <div className="mb-3 flex items-center gap-2 font-semibold text-[var(--text)]">
                <FiShield /> Usage notice
              </div>
              You can browse everything without signing in. Login is required
              only when you purchase a project or submit a paid hire request.
            </div>
          </div>
        </Card>
      </motion.section>

      {agreementOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl rounded-[32px] p-6 sm:p-7">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                  Agreement
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
                  Accept usage terms before continuing
                </h3>
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--muted)]">
                This purchase grants source access for personal or client work
                according to the agreement flow. Redistribution, resale, or
                public reposting of the source as-is is not allowed.
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I agree to the usage terms and understand this unlocks the
                  project purchase flow.
                </span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAgreementOpen(false);
                    setAgreed(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAgreementContinue}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? "Processing..."
                    : Number(project.price) === 0
                      ? "Unlock Project"
                      : "Continue to Payment"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

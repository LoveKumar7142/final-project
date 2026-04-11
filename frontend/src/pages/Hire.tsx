import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  FiBriefcase,
  FiDollarSign,
  FiFileText,
  FiMail,
  FiUser,
} from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { editorialImages } from "../lib/editorialImages";
import { getSiteAssetUrl, useSiteAssets } from "../hooks/useSiteAssets";

export default function Hire() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: siteAssets } = useSiteAssets();
  const primaryImage = getSiteAssetUrl(siteAssets, "hire_primary", editorialImages.clientMeeting);
  const secondaryImage = getSiteAssetUrl(siteAssets, "hire_secondary", editorialImages.contactImage);
  const [form, setForm] = useState({
    name: "",
    email: "",
    project_type: "Web App",
    description: "",
    budget: "25000",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.description || !form.budget) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data } = await api.post("/api/orders/create", {
        ...form,
        budget: Number(form.budget),
      });
      toast.success(
        data?.order?.id
          ? "Hire order created. Connect Razorpay checkout on this order id next."
          : "Hire request created",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to create hire order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid items-start gap-6 lg:gap-8 xl:grid-cols-[0.88fr_1.12fr]">
      <Card className="balanced-card rounded-[32px] p-6 sm:rounded-[36px] sm:p-9">
        <p className="eyebrow">Hire me</p>
        <h1 className="section-title mt-3">
          Start a custom build with a premium discovery-to-delivery experience.
        </h1>
        <p className="section-copy mt-4">
          This flow is made for serious client leads. Once submitted, the order
          endpoint can create a 60% advance Razorpay order and move the project
          into execution.
        </p>

        {primaryImage ? (
          <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--border)]">
            <img src={primaryImage} alt="Professional client planning session" className="h-52 w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {[
            "Product design that feels premium from first glance",
            "Frontend + backend delivery with clean architecture",
            "Conversion-aware UX for client projects and SaaS products",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--muted)]"
            >
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-[32px] p-6 sm:rounded-[36px] sm:p-9">
        {secondaryImage ? (
          <div className="mt-6 mb-6 overflow-hidden rounded-[28px] border border-[var(--border)]">
            <img src={secondaryImage} alt="Professional client planning session" className="h-52 w-full object-cover" />
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2.5 block text-sm font-medium">Name</span>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="pl-11"
                placeholder="Your name"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-2.5 block text-sm font-medium">Email</span>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="pl-11"
                placeholder="you@example.com"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-2.5 block text-sm font-medium">Project type</span>
            <div className="relative">
              <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={form.project_type}
                onChange={(e) => handleChange("project_type", e.target.value)}
                className="pl-11"
                placeholder="SaaS, portfolio, dashboard"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-2.5 block text-sm font-medium">Budget</span>
            <div className="relative">
              <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={form.budget}
                onChange={(e) => handleChange("budget", e.target.value)}
                className="pl-11"
                placeholder="25000"
              />
            </div>
          </label>
        </div>

        <label className="mt-5 block">
          <span className="mb-2.5 block text-sm font-medium">Project description</span>
          <div className="relative">
            <FiFileText className="absolute left-4 top-4 text-[var(--muted)]" />
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={6}
              className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] px-11 py-3 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70"
              placeholder="Tell me about the product, timeline, and goals"
            />
          </div>
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted)]">
            Users can browse freely, but hiring requires authentication and
            order creation.
          </p>
          <Button
            size="sm"
            className="w-full whitespace-nowrap px-5 py-2.5 text-sm sm:w-auto"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating order..." : "Create Hire Order"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

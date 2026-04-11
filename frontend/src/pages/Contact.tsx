import { useState } from "react";
import { FiMail, FiMessageSquare, FiUser } from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import api from "../api/axios";
import toast from "react-hot-toast";
import { editorialImages } from "../lib/editorialImages";
import { getSiteAssetUrl, useSiteAssets } from "../hooks/useSiteAssets";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: siteAssets } = useSiteAssets();

  const primaryImage = getSiteAssetUrl(siteAssets, "contact_primary", editorialImages.studioTeam);
  const secondaryImage = getSiteAssetUrl(siteAssets, "contact_secondary", editorialImages.contactImage);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/contact", form);
      toast.success("Message sent successfully");
      setForm({ name: "", email: "", message: "" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid items-start gap-6 lg:gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="balanced-card rounded-[32px] p-6 sm:rounded-[36px] sm:p-9">
        <p className="eyebrow">Contact</p>
        <h1 className="section-title mt-3">Let&apos;s talk about products, partnerships, or premium builds.</h1>
        <p className="section-copy mt-4">
          Use this channel for direct communication, collaborations, product inquiries, or questions about the marketplace projects.
        </p>
        {primaryImage ? (
          <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--border)]">
            <img
              src={primaryImage}
              alt="Creative team collaboration workspace"
              className="h-52 w-full object-cover"
            />
          </div>
        ) : null}
        <div className="mt-8 grid gap-4">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <p className="font-semibold">Response style</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Clear, direct, and product-focused.</p>
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <p className="font-semibold">Best for</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Freelance leads, collaboration, or project support.</p>
          </div>
        </div>
      </Card>

      <Card className="rounded-[32px] p-6 sm:rounded-[36px] sm:p-9">
        {secondaryImage ? (
          <div className="mt-6 mb-6 overflow-hidden rounded-[28px] border border-[var(--border)]">
            <img
              src={secondaryImage}
              alt="Contact and communication workspace"
              className="h-52 w-full object-cover"
            />
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2.5 block text-sm font-medium">Name</span>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="pl-11" placeholder="Your name" />
            </div>
          </label>
          <label className="block">
            <span className="mb-2.5 block text-sm font-medium">Email</span>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <Input type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} className="pl-11" placeholder="you@example.com" />
            </div>
          </label>
        </div>

        <label className="mt-5 block">
          <span className="mb-2.5 block text-sm font-medium">Message</span>
          <div className="relative">
            <FiMessageSquare className="absolute left-4 top-4 text-[var(--muted)]" />
            <textarea
              rows={7}
              value={form.message}
              onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
              className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] px-11 py-3 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70"
              placeholder="Tell me what you want to build or ask"
            />
          </div>
        </label>

        <div className="mt-6 flex justify-end">
          <Button
            className="w-full whitespace-nowrap px-5 py-2.5 text-sm sm:w-auto"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Send Message
          </Button>
        </div>
      </Card>
    </div>
  );
}

import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiFilter, FiSearch } from "react-icons/fi";
import ProjectCard from "../components/ProjectCard";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import api from "../api/axios";
import type { Project } from "../types/contentModels";
import { normalizeProjectList } from "../lib/projectPayload";

export default function Projects() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get<Project[]>("/api/projects");
      return normalizeProjectList(response.data);
    },
  });

  const [search, setSearch] = useState("");
  const [billing, setBilling] = useState<"All" | "Free" | "Paid">("All");
  const [tech, setTech] = useState("All");

  const techFilters = [
    "All",
    ...Array.from(new Set(projects.flatMap((project) => project.tech || []))),
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(search.toLowerCase());
    const matchesBilling =
      billing === "All" ||
      (project.category || (Number(project.price) === 0 ? "Free" : "Paid")) === billing;
    const matchesTech = tech === "All" || (project.tech || []).includes(tech);
    return matchesSearch && matchesBilling && matchesTech;
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}  className="section-shell">
        <p className="eyebrow">Projects marketplace</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="section-title">Browse production-style builds, packaged like premium digital products.</h1>
            <p className="section-copy mt-3 max-w-3xl">
              Explore case-study-ready projects with strong UI, real product thinking, and clean conversion-focused experiences.
            </p>
          </div>
          <div className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2 text-sm text-[var(--muted)]">
            {filteredProjects.length} projects found
          </div>
        </div>
      </motion.section>

      <Card className="rounded-[32px] p-4 sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr_1fr]">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              placeholder="Search by project title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-2">
            <span className="px-2 text-sm text-[var(--muted)]"><FiFilter /></span>
            {(["All", "Free", "Paid"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setBilling(option)}
                className={`rounded-full px-4 py-2 text-sm ${billing === option ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--muted)]"}`}
              >
                {option}
              </button>
            ))}
          </div>

          <select
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm outline-none"
          >
            {techFilters.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}  className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="panel animate-pulse rounded-[30px] p-5">
                <div className="h-52 rounded-[24px] bg-white/10 dark:bg-white/5" />
                <div className="mt-5 h-6 w-2/3 rounded-full bg-white/10 dark:bg-white/5" />
                <div className="mt-3 h-4 rounded-full bg-white/10 dark:bg-white/5" />
                <div className="mt-2 h-4 w-5/6 rounded-full bg-white/10 dark:bg-white/5" />
              </div>
            ))
          : filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
      </motion.section>
    </div>
  );
}

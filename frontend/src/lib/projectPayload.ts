import type { Project } from "../types/contentModels";

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return toStringArray(parsed);
      }
    } catch {
      // Fall back to comma/newline separated text.
    }

    return trimmed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeProject = (value: unknown): Project | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const project = value as Partial<Project> & Record<string, unknown>;

  if (typeof project.id !== "number" || typeof project.title !== "string") {
    return null;
  }

  return {
    ...project,
    slug: typeof project.slug === "string" ? project.slug : String(project.id),
    title: project.title,
    tech: toStringArray(project.tech),
    gallery: toStringArray(project.gallery),
    price: Number(project.price || 0),
  } as Project;
};

export const normalizeProjectList = (value: unknown): Project[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeProject).filter((project): project is Project => Boolean(project));
};

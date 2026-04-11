const URL_PATTERN = /^[^\s]+$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toTrimmedString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

export const toNullableString = (value) => {
  const normalized = toTrimmedString(value, "");
  return normalized || null;
};

export const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }
  return false;
};

export const parseJsonArrayInput = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => toTrimmedString(item)).filter(Boolean);

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => toTrimmedString(item)).filter(Boolean);
      }
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

export const assertValidProjectPayload = (project) => {
  const errors = [];

  if (!project.slug) {
    errors.push("Slug is required");
  } else if (!SLUG_PATTERN.test(project.slug)) {
    errors.push("Slug can only contain lowercase letters, numbers, and hyphens");
  } else if (project.slug.length > 150) {
    errors.push("Slug must be 150 characters or fewer");
  }

  if (!project.title) {
    errors.push("Title is required");
  } else if (project.title.length > 255) {
    errors.push("Title must be 255 characters or fewer");
  }

  if (project.tagline && project.tagline.length > 255) {
    errors.push("Tagline must be 255 characters or fewer");
  }

  if (!Number.isFinite(project.price) || project.price < 0) {
    errors.push("Price must be a valid non-negative number");
  }

  if (!["Free", "Paid"].includes(project.category)) {
    errors.push("Category must be either Free or Paid");
  }

  if (project.demo_url && !URL_PATTERN.test(project.demo_url)) {
    errors.push("Demo URL must be a valid URL or root-relative path");
  }

  if (project.image_url && !URL_PATTERN.test(project.image_url)) {
    errors.push("Image URL must be a valid URL or root-relative path");
  }

  if (project.file && !URL_PATTERN.test(project.file)) {
    errors.push("File path must be a valid URL or root-relative path");
  }

  if (project.tech.length > 20) {
    errors.push("Tech stack can contain at most 20 items");
  }

  if (project.gallery.length > 20) {
    errors.push("Gallery/features can contain at most 20 items");
  }

  if (errors.length) {
    const error = new Error(errors[0]);
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }
};

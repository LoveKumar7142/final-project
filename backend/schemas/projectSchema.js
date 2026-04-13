import { z } from "zod";

const parseListValue = (value) => {
  if (value === undefined || value === null || value === "") return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const optionalTrimmedString = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    return normalized === "" ? null : normalized;
  },
  z.string().nullable().optional(),
);

const optionalUrlLikeString = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    return normalized === "" ? null : normalized;
  },
  z
    .string()
    .regex(
      /^(https?:\/\/[^\s]+|\/[^\s]*)$/i,
      "Must be a valid URL or root-relative path",
    )
    .nullable()
    .optional(),
);

const booleanLike = z.preprocess(
  (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "on"].includes(normalized)) return true;
      if (["false", "0", "no", "off", ""].includes(normalized)) return false;
    }
    return value;
  },
  z.boolean().optional(),
);

const numberLike = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return Number(value);
  },
  z.number().finite().nonnegative().optional(),
);

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(255),
  slug: z.string().trim().min(1, "Slug is required").max(150),
  tagline: optionalTrimmedString,
  description: z.string().trim().min(10, "Description is too short"),
  long_description: optionalTrimmedString,
  tech: z.preprocess(parseListValue, z.array(z.string()).max(20)).optional(),
  gallery: z.preprocess(parseListValue, z.array(z.string()).max(20)).optional(),
  price: numberLike,
  category: z.enum(["Free", "Paid"]).optional().nullable(),
  demo_url: optionalUrlLikeString,
  file: optionalUrlLikeString,
  file_name: optionalTrimmedString,
  hero_image: optionalUrlLikeString,
  hero_image_public_id: optionalTrimmedString,
  image_url: optionalUrlLikeString,
  image_public_id: optionalTrimmedString,
  file_public_id: optionalTrimmedString,
  sort_order: numberLike,
  is_featured: booleanLike,
  is_paid: booleanLike,
});

import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  slug: z.string().min(2).max(100).optional(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().min(10, "Description is too short"),
  long_description: z.string().optional().nullable(),
  tech: z.union([z.array(z.string()), z.string()]).transform(val => {
    if (typeof val === 'string') return val.split(',').map(s => s.trim());
    return val;
  }).optional(),
  gallery: z.union([z.array(z.string()), z.string()]).transform(val => {
    if (typeof val === 'string') return [val]; // Very basic catch
    return val;
  }).optional(),
  price: z.union([z.number(), z.string()]).transform(Number).optional(),
  category: z.string().optional().nullable(),
  accent: z.string().optional().nullable(),
  demo_url: z.string().url("Must be a valid URL").optional().nullable(),
  file_url: z.string().url("Must be a valid URL").optional().nullable(),
  hero_image: z.string().optional().nullable(),
  stats: z.any().optional(), // Could be stringified JSON or Array depending on frontend
  is_featured: z.union([z.boolean(), z.number()]).transform(Boolean).optional(),
  is_paid: z.union([z.boolean(), z.number()]).transform(Boolean).optional(),
  status: z.enum(["published", "draft", "archived"]).optional().default("published"),
});

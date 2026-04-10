export type Project = {
  id: number;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  long_description?: string;
  tech: string[];
  gallery: string[];
  price: number;
  file?: string;
  demo_url?: string;
  hero_image?: string;
  category?: "Free" | "Paid";
  is_featured?: boolean;
  is_paid?: boolean;
};

export type Profile = {
  full_name: string;
  headline?: string;
  subheadline?: string;
  hero_title?: string;
  hero_description?: string;
  hero_image?: string;
  about_intro?: string;
  current_company?: string;
  current_role?: string;
  current_summary?: string;
  location?: string;
  email?: string;
  phone?: string;
};

export type ContentItem = {
  id: number;
  section_key: string;
  title?: string;
  description?: string;
  meta_value?: string;
  icon?: string;
  sort_order?: number;
};

export type ContentSection = {
  id: number;
  section_key: string;
  title: string;
  description?: string;
  sort_order?: number;
};

export type SocialLink = {
  id: number;
  label: string;
  url: string;
  icon?: string;
  sort_order?: number;
};

export type HomeContentResponse = {
  profile: Profile | null;
  stats: Array<{ id: number; label: string; value: string }>;
  capabilities: Array<{ id: number; title: string; description?: string; icon?: string }>;
  projectJourney: ContentItem[];
  learningNow: ContentItem[];
  currentWork: ContentSection | null;
  featuredProjects: Project[];
};

export type AboutContentResponse = {
  profile: Profile | null;
  socialLinks: SocialLink[];
  story: ContentSection | null;
  currentWork: ContentSection | null;
  closingNote: ContentSection | null;
  education: ContentItem[];
  achievements: ContentItem[];
  projectJourney: ContentItem[];
  learningNow: ContentItem[];
  differentiators: ContentItem[];
  beyondCode: ContentItem[];
};

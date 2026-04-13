export type SiteAsset = {
  id?: number;
  asset_key: string;
  label: string;
  asset_url?: string | null;
  asset_public_id?: string | null;
  sort_order?: number;
};

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
  file_name?: string;
  file_public_id?: string;
  demo_url?: string;
  hero_image?: string;
  hero_image_public_id?: string;
  image_url?: string;
  image_public_id?: string;
  category?: "Free" | "Paid";
  is_featured?: boolean;
  is_paid?: boolean;
  sort_order?: number;
  download_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type Profile = {
  full_name: string;
  headline?: string;
  subheadline?: string;
  hero_title?: string;
  hero_description?: string;
  hero_image?: string;
  hero_image_public_id?: string;
  hero_image_position?: string;
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

export type ServiceOffering = {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  badge?: string;
  cta_text?: string;
  sort_order?: number;
  is_active?: boolean;
};

export type HomeContentResponse = {
  profile: Profile | null;
  siteAssets: SiteAsset[];
  stats: Array<{ id: number; label: string; value: string }>;
  capabilities: Array<{ id: number; title: string; description?: string; icon?: string }>;
  services: ServiceOffering[];
  projectJourney: ContentItem[];
  learningNow: ContentItem[];
  currentWork: ContentSection | null;
  featuredProjects: Project[];
};

export type AboutContentResponse = {
  profile: Profile | null;
  siteAssets: SiteAsset[];
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

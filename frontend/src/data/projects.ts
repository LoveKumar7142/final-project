export type Project = {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  longDescription: string;
  price: number;
  category: "Free" | "Paid";
  tech: string[];
  accent: string;
  gradient: string;
  demoUrl: string;
  stats: { label: string; value: string }[];
  gallery: string[];
};

export const projects: Project[] = [
  {
    id: 1,
    slug: "cinecraft",
    title: "CineCraft",
    tagline: "Streaming dashboard for movies and series discovery.",
    description: "Smart discovery platform with reviews, watchlists, and premium UI patterns.",
    longDescription:
      "CineCraft is a polished entertainment marketplace interface built to showcase frontend architecture, API integrations, protected user actions, and immersive UI motion. It combines clean browsing with premium conversion-focused details.",
    price: 1299,
    category: "Paid",
    tech: ["React", "Node", "MongoDB", "TMDB API"],
    accent: "from-amber-400 via-orange-400 to-rose-500",
    gradient: "bg-gradient-to-br from-[#1f2937] via-[#2b2f77] to-[#0f172a]",
    demoUrl: "https://example.com/cinecraft",
    stats: [
      { label: "Modules", value: "12" },
      { label: "Screens", value: "28" },
      { label: "Conversion", value: "+34%" },
    ],
    gallery: ["Hero dashboard", "Browse feed", "Pricing flow"],
  },
  {
    id: 2,
    slug: "waste-watchers",
    title: "Waste Watchers",
    tagline: "Complaint and reporting workflow for smart cities.",
    description: "Geo-tagged issue reporting with analytics dashboard and citizen-friendly UX.",
    longDescription:
      "Waste Watchers is designed for civic reporting. It features complaint intake, map-driven status views, admin visibility, and quick issue escalation flows for real-world operations.",
    price: 0,
    category: "Free",
    tech: ["React", "Firebase", "Maps API"],
    accent: "from-emerald-400 via-teal-400 to-cyan-500",
    gradient: "bg-gradient-to-br from-[#0f172a] via-[#123b34] to-[#164e63]",
    demoUrl: "https://example.com/waste-watchers",
    stats: [
      { label: "Response", value: "2.4h" },
      { label: "Users", value: "1.2k" },
      { label: "Reports", value: "18k" },
    ],
    gallery: ["Public tracker", "Issue board", "Admin analytics"],
  },
  {
    id: 3,
    slug: "chatverse",
    title: "ChatVerse",
    tagline: "Modern AI conversation workspace for teams.",
    description: "Prompt library, chat history, and collaborative workspace in one product.",
    longDescription:
      "ChatVerse demonstrates AI product design with strong UX hierarchy, conversational memory views, reusable prompt blocks, and subscription-ready dashboard patterns.",
    price: 999,
    category: "Paid",
    tech: ["React", "Express", "OpenAI", "PostgreSQL"],
    accent: "from-sky-400 via-blue-500 to-indigo-500",
    gradient: "bg-gradient-to-br from-[#172554] via-[#1d4ed8] to-[#0f172a]",
    demoUrl: "https://example.com/chatverse",
    stats: [
      { label: "Latency", value: "0.8s" },
      { label: "Agents", value: "6" },
      { label: "Retention", value: "82%" },
    ],
    gallery: ["Workspace home", "Prompt vault", "Usage analytics"],
  },
  {
    id: 4,
    slug: "portfolio-os",
    title: "Portfolio OS",
    tagline: "Premium developer storefront with hiring and digital product sales.",
    description: "End-to-end portfolio SaaS with auth, payments, downloads, and admin tooling.",
    longDescription:
      "Portfolio OS is the exact category of product you are building here: a premium portfolio system that acts like a full business platform, not a static resume. It focuses on trust, clarity, and conversion.",
    price: 1599,
    category: "Paid",
    tech: ["React", "Node", "MySQL", "Razorpay"],
    accent: "from-fuchsia-400 via-pink-500 to-rose-500",
    gradient: "bg-gradient-to-br from-[#3b0764] via-[#881337] to-[#111827]",
    demoUrl: "https://example.com/portfolio-os",
    stats: [
      { label: "Revenue", value: "INR 1.8L" },
      { label: "Flows", value: "14" },
      { label: "Views", value: "24k" },
    ],
    gallery: ["Landing view", "Project vault", "Purchase drawer"],
  },
  {
    id: 5,
    slug: "vision-hub",
    title: "Vision Hub",
    tagline: "Computer vision operations board for industrial monitoring.",
    description: "AI dashboards, alerting, and live streams for monitoring use cases.",
    longDescription:
      "Vision Hub blends operational intelligence with a crisp command-center UI. It is built for teams that need live insights, instant anomaly flags, and reviewable event history.",
    price: 1499,
    category: "Paid",
    tech: ["Python", "OpenCV", "React", "FastAPI"],
    accent: "from-violet-400 via-purple-500 to-indigo-500",
    gradient: "bg-gradient-to-br from-[#111827] via-[#312e81] to-[#0f172a]",
    demoUrl: "https://example.com/vision-hub",
    stats: [
      { label: "Alerts", value: "Real-time" },
      { label: "Cameras", value: "32" },
      { label: "Accuracy", value: "96%" },
    ],
    gallery: ["Monitoring wall", "Alert queue", "Model health"],
  },
  {
    id: 6,
    slug: "launchpad-ai",
    title: "Launchpad AI",
    tagline: "Go-to-market operating system for founders.",
    description: "Planning, content, funnels, and CRM touchpoints in one dashboard.",
    longDescription:
      "Launchpad AI is a hybrid productivity and growth workspace that helps founders plan campaigns, manage assets, and move from ideas to customer-ready launch execution.",
    price: 0,
    category: "Free",
    tech: ["Next.js", "Prisma", "AI", "Tailwind"],
    accent: "from-lime-300 via-emerald-400 to-teal-500",
    gradient: "bg-gradient-to-br from-[#052e16] via-[#166534] to-[#0f172a]",
    demoUrl: "https://example.com/launchpad-ai",
    stats: [
      { label: "Templates", value: "40+" },
      { label: "Teams", value: "120" },
      { label: "Tasks", value: "6k" },
    ],
    gallery: ["Campaign planner", "Template board", "Founder CRM"],
  },
];

export const featuredProjects = projects.slice(0, 3);
export const techFilters = ["All", "React", "Node", "AI", "OpenAI", "MySQL", "Firebase"];


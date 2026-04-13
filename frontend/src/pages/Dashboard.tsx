import { useEffect, useMemo, useState } from "react";
import { motion, Reorder } from "framer-motion";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiDownload,
  FiFolder,
  FiMessageSquare,
  FiShoppingBag,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import PageLoader from "../components/ui/PageLoader";
import { useAuth } from "../context/AuthContext";
import { projects as localProjects } from "../data/projects";
import api, {
  createProject,
  deleteAdminMessage,
  deleteAdminOrder,
  fetchAdminContent,
  fetchAdminMessages,
  fetchAdminOrders,
  fetchAdminSummary,
  removeProject,
  saveAdminContent,
  updateProject,
  uploadProjectArchive,
  uploadProjectImage,
  uploadSiteAsset,
  deleteSiteAsset,
  reorderProjects,
  uploadProfileHeroImage,
  deleteProfileHeroImage,
  logApiError,
  type AdminContentPayload,
  type SiteAsset,
  type SiteSetting,
} from "../api/axios";
import type { Project, LegalPage } from "../types/contentModels";
import { normalizeProjectList } from "../lib/projectPayload";

type ProjectCategory = "Free" | "Paid";

type ProjectFormState = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  long_description: string;
  techText: string;
  galleryText: string;
  price: string;
  category: ProjectCategory;
  demo_url: string;
  image_url: string;
  file: string;
  file_name: string;
  sort_order: number;
  is_featured: boolean;
  is_paid: boolean;
};

const defaultProjectForm: ProjectFormState = {
  slug: "",
  title: "",
  tagline: "",
  description: "",
  long_description: "",
  techText: "",
  galleryText: "",
  price: "0",
  category: "Free",
  demo_url: "",
  image_url: "",
  file: "",
  file_name: "",
  sort_order: 0,
  is_featured: false,
  is_paid: false,
};

const defaultContentEditors = {
  profile: "{}",
  siteSettings: "[]",
  siteAssets: "[]",
  socialLinks: "[]",
  homeStats: "[]",
  capabilities: "[]",
  services: "[]",
  aboutSections: "[]",
  aboutItems: "[]",
  legalPages: "[]",
};

const parseListInput = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatListInput = (items?: string[]) =>
  items && items.length ? items.join("\n") : "";
const safeJsonStringify = (value: unknown) =>
  JSON.stringify(value ?? null, null, 2);

const parseJsonEditor = <T,>(label: string, value: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label} JSON valid nahi hai`);
  }
};

const logDashboardDebug = (
  label: string,
  error: any,
  extra?: Record<string, unknown>,
) => {
  logApiError(label, error);
  if (extra) {
    console.group(`Admin Debug Context: ${label}`);
    console.log(extra);
    console.groupEnd();
  }
};

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = ["admin", "super_admin"].includes(user?.role || "");
  const [activeTab, setActiveTab] = useState<
    | "projects"
    | "images"
    | "content"
    | "legal"
    | "orders"
    | "messages"
    | "cookies"
  >("projects");
  const [projectForm, setProjectForm] =
    useState<ProjectFormState>(defaultProjectForm);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [contentEditors, setContentEditors] = useState(defaultContentEditors);
  const [assetFiles, setAssetFiles] = useState<Record<string, File | null>>({});
  const [profileHeroImageFile, setProfileHeroImageFile] = useState<File | null>(
    null,
  );
  const [localProjectsList, setLocalProjectsList] = useState<Project[]>([]);
  const [legalPageForm, setLegalPageForm] = useState<
    Partial<LegalPage> & { originalKey?: string }
  >({});
  const [cookieForm, setCookieForm] = useState({
    name: "",
    purpose: "",
    duration: "",
  });

  const purchasedIds = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("purchasedProjects") || "[]",
      ) as number[];
    } catch {
      return [];
    }
  }, []);

  const purchasedProjects = localProjects.filter(
    (project) => purchasedIds.includes(project.id) || project.price === 0,
  );

  const { data: summary } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: fetchAdminSummary,
    enabled: isAuthenticated && isAdmin,
  });

  const { data: adminProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const response = await api.get<Project[]>("/api/projects");
      return normalizeProjectList(response.data);
    },
    enabled: isAuthenticated && isAdmin,
  });

  useEffect(() => {
    if (adminProjects && adminProjects.length > 0) {
      setLocalProjectsList(adminProjects);
    }
  }, [adminProjects]);

  const { data: adminContent } = useQuery({
    queryKey: ["admin-content"],
    queryFn: fetchAdminContent,
    enabled: isAuthenticated && isAdmin,
  });

  const { data: adminOrders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchAdminOrders,
    enabled: isAuthenticated && isAdmin,
  });

  const { data: adminMessages = [] } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: fetchAdminMessages,
    enabled: isAuthenticated && isAdmin,
  });

  useEffect(() => {
    if (!adminContent) {
      return;
    }

    setContentEditors({
      profile: safeJsonStringify(adminContent.profile || {}),
      siteSettings: safeJsonStringify(adminContent.siteSettings || []),
      siteAssets: safeJsonStringify(adminContent.siteAssets || []),
      socialLinks: safeJsonStringify(adminContent.socialLinks || []),
      homeStats: safeJsonStringify(adminContent.homeStats || []),
      capabilities: safeJsonStringify(adminContent.capabilities || []),
      services: safeJsonStringify(adminContent.services || []),
      aboutSections: safeJsonStringify(adminContent.aboutSections || []),
      aboutItems: safeJsonStringify(adminContent.aboutItems || []),
      legalPages: safeJsonStringify(adminContent.legalPages || []),
    });
  }, [adminContent]);

  const parsedProfile = useMemo(() => {
    try {
      return JSON.parse(contentEditors.profile) as Record<string, any>;
    } catch {
      return {};
    }
  }, [contentEditors.profile]);

  const parsedSiteAssets = useMemo(() => {
    try {
      return JSON.parse(contentEditors.siteAssets) as SiteAsset[];
    } catch {
      return [];
    }
  }, [contentEditors.siteAssets]);

  const parsedSiteSettings = useMemo(() => {
    try {
      return JSON.parse(contentEditors.siteSettings) as SiteSetting[];
    } catch {
      return [];
    }
  }, [contentEditors.siteSettings]);

  const parsedLegalPages = useMemo(() => {
    try {
      return JSON.parse(contentEditors.legalPages) as LegalPage[];
    } catch {
      return [];
    }
  }, [contentEditors.legalPages]);

  const saveProjectMutation = useMutation({
    mutationFn: async () => {
      const trimmedSlug = projectForm.slug?.trim() || "";
      const trimmedTitle = projectForm.title?.trim() || "";
      const trimmedDescription = projectForm.description?.trim() || "";

      if (!trimmedSlug) {
        throw new Error("Slug required hai");
      }

      if (trimmedTitle.length < 2) {
        throw new Error(
          "Project title kam se kam 2 characters ka hona chahiye",
        );
      }

      if (trimmedDescription.length < 10) {
        throw new Error("Description kam se kam 10 characters ka hona chahiye");
      }

      // const payload: Partial<Project> = {
      //   slug: projectForm.slug.trim(),
      //   title: projectForm.title.trim(),
      //   tagline: projectForm.tagline.trim(),
      //   description: projectForm.description.trim(),
      //   long_description: projectForm.long_description.trim(),
      //   tech: parseListInput(projectForm.techText),
      //   gallery: parseListInput(projectForm.galleryText),
      //   price: Number(projectForm.price || 0),
      //   category: projectForm.category,
      //   demo_url: projectForm.demo_url.trim(),
      //   hero_image: projectForm.image_url.trim(),
      //   image_url: projectForm.image_url.trim(),
      //   file: projectForm.file.trim(),
      //   file_name: projectForm.file_name.trim(),
      //   sort_order: Number(projectForm.sort_order || 0),
      //   is_featured: projectForm.is_featured,
      //   is_paid: projectForm.is_paid,
      // };

      console.log("🚀 Sending Payload:", projectForm);

      const payload: Partial<Project> = {
        slug: trimmedSlug,
        title: trimmedTitle,
        tagline: projectForm.tagline?.trim() || "",
        description: trimmedDescription,
        long_description: projectForm.long_description?.trim() || "",
        tech: parseListInput(projectForm.techText),
        gallery: parseListInput(projectForm.galleryText),
        price: Number(projectForm.price || 0),
        category: projectForm.category || "Free",
        demo_url: projectForm.demo_url?.trim() || "",
        hero_image: projectForm.image_url?.trim() || "",
        image_url: projectForm.image_url?.trim() || "",
        file: projectForm.file?.trim() || "",
        file_name: projectForm.file_name?.trim() || "",
        sort_order: Number(projectForm.sort_order || 0),
        is_featured: Boolean(projectForm.is_featured),
        is_paid: Boolean(projectForm.is_paid),
      };

      const response = editingProjectId
        ? await updateProject(editingProjectId, payload)
        : await createProject(payload);

      console.log("Project save response:", response);

      const projectId = response.project?.id;

      if (projectId && imageFile) {
        await uploadProjectImage(projectId, imageFile);
      }

      if (projectId && archiveFile) {
        await uploadProjectArchive(projectId, archiveFile);
      }

      return response;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-projects"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-summary"] }),
      ]);
      toast.success(
        editingProjectId ? "Project updated ho gaya" : "Project add ho gaya",
      );
      setProjectForm(defaultProjectForm);
      setEditingProjectId(null);
      setImageFile(null);
      setArchiveFile(null);
    },
    onError: (error: any) => {
      logDashboardDebug("Save project failed", error, {
        editingProjectId,
        projectForm,
        imageFile: imageFile?.name || null,
        archiveFile: archiveFile?.name || null,
      });
      const msg =
        error.response?.data?.message ||
        (error instanceof Error ? error.message : "Project save nahi ho paya");
      toast.error(msg);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: removeProject,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-projects"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-summary"] }),
      ]);
      toast.success("Project deleted successfully");
    },
  });

  const reorderProjectsMutation = useMutation({
    mutationFn: async (orderedList: Project[]) => {
      const ids = orderedList.map((p) => p.id);
      return reorderProjects(ids);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: () => {
      console.error("Admin Debug: reorder projects failed", {
        localProjectsList,
        adminProjects,
      });
      toast.error("Failed to reorder projects");
      setLocalProjectsList(adminProjects);
    },
  });

  const handleReorder = (newOrder: Project[]) => {
    setLocalProjectsList(newOrder);
    reorderProjectsMutation.mutate(newOrder);
  };

  const saveContentMutation = useMutation({
    mutationFn: async () => {
      const payload: AdminContentPayload = {
        profile: parseJsonEditor<Record<string, unknown>>(
          "Profile",
          contentEditors.profile,
        ),
        siteSettings: parseJsonEditor<SiteSetting[]>(
          "Site settings",
          contentEditors.siteSettings,
        ),
        siteAssets: parseJsonEditor<SiteAsset[]>(
          "Site assets",
          contentEditors.siteAssets,
        ),
        socialLinks: parseJsonEditor<Array<Record<string, unknown>>>(
          "Social links",
          contentEditors.socialLinks,
        ),
        homeStats: parseJsonEditor<Array<Record<string, unknown>>>(
          "Home stats",
          contentEditors.homeStats,
        ),
        capabilities: parseJsonEditor<Array<Record<string, unknown>>>(
          "Capabilities",
          contentEditors.capabilities,
        ),
        services: parseJsonEditor<Array<Record<string, unknown>>>(
          "Services",
          contentEditors.services,
        ),
        aboutSections: parseJsonEditor<Array<Record<string, unknown>>>(
          "About sections",
          contentEditors.aboutSections,
        ),
        aboutItems: parseJsonEditor<Array<Record<string, unknown>>>(
          "About items",
          contentEditors.aboutItems,
        ),
        legalPages: parseJsonEditor<LegalPage[]>(
          "Legal pages",
          contentEditors.legalPages,
        ),
      };

      return saveAdminContent(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      await queryClient.invalidateQueries({ queryKey: ["site-assets"] });
      toast.success("Content updated successfully");
    },
    onError: (error: any) => {
      logDashboardDebug("Save admin content failed", error, {
        contentEditors,
      });
      const msg =
        error.response?.data?.message ||
        (error instanceof Error ? error.message : "Content save nahi hua");
      toast.error(msg);
    },
  });

  const uploadSiteAssetMutation = useMutation({
    mutationFn: async ({ assetKey, file }: { assetKey: string; file: File }) =>
      uploadSiteAsset(assetKey, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      await queryClient.invalidateQueries({ queryKey: ["site-assets"] });
      toast.success("Site image uploaded successfully");
    },
    onError: (error: any) => {
      logDashboardDebug("Upload site asset failed", error);
      const msg =
        error.response?.data?.message ||
        (error instanceof Error ? error.message : "Image upload nahi hui");
      toast.error(msg);
    },
  });

  const deleteSiteAssetMutation = useMutation({
    mutationFn: deleteSiteAsset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      await queryClient.invalidateQueries({ queryKey: ["site-assets"] });
      toast.success("Image permanently deleted from server");
    },
    onError: (error: any) => {
      logDashboardDebug("Delete site asset failed", error);
      const msg =
        error.response?.data?.message ||
        (error instanceof Error ? error.message : "Image deletion failed");
      toast.error(msg);
    },
  });

  const uploadProfileHeroImageMutation = useMutation({
    mutationFn: async (file: File) => uploadProfileHeroImage(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      toast.success("Profile hero image uploaded successfully");
      setProfileHeroImageFile(null);
    },
    onError: (error: any) => {
      logDashboardDebug("Upload profile hero image failed", error);
      const msg = error.response?.data?.message || "Hero image upload failed";
      toast.error(msg);
    },
  });

  const deleteProfileHeroImageMutation = useMutation({
    mutationFn: deleteProfileHeroImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      toast.success("Profile hero image permanently deleted");
    },
    onError: (error: any) => {
      logDashboardDebug("Delete profile hero image failed", error);
      const msg = error.response?.data?.message || "Hero image deletion failed";
      toast.error(msg);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteAdminOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-summary"] }),
      ]);
      toast.success("Order deleted successfully");
    },
    onError: (error: any) => {
      logDashboardDebug("Delete order failed", error);
      toast.error(error?.response?.data?.message || "Order delete nahi hua");
    },
  });

  const updateHeroPositionMutation = useMutation({
    mutationFn: async (position: string) => {
      const payload: AdminContentPayload = {
        profile: parseJsonEditor<Record<string, unknown>>(
          "Profile",
          contentEditors.profile,
        ),
        siteSettings: parseJsonEditor<SiteSetting[]>(
          "Site settings",
          contentEditors.siteSettings,
        ),
        siteAssets: parseJsonEditor<SiteAsset[]>(
          "Site assets",
          contentEditors.siteAssets,
        ),
        socialLinks: parseJsonEditor<Array<Record<string, unknown>>>(
          "Social links",
          contentEditors.socialLinks,
        ),
        homeStats: parseJsonEditor<Array<Record<string, unknown>>>(
          "Home stats",
          contentEditors.homeStats,
        ),
        capabilities: parseJsonEditor<Array<Record<string, unknown>>>(
          "Capabilities",
          contentEditors.capabilities,
        ),
        services: parseJsonEditor<Array<Record<string, unknown>>>(
          "Services",
          contentEditors.services,
        ),
        aboutSections: parseJsonEditor<Array<Record<string, unknown>>>(
          "About sections",
          contentEditors.aboutSections,
        ),
        aboutItems: parseJsonEditor<Array<Record<string, unknown>>>(
          "About items",
          contentEditors.aboutItems,
        ),
        legalPages: parseJsonEditor<LegalPage[]>(
          "Legal pages",
          contentEditors.legalPages,
        ),
      };
      if (payload.profile) {
        payload.profile.hero_image_position = position;
      }
      return saveAdminContent(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      toast.success("Hero image position updated!");
    },
    onError: (error: any) => {
      logDashboardDebug("Update hero position failed", error);
      toast.error("Failed to update position");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: deleteAdminMessage,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-messages"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-summary"] }),
      ]);
      toast.success("Message deleted successfully");
    },
    onError: (error: any) => {
      logDashboardDebug("Delete message failed", error);
      toast.error(error?.response?.data?.message || "Message delete nahi hua");
    },
  });

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      slug: project.slug || "",
      title: project.title || "",
      tagline: project.tagline || "",
      description: project.description || "",
      long_description: project.long_description || "",
      techText: formatListInput(project.tech),
      galleryText: formatListInput(project.gallery),
      price: String(project.price ?? 0),
      category:
        project.category || (Number(project.price) === 0 ? "Free" : "Paid"),
      demo_url: project.demo_url || "",
      image_url: project.image_url || project.hero_image || "",
      file: project.file || "",
      file_name: project.file_name || "",
      sort_order: Number(project.sort_order || 0),
      is_featured: Boolean(project.is_featured),
      is_paid: Boolean(project.is_paid),
    });
    setImageFile(null);
    setArchiveFile(null);
    setActiveTab("projects");
  };

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/dashboard" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <motion.section
          className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="rounded-[36px] p-7">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
              Dashboard overview
            </p>
            <h1 className="section-title mt-3">
              Welcome back, {user?.name?.split(" ")[0] || "builder"}.
            </h1>
            <p className="section-copy mt-4">
              This is your command center for purchases, downloads, and hiring
              interactions.
            </p>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { label: "Orders", value: "03", icon: FiShoppingBag },
              {
                label: "Downloads",
                value: String(purchasedProjects.length).padStart(2, "0"),
                icon: FiDownload,
              },
              {
                label: "Projects",
                value: String(localProjects.length).padStart(2, "0"),
                icon: FiFolder,
              },
            ].map((item) => (
              <Card key={item.label} className="rounded-[30px] p-5">
                <item.icon className="text-lg text-[var(--muted)]" />
                <p className="mt-4 text-3xl font-bold">{item.value}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.label}</p>
              </Card>
            ))}
          </div>
        </motion.section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.section
        className="grid gap-4 xl:grid-cols-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {[
          {
            label: "Projects",
            value: summary?.totals.projects ?? 0,
            icon: FiFolder,
          },
          {
            label: "Orders",
            value: summary?.totals.orders ?? 0,
            icon: FiShoppingBag,
          },
          {
            label: "Messages",
            value: summary?.totals.messages ?? 0,
            icon: FiMessageSquare,
          },
          {
            label: "Featured",
            value: summary?.totals.featuredProjects ?? 0,
            icon: FiDownload,
          },
        ].map((item) => (
          <Card key={item.label} className="rounded-[30px] p-5">
            <item.icon className="text-lg text-[var(--muted)]" />
            <p className="mt-4 text-3xl font-bold">
              {String(item.value).padStart(2, "0")}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">{item.label}</p>
          </Card>
        ))}
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        <Card className="rounded-[36px] p-4 sm:p-6">
          <div className="flex flex-wrap gap-3">
            {[
              ["projects", "Projects"],
              ["images", "Site Images"],
              ["content", "Content JSON"],
              ["legal", "Agreements"],
              ["cookies", "Cookies"],
              ["orders", "Orders"],
              ["messages", "Messages"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`rounded-full px-4 py-2 text-sm ${activeTab === key ? "bg-[var(--accent)] text-[var(--bg)]" : "bg-[var(--bg-soft)] text-[var(--muted)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {activeTab === "projects" ? (
        <motion.section
          className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="rounded-[36px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Project Manager</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Yahin se project add, edit, image URL set, image upload, aur
                  zip upload manage karo.
                </p>
              </div>
              {editingProjectId ? (
                <button
                  type="button"
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                  onClick={() => {
                    setEditingProjectId(null);
                    setProjectForm(defaultProjectForm);
                    setImageFile(null);
                    setArchiveFile(null);
                  }}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveProjectMutation.mutate();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  required
                  placeholder="Slug* (e.g. food-delivery-app)"
                  value={projectForm.slug}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      slug: e.target.value,
                    }))
                  }
                />
                <Input
                  required
                  minLength={2}
                  placeholder="Project title* (e.g. Swiggy Clone)"
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <Input
                placeholder="Tagline (e.g. A fast, scalable food delivery platform)"
                value={projectForm.tagline}
                onChange={(e) =>
                  setProjectForm((current) => ({
                    ...current,
                    tagline: e.target.value,
                  }))
                }
              />
              <textarea
                required
                minLength={10}
                className="min-h-24 w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 outline-none"
                placeholder="Short description* (minimum 10 characters)"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
              />
              <textarea
                className="min-h-32 w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 outline-none"
                placeholder="Long description (e.g. Detailed breakdown of features, tech choices, performance metrics...)"
                value={projectForm.long_description}
                onChange={(e) =>
                  setProjectForm((current) => ({
                    ...current,
                    long_description: e.target.value,
                  }))
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <textarea
                  className="min-h-28 w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 outline-none"
                  placeholder="Tech stack, one per line (e.g. React\nNode.js\nMongoDB)"
                  value={projectForm.techText}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      techText: e.target.value,
                    }))
                  }
                />
                <textarea
                  className="min-h-28 w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 outline-none"
                  placeholder="Features or gallery items, one per line (e.g. User Auth\nOR\n/images/demo.png)"
                  value={projectForm.galleryText}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      galleryText: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Input
                  type="number"
                  placeholder="Sort Order (0=Top)"
                  value={projectForm.sort_order}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      sort_order: Number(e.target.value),
                    }))
                  }
                />
                <Input
                  type="number"
                  placeholder="Price (USD)"
                  value={projectForm.price}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      price: e.target.value,
                    }))
                  }
                />
                <select
                  value={projectForm.category}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      category: e.target.value as ProjectCategory,
                    }))
                  }
                  className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 outline-none"
                >
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
                <label className="flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={projectForm.is_featured}
                    onChange={(e) =>
                      setProjectForm((current) => ({
                        ...current,
                        is_featured: e.target.checked,
                      }))
                    }
                  />
                  Featured
                </label>
                <label className="flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={projectForm.is_paid}
                    onChange={(e) =>
                      setProjectForm((current) => ({
                        ...current,
                        is_paid: e.target.checked,
                      }))
                    }
                  />
                  Paid Access
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Demo URL (e.g. https://demo.com)"
                  value={projectForm.demo_url}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      demo_url: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Hero Image URL (e.g. https://res.cloudinary.../img.jpg)"
                  value={projectForm.image_url}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      image_url: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Drive/File URL (e.g. https://drive...)"
                  value={projectForm.file}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      file: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Download Name (e.g. project-assets.zip)"
                  value={projectForm.file_name}
                  onChange={(e) =>
                    setProjectForm((current) => ({
                      ...current,
                      file_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4 text-sm text-[var(--muted)]">
                  <span className="block font-medium text-[var(--text)]">
                    Project image upload
                  </span>
                  <span className="mt-1 block">
                    Agar file choose karoge to save ke baad image upload ho
                    jayegi.
                  </span>
                  <input
                    className="mt-3 block w-full"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                <label className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4 text-sm text-[var(--muted)]">
                  <span className="block font-medium text-[var(--text)]">
                    Project zip upload
                  </span>
                  <span className="mt-1 block">
                    Zip choose karoge to project file field automatic update ho
                    jayegi.
                  </span>
                  <input
                    className="mt-3 block w-full"
                    type="file"
                    accept=".zip,.rar,.7z,application/zip"
                    onChange={(e) =>
                      setArchiveFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>
              <Button type="submit" isLoading={saveProjectMutation.isPending}>
                {editingProjectId ? "Update Project" : "Add Project"}
              </Button>
            </form>
          </Card>

          <Card className="rounded-[36px] p-6">
            <div>
              <h2 className="text-2xl font-semibold">Existing Projects</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Drag and drop projects to instantly reorder them everywhere.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {projectsLoading ? (
                <PageLoader
                  className="min-h-[200px]"
                  message="Loading projects..."
                />
              ) : (
                <Reorder.Group
                  axis="y"
                  values={localProjectsList}
                  onReorder={handleReorder}
                  className="space-y-3"
                >
                  {localProjectsList.map((project) => (
                    <Reorder.Item
                      key={project.id}
                      value={project}
                      className="cursor-grab active:cursor-grabbing rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4 relative bg-[var(--bg)] xl:bg-[var(--bg-soft)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{project.title}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {project.slug}
                          </p>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            {project.tagline}
                          </p>
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Downloads: {project.download_count || 0} |{" "}
                            {project.category || "Paid"} | Pos:{" "}
                            {project.sort_order || 0}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            className="rounded-full border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--bg)] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingProject(project);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            className="rounded-full border border-red-300 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete ${project.title}?`)) {
                                deleteProjectMutation.mutate(project.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>
          </Card>
        </motion.section>
      ) : null}

      {activeTab === "images" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="rounded-[36px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Site Image Manager</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Yahan se Home, About, Contact, Hire, Login, Register waali
                  site images ko URL se ya direct upload se manage kar sakte ho.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => saveContentMutation.mutate()}
                isLoading={saveContentMutation.isPending}
              >
                Save Image URLs
              </Button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {/* Profile Hero Image Manager */}
              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-4 md:col-span-2 lg:col-span-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-lg text-[var(--accent)]">
                      Profile Hero Image
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Key: profile.hero_image
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {parsedProfile.hero_image ? (
                      <>
                        <a
                          href={parsedProfile.hero_image}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="rounded-full px-3 py-2 text-xs border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)] hover:text-blue-500 hover:border-blue-300 transition-colors"
                          title="Download Image"
                        >
                          Download
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Permanently delete profile hero image from the server?",
                              )
                            ) {
                              deleteProfileHeroImageMutation.mutate();
                            }
                          }}
                          className="rounded-full px-3 py-2 text-xs border border-[var(--border)] bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          disabled={deleteProfileHeroImageMutation.isPending}
                          title="Delete Image from server"
                        >
                          {deleteProfileHeroImageMutation.isPending
                            ? "..."
                            : "Delete"}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {parsedProfile.hero_image ? (
                  <img
                    src={parsedProfile.hero_image}
                    alt="Profile Hero"
                    className="mt-4 h-48 w-full rounded-[20px] object-cover"
                  />
                ) : (
                  <div className="mt-4 flex h-48 items-center justify-center rounded-[20px] border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">
                    No profile hero image yet
                  </div>
                )}

                <div className="mt-4 flex gap-4 items-center pl-1">
                  <span className="text-sm font-medium">Image Position:</span>
                  <select
                    value={parsedProfile.hero_image_position || "right"}
                    onChange={(e) => {
                      const newPos = e.target.value;
                      const next = {
                        ...parsedProfile,
                        hero_image_position: newPos,
                      };
                      setContentEditors((current) => ({
                        ...current,
                        profile: safeJsonStringify(next),
                      }));
                      updateHeroPositionMutation.mutate(newPos);
                    }}
                    disabled={updateHeroPositionMutation.isPending}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm outline-none"
                  >
                    <option value="right">Right (Default)</option>
                    <option value="left">Left</option>
                  </select>
                </div>

                <Input
                  className="mt-4"
                  placeholder="Image URL (Manual Edit)"
                  value={parsedProfile.hero_image || ""}
                  onChange={(e) => {
                    const next = {
                      ...parsedProfile,
                      hero_image: e.target.value,
                    };
                    setContentEditors((current) => ({
                      ...current,
                      profile: safeJsonStringify(next),
                    }));
                  }}
                />

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setProfileHeroImageFile(e.target.files?.[0] || null)
                    }
                    className="block w-full text-sm"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm whitespace-nowrap"
                    onClick={() => {
                      if (!profileHeroImageFile) {
                        toast.error("Please choose an image file first");
                        return;
                      }
                      uploadProfileHeroImageMutation.mutate(
                        profileHeroImageFile,
                      );
                    }}
                    disabled={uploadProfileHeroImageMutation.isPending}
                  >
                    <FiUploadCloud /> Upload
                  </button>
                </div>
              </div>

              {parsedSiteAssets.map((asset, index) => (
                <div
                  key={`${asset.asset_key}-${index}`}
                  className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {asset.label || asset.asset_key}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Key: {asset.asset_key}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {asset.asset_url ? (
                        <>
                          <a
                            href={asset.asset_url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="rounded-full px-3 py-2 text-xs border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)] hover:text-blue-500 hover:border-blue-300 transition-colors"
                            title="Download Image"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Permanently delete this image from the server?",
                                )
                              ) {
                                deleteSiteAssetMutation.mutate(asset.asset_key);
                              }
                            }}
                            className="rounded-full px-3 py-2 text-xs border border-[var(--border)] bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            disabled={deleteSiteAssetMutation.isPending}
                            title="Delete Image from server"
                          >
                            {deleteSiteAssetMutation.isPending
                              ? "..."
                              : "Delete"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {asset.asset_url ? (
                    <img
                      src={asset.asset_url}
                      alt={asset.label || asset.asset_key}
                      className="mt-4 h-36 w-full rounded-[20px] object-cover"
                    />
                  ) : (
                    <div className="mt-4 flex h-36 items-center justify-center rounded-[20px] border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">
                      No image yet
                    </div>
                  )}
                  <Input
                    className="mt-4"
                    placeholder="Image URL"
                    value={asset.asset_url || ""}
                    onChange={(e) => {
                      const next = parsedSiteAssets.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, asset_url: e.target.value }
                          : item,
                      );
                      setContentEditors((current) => ({
                        ...current,
                        siteAssets: safeJsonStringify(next),
                      }));
                    }}
                  />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setAssetFiles((current) => ({
                          ...current,
                          [asset.asset_key]: e.target.files?.[0] || null,
                        }))
                      }
                      className="block w-full text-sm"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                      onClick={() => {
                        const file = assetFiles[asset.asset_key];
                        if (!file) {
                          toast.error("Please choose an image file first");
                          return;
                        }
                        uploadSiteAssetMutation.mutate({
                          assetKey: asset.asset_key,
                          file,
                        });
                      }}
                      disabled={uploadSiteAssetMutation.isPending}
                    >
                      <FiUploadCloud /> Upload
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <label className="mt-8 block">
              <span className="mb-2 block text-sm font-medium">
                Site Assets JSON
              </span>
              <textarea
                className="min-h-72 w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 font-mono text-sm outline-none"
                value={contentEditors.siteAssets}
                onChange={(e) =>
                  setContentEditors((current) => ({
                    ...current,
                    siteAssets: e.target.value,
                  }))
                }
              />
            </label>

            <div className="mt-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Order Email Settings
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Ye values database me save hongi aur naya order aate hi
                    notification isi list par jayegi.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                  onClick={() => saveContentMutation.mutate()}
                  disabled={saveContentMutation.isPending}
                >
                  {saveContentMutation.isPending
                    ? "Saving..."
                    : "Save Email Settings"}
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {parsedSiteSettings.map((setting, index) => (
                  <div
                    key={`${setting.setting_key}-${index}`}
                    className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                  >
                    <p className="font-semibold">
                      {setting.label || setting.setting_key}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Key: {setting.setting_key}
                    </p>
                    <Input
                      className="mt-4"
                      placeholder="Setting value"
                      value={setting.setting_value || ""}
                      onChange={(e) => {
                        const next = parsedSiteSettings.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, setting_value: e.target.value }
                              : item,
                        );
                        setContentEditors((current) => ({
                          ...current,
                          siteSettings: safeJsonStringify(next),
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-medium">
                  Site Settings JSON
                </span>
                <textarea
                  className="min-h-56 w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 font-mono text-sm outline-none"
                  value={contentEditors.siteSettings}
                  onChange={(e) =>
                    setContentEditors((current) => ({
                      ...current,
                      siteSettings: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </Card>
        </motion.div>
      ) : null}

      {activeTab === "content" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="rounded-[36px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  Content Control Center
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Yahan JSON me sari editable site content rahegi. Isse aap
                  sections add, remove, reorder, ya update kar sakte ho bina
                  code khole.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => saveContentMutation.mutate()}
                isLoading={saveContentMutation.isPending}
              >
                Save Content
              </Button>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {[
                [
                  "profile",
                  "Profile JSON",
                  '{\n  "full_name": "Love Kumar",\n  "headline": "Full Stack Developer | MCA"\n}',
                ],
                [
                  "siteSettings",
                  "Site Settings JSON",
                  '[\n  {\n    "setting_key": "contact_email",\n    "setting_value": "hello@lovekumar.com"\n  }\n]',
                ],
                [
                  "socialLinks",
                  "Social Links JSON",
                  '[\n  {\n    "label": "GitHub",\n    "url": "https://github.com/love",\n    "icon": "FiGithub"\n  }\n]',
                ],
                [
                  "homeStats",
                  "Home Stats JSON",
                  '[\n  {\n    "section_key": "stats",\n    "title": "05+",\n    "description": "Years Experience"\n  }\n]',
                ],
                [
                  "capabilities",
                  "Capabilities JSON",
                  '[\n  {\n    "title": "Frontend Dev",\n    "description": "React, Vue, Tailwind"\n  }\n]',
                ],
                [
                  "services",
                  "Services JSON",
                  '[\n  {\n    "title": "Freelance Consulting",\n    "description": "Helping scale products",\n    "badge": "Popular"\n  }\n]',
                ],
                [
                  "aboutSections",
                  "About Sections JSON",
                  '[\n  {\n    "section_key": "story",\n    "title": "My Story",\n    "description": "How I started coding..."\n  }\n]',
                ],
                [
                  "aboutItems",
                  "About Items JSON",
                  '[\n  {\n    "section_key": "education",\n    "title": "Master of Computer Applications",\n    "description": "IPU 2024"\n  }\n]',
                ],
              ].map(([key, label, example]) => (
                <label key={key} className="block">
                  <span className="mb-2 block text-sm font-medium">
                    {label}
                  </span>
                  <textarea
                    className="min-h-64 w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 font-mono text-sm outline-none placeholder:text-[var(--border)]"
                    placeholder={(example as string) || "JSON configuration..."}
                    value={contentEditors[key as keyof typeof contentEditors]}
                    onChange={(e) =>
                      setContentEditors((current) => ({
                        ...current,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </Card>
        </motion.div>
      ) : null}

      {activeTab === "legal" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="rounded-[36px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Agreements & Legal</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Manage Terms, Privacy Policy, Refunds, etc.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => saveContentMutation.mutate()}
                isLoading={saveContentMutation.isPending}
              >
                Save Legal Changes
              </Button>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Existing Pages</h3>
                {parsedLegalPages.map((page, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                  >
                    <div>
                      <p className="font-semibold">{page.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        /{page.page_key}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--bg)] transition-colors"
                        onClick={() =>
                          setLegalPageForm({
                            originalKey: page.page_key,
                            page_key: page.page_key,
                            title: page.title,
                            content:
                              typeof page.content === "string"
                                ? page.content
                                : JSON.stringify(page.content),
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => {
                          if (window.confirm(`Delete ${page.title}?`)) {
                            const next = parsedLegalPages.filter(
                              (p) => p.page_key !== page.page_key,
                            );
                            setContentEditors((curr) => ({
                              ...curr,
                              legalPages: safeJsonStringify(next),
                            }));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {parsedLegalPages.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">
                    No legal pages found. Add one below.
                  </p>
                )}
              </div>

              <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)] p-6">
                <h3 className="text-xl font-semibold">
                  {legalPageForm.originalKey ? "Edit Page" : "Add New Page"}
                </h3>
                <Input
                  placeholder="Page slug (e.g. terms, privacy)"
                  value={legalPageForm.page_key || ""}
                  onChange={(e) =>
                    setLegalPageForm((curr) => ({
                      ...curr,
                      page_key: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Page Title (e.g. Terms of Service)"
                  value={legalPageForm.title || ""}
                  onChange={(e) =>
                    setLegalPageForm((curr) => ({
                      ...curr,
                      title: e.target.value,
                    }))
                  }
                />
                <textarea
                  className="min-h-72 w-full rounded-3xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none placeholder:text-[var(--border)]"
                  placeholder={
                    'Paste HTML like:\n<div>\n  <p>Hello world</p>\n</div>\n\n--- OR ---\n\nPaste JSON like:\n{\n  "sections": [\n    {\n      "title": "Data Collection",\n      "body": "We collect your data..."\n    }\n  ]\n}'
                  }
                  value={(legalPageForm.content as string) || ""}
                  onChange={(e) =>
                    setLegalPageForm((curr) => ({
                      ...curr,
                      content: e.target.value,
                    }))
                  }
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      const pageKey = legalPageForm.page_key?.trim();
                      const pageTitle = legalPageForm.title?.trim();
                      if (!pageKey || !pageTitle) {
                        toast.error("Key and Title required");
                        return;
                      }

                      const existingIdx = parsedLegalPages.findIndex(
                        (p) => p.page_key === legalPageForm.originalKey,
                      );

                      // Parse content if it's JSON string, otherwise keep as string
                      let finalContent: any = legalPageForm.content || "";
                      try {
                        finalContent = JSON.parse(
                          legalPageForm.content as string,
                        );
                      } catch {
                        // It's not valid JSON, so treat it as standard string
                      }

                      const newPage: LegalPage = {
                        page_key: pageKey,
                        title: pageTitle,
                        content: finalContent,
                      };
                      const next = [...parsedLegalPages];

                      if (existingIdx >= 0) {
                        if (
                          legalPageForm.originalKey !== pageKey &&
                          next.some((p) => p.page_key === pageKey)
                        ) {
                          toast.error(
                            "Another page with this key already exists",
                          );
                          return;
                        }
                        next[existingIdx] = newPage;
                      } else {
                        if (next.some((p) => p.page_key === pageKey)) {
                          toast.error("Key must be unique");
                          return;
                        }
                        next.push(newPage);
                      }

                      setContentEditors((curr) => ({
                        ...curr,
                        legalPages: safeJsonStringify(next),
                      }));
                      setLegalPageForm({});
                      toast.success(
                        "Page staged! Click 'Save Legal Changes' to update the live site.",
                      );
                    }}
                  >
                    {legalPageForm.originalKey ? "Update List" : "Add to List"}
                  </Button>

                  {legalPageForm.page_key && (
                    <button
                      type="button"
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg)] transition-colors"
                      onClick={() => setLegalPageForm({})}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : null}

      {activeTab === "cookies" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="rounded-[36px] p-6 space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Cookie Management</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Manage your consent banner text and your list of active
                  cookies/trackers.
                </p>
              </div>
              <Button
                onClick={() => saveContentMutation.mutate()}
                isLoading={saveContentMutation.isPending}
              >
                Save Cookie Changes
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
                1. Banner Configuration
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    key: "cookie_banner_title",
                    label: "Banner Title",
                    default: "We value your privacy",
                  },
                  {
                    key: "cookie_banner_text",
                    label: "Banner Text",
                    default:
                      "We use cookies to improve your browsing experience and analyze our traffic.",
                  },
                ].map((field) => {
                  const val =
                    parsedSiteSettings.find((s) => s.setting_key === field.key)
                      ?.setting_value || "";
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-sm font-medium">
                        {field.label}
                      </label>
                      <Input
                        value={val}
                        placeholder={field.default}
                        onChange={(e) => {
                          const existingIdx = parsedSiteSettings.findIndex(
                            (s) => s.setting_key === field.key,
                          );
                          const next = [...parsedSiteSettings];
                          if (existingIdx >= 0) {
                            next[existingIdx] = {
                              ...next[existingIdx],
                              setting_value: e.target.value,
                            };
                          } else {
                            next.push({
                              id: Date.now(),
                              setting_key: field.key,
                              label: field.label,
                              setting_value: e.target.value,
                            });
                          }
                          setContentEditors((curr) => ({
                            ...curr,
                            siteSettings: safeJsonStringify(next),
                          }));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
                2. Used Cookies Declarations (CRUD)
              </h3>
              {(() => {
                const scriptsSetting = parsedSiteSettings.find(
                  (s) => s.setting_key === "cookie_scripts",
                );
                let scripts: any[] = [];
                try {
                  scripts = JSON.parse(scriptsSetting?.setting_value || "[]");
                } catch {}

                return (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {scripts.map((script, idx) => (
                        <div
                          key={idx}
                          className="rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-4 flex flex-col justify-between"
                        >
                          <div>
                            <p className="font-semibold text-sm">
                              {script.name}
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              Duration: {script.duration}
                            </p>
                            <p className="mt-2 text-xs text-[var(--muted)]">
                              {script.purpose}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="mt-4 self-start text-xs rounded-full border border-[var(--border)] p-2 text-red-500 hover:bg-red-500 hover:text-white transition"
                            onClick={() => {
                              const nextScripts = scripts.filter(
                                (_, i) => i !== idx,
                              );
                              const existingIdx = parsedSiteSettings.findIndex(
                                (s) => s.setting_key === "cookie_scripts",
                              );
                              const next = [...parsedSiteSettings];
                              if (existingIdx >= 0) {
                                next[existingIdx] = {
                                  ...next[existingIdx],
                                  setting_value: JSON.stringify(nextScripts),
                                };
                              } else {
                                next.push({
                                  id: Date.now(),
                                  setting_key: "cookie_scripts",
                                  label: "Cookie Scripts",
                                  setting_value: JSON.stringify(nextScripts),
                                });
                              }
                              setContentEditors((curr) => ({
                                ...curr,
                                siteSettings: safeJsonStringify(next),
                              }));
                            }}
                          >
                            <FiTrash2 className="inline" /> Remove
                          </button>
                        </div>
                      ))}
                      {scripts.length === 0 && (
                        <p className="text-sm text-[var(--muted)] col-span-3">
                          No cookies configured. Add one below.
                        </p>
                      )}
                    </div>

                    <div className="mt-6 rounded-[32px] border border-[var(--border)] bg-[var(--bg-soft)] p-5 space-y-4">
                      <p className="text-sm font-semibold">
                        Add New Cookie Declaration
                      </p>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          placeholder="Name (e.g. _ga)"
                          value={cookieForm.name}
                          onChange={(e) =>
                            setCookieForm((c) => ({
                              ...c,
                              name: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Duration (e.g. 2 years)"
                          value={cookieForm.duration}
                          onChange={(e) =>
                            setCookieForm((c) => ({
                              ...c,
                              duration: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Purpose (e.g. Used to track...)"
                          value={cookieForm.purpose}
                          onChange={(e) =>
                            setCookieForm((c) => ({
                              ...c,
                              purpose: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!cookieForm.name || !cookieForm.purpose) return;
                          const nextScripts = [...scripts, cookieForm];
                          const existingIdx = parsedSiteSettings.findIndex(
                            (s) => s.setting_key === "cookie_scripts",
                          );
                          const next = [...parsedSiteSettings];
                          if (existingIdx >= 0) {
                            next[existingIdx] = {
                              ...next[existingIdx],
                              setting_value: JSON.stringify(nextScripts),
                            };
                          } else {
                            next.push({
                              id: Date.now(),
                              setting_key: "cookie_scripts",
                              label: "Cookie Scripts",
                              setting_value: JSON.stringify(nextScripts),
                            });
                          }
                          setContentEditors((curr) => ({
                            ...curr,
                            siteSettings: safeJsonStringify(next),
                          }));
                          setCookieForm({
                            name: "",
                            purpose: "",
                            duration: "",
                          });
                        }}
                      >
                        Add to List
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </Card>
        </motion.div>
      ) : null}

      {activeTab === "orders" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="rounded-[36px] p-6">
            <h2 className="text-2xl font-semibold">Orders</h2>
            <div className="mt-5 space-y-3">
              {adminOrders.length ? (
                adminOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {order.name} • {order.project_type}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {order.email}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {order.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-red-300 p-2 text-red-500"
                      onClick={() => deleteOrderMutation.mutate(order.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Abhi koi order nahi hai.
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      ) : null}

      {activeTab === "messages" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="rounded-[36px] p-6">
            <h2 className="text-2xl font-semibold">Messages</h2>
            <div className="mt-5 space-y-3">
              {adminMessages.length ? (
                adminMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-start justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {message.name} • {message.type}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {message.email}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {message.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-red-300 p-2 text-red-500"
                      onClick={() => deleteMessageMutation.mutate(message.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Abhi koi message nahi hai.
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}

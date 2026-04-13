import axios from "axios";
import type { Project } from "../types/contentModels";

const AUTH_STORAGE_KEY = "portfolio_auth";

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredApiBaseUrl) {
    return normalizeBaseUrl(configuredApiBaseUrl);
  }

  if (typeof window === "undefined") {
    return "http://localhost:5000";
  }

  const { hostname, origin } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  return normalizeBaseUrl(origin);
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

import toast from "react-hot-toast";

const isDebuggableAdminRequest = (url?: string) =>
  Boolean(
    url &&
      ["/api/admin", "/api/projects", "/api/upload"].some((prefix) =>
        url.includes(prefix),
      ),
  );

const buildRequestUrl = (config?: {
  baseURL?: string;
  url?: string;
}) => {
  if (!config?.url) return "unknown-url";
  if (/^https?:\/\//i.test(config.url)) return config.url;
  return `${config.baseURL || ""}${config.url}`;
};

export const logApiError = (label: string, error: any) => {
  const requestInfo = {
    method: error?.config?.method?.toUpperCase?.() || "UNKNOWN",
    url: buildRequestUrl(error?.config),
    params: error?.config?.params,
    data: error?.config?.data,
    headers: error?.config?.headers,
  };

  const responseInfo = error?.response
    ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      }
    : null;

  console.group(`Admin Debug: ${label}`);
  console.error("Request", requestInfo);
  if (responseInfo) {
    console.error("Response", responseInfo);
  } else if (error?.request) {
    console.error("Network request made but no response received", error.request);
  } else {
    console.error("Unexpected error", error);
  }
  if (error?.stack) {
    console.error("Stack", error.stack);
  }
  console.groupEnd();
};

api.interceptors.request.use((config) => {
  let token = localStorage.getItem("token");
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

  if (storedAuth) {
    try {
      const parsedAuth = JSON.parse(storedAuth) as { token?: string };
      token = parsedAuth.token || token;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["x-api-key"] = import.meta.env.VITE_API_KEY || "portfolio-secure-key-2026";

  if (isDebuggableAdminRequest(config.url)) {
    console.group(`Admin API Request: ${config.method?.toUpperCase()} ${buildRequestUrl(config)}`);
    console.log("Params", config.params || null);
    console.log("Payload", config.data || null);
    console.groupEnd();
  }

  return config;
});

// Global response error interceptor intercept errors globally.
api.interceptors.response.use(
  (response) => {
    if (isDebuggableAdminRequest(response.config?.url)) {
      console.group(
        `Admin API Response: ${response.config?.method?.toUpperCase()} ${buildRequestUrl(response.config)}`,
      );
      console.log("Status", response.status);
      console.log("Data", response.data);
      console.groupEnd();
    }
    return response;
  },
  (error) => {
    if (isDebuggableAdminRequest(error?.config?.url)) {
      logApiError("HTTP request failed", error);
    }

    // We don't want to toast for basic 401s if they are part of standard app flow (like initial check)
    // But we want to toast 500s or unexpected errors globally.
    if (error.response) {
      const status = error.response.status;
      if (status >= 500) {
        toast.error(`Server Error: ${error.response.data?.message || "Something went wrong on the server."}`);
      } else if (status === 404 && !error.config.url?.includes("/api/auth/me")) {
        // Prevent showing 404 on initial auth check as it's normal when unauthenticated or new
      }
    } else if (error.request) {
      toast.error("Network error: Could not reach the server.");
    }
    return Promise.reject(error);
  }
);

export type AdminSummary = {
  totals: {
    projects: number;
    orders: number;
    messages: number;
    featuredProjects: number;
  };
};

export type SiteAsset = {
  id?: number;
  asset_key: string;
  label: string;
  asset_url?: string | null;
  asset_public_id?: string | null;
  sort_order?: number;
};

export type SiteSetting = {
  id?: number;
  setting_key: string;
  label: string;
  setting_value?: string | null;
  setting_group?: string | null;
  sort_order?: number;
};

export type AdminContentPayload = {
  profile: Record<string, unknown> | null;
  siteSettings: SiteSetting[];
  siteAssets: SiteAsset[];
  socialLinks: Array<Record<string, unknown>>;
  homeStats: Array<Record<string, unknown>>;
  capabilities: Array<Record<string, unknown>>;
  services: Array<Record<string, unknown>>;
  aboutSections: Array<Record<string, unknown>>;
  aboutItems: Array<Record<string, unknown>>;
  legalPages: import("../types/contentModels").LegalPage[];
};

export type AdminMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  type: string;
  created_at: string;
};

export type AdminOrder = {
  id: number;
  name: string;
  email: string;
  project_type: string;
  description: string;
  budget: number;
  advance_paid: boolean;
  status: string;
  created_at: string;
};

export const fetchAdminSummary = async () => {
  const { data } = await api.get<AdminSummary>("/api/admin/summary");
  return data;
};

export const fetchAdminContent = async () => {
  const { data } = await api.get<AdminContentPayload>("/api/admin/content");
  return data;
};

export const fetchSiteAssets = async () => {
  const { data } = await api.get<SiteAsset[]>("/api/content/site-assets");
  return data;
};

export const saveAdminContent = async (payload: AdminContentPayload) => {
  const { data } = await api.put("/api/admin/content", payload);
  return data;
};

export const fetchAdminOrders = async () => {
  const { data } = await api.get<AdminOrder[]>("/api/admin/orders");
  return data;
};

export const fetchAdminMessages = async () => {
  const { data } = await api.get<AdminMessage[]>("/api/admin/messages");
  return data;
};

export const deleteAdminOrder = async (id: number) => {
  const { data } = await api.delete(`/api/admin/orders/${id}`);
  return data;
};

export const deleteAdminMessage = async (id: number) => {
  const { data } = await api.delete(`/api/admin/messages/${id}`);
  return data;
};

export const createProject = async (payload: Partial<Project>) => {
  const { data } = await api.post<{ message: string; project: Project }>("/api/projects", payload);
  return data;
};

export const updateProject = async (id: number, payload: Partial<Project>) => {
  const { data } = await api.put<{ message: string; project: Project }>(`/api/projects/${id}`, payload);
  return data;
};

export const removeProject = async (id: number) => {
  const { data } = await api.delete<{ message: string }>(`/api/projects/${id}`);
  return data;
};

export const reorderProjects = async (projectIds: number[]) => {
  const { data } = await api.put<{ message: string }>("/api/projects/reorder", { projectIds });
  return data;
};

export const uploadProjectImage = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/api/upload/projects/${id}/hero-image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const uploadProjectArchive = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/api/upload/projects/${id}/archive`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const uploadSiteAsset = async (assetKey: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/api/upload/site-assets/${assetKey}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const deleteSiteAsset = async (assetKey: string) => {
  const { data } = await api.delete<{ message: string }>(`/api/upload/site-assets/${assetKey}`);
  return data;
};

export const uploadProfileHeroImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/api/upload/profile/hero-image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const deleteProfileHeroImage = async () => {
  const { data } = await api.delete<{ message: string }>(`/api/upload/profile/hero-image`);
  return data;
};

export default api;

import axios from "axios";
import type { Project } from "../types/contentModels";

const AUTH_STORAGE_KEY = "portfolio_auth";
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const fallbackApiBaseUrl =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";

const api = axios.create({
  baseURL: configuredApiBaseUrl || fallbackApiBaseUrl,
});

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

  return config;
});

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

export default api;

import { useQuery } from "@tanstack/react-query";
import { fetchSiteAssets, type SiteAsset } from "../api/axios";

export const getSiteAssetUrl = (
  assets: SiteAsset[] | undefined,
  key: string,
  fallback: string,
) => {
  if (!assets) return fallback;
  const normalizedAssets = Array.isArray(assets) ? assets : [];
  const found = normalizedAssets.find((item) => item.asset_key === key);
  if (found) {
    return found.asset_url || "";
  }
  return fallback;
};

export function useSiteAssets() {
  return useQuery({
    queryKey: ["site-assets"],
    queryFn: async () => {
      const data = await fetchSiteAssets();
      return Array.isArray(data) ? data : [];
    },
  });
}

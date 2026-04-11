import { useQuery } from "@tanstack/react-query";
import { fetchSiteAssets, type SiteAsset } from "../api/axios";

export const getSiteAssetUrl = (
  assets: SiteAsset[] | undefined,
  key: string,
  fallback: string,
) => {
  const normalizedAssets = Array.isArray(assets) ? assets : [];
  return normalizedAssets.find((item) => item.asset_key === key)?.asset_url || fallback;
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

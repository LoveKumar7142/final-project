import { useQuery } from "@tanstack/react-query";
import { fetchSiteAssets, type SiteAsset } from "../api/axios";

export const getSiteAssetUrl = (
  assets: SiteAsset[] | undefined,
  key: string,
  fallback: string,
) => assets?.find((item) => item.asset_key === key)?.asset_url || fallback;

export function useSiteAssets() {
  return useQuery({
    queryKey: ["site-assets"],
    queryFn: fetchSiteAssets,
  });
}

import type { MetadataRoute } from "next";
import { PORTAL_REGISTRY } from "@/lib/portals/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://www.gateway-sync.com/",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://www.gateway-sync.com/how-it-works",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.gateway-sync.com/integrations",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...PORTAL_REGISTRY.filter((p) => p.available).map((p) => ({
      url: `https://www.gateway-sync.com/integrations/${p.key}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: "https://www.gateway-sync.com/sign-up",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}

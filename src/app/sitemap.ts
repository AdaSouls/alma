import type { MetadataRoute } from "next";
import { PAGES, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, priority: 1 }, ...PAGES.map((p) => ({ url: `${SITE_URL}${p.href}`, priority: 0.8 }))];
}

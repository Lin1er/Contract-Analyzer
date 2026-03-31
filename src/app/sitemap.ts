import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clearcontract-safety.vercel.app";

  // Ensure URL has protocol for Vercel deployments
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = `https://${baseUrl}`;
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: baseUrl,
          id: baseUrl,
        },
      },
    },
  ];
}

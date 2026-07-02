import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { allSlugs } from "@/lib/curriculum";
import { connectDB } from "@/lib/db";
import { Teacher } from "@/models/Teacher";

// Search-engine sitemap. Lists only crawlable marketing routes — admin, account,
// teacher, api, test and the transactional success/failed/closed pages are
// intentionally excluded (also blocked in robots.ts).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/register", priority: 0.9, changeFrequency: "weekly" },
    { path: "/teachers", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  const courseRoutes = allSlugs().map((slug) => ({
    path: `/courses/${slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  let teacherRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [];
  try {
    await connectDB();
    const teachers = await Teacher.find().select("_id").lean();
    teacherRoutes = teachers.map((teacher) => ({
      path: `/teachers/${String(teacher._id)}`,
      priority: 0.5,
      changeFrequency: "monthly" as const,
    }));
  } catch {
    teacherRoutes = [];
  }

  return [...staticRoutes, ...courseRoutes, ...teacherRoutes].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}

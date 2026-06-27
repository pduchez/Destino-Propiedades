import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify } from "@/lib/json";
import { slugify } from "@/lib/slug";

export const GET = withAuth(async () => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true, assets: true, campaigns: true } } },
  });
  return json(projects);
});

export const POST = withAuth(async (req) => {
  const body = (await req.json()) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  if (!name) return errorJson("El nombre es obligatorio.");

  // Slug único
  let slug = slugify(name);
  let n = 1;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${slugify(name)}-${++n}`;
  }

  const project = await prisma.project.create({
    data: {
      name,
      slug,
      location: String(body.location ?? ""),
      propertyType: String(body.propertyType ?? ""),
      status: String(body.status ?? "active"),
      priceFrom: String(body.priceFrom ?? ""),
      currency: String(body.currency ?? "USD"),
      description: String(body.description ?? ""),
      amenities: stringify(toArray(body.amenities)),
      highlights: stringify(toArray(body.highlights)),
      hashtags: stringify(toArray(body.hashtags)),
      websiteUrl: String(body.websiteUrl ?? ""),
      contactInfo: String(body.contactInfo ?? ""),
    },
  });
  return json(project, 201);
});

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string")
    return v
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

export const dynamic = "force-dynamic";

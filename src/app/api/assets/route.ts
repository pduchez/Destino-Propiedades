import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { stringify, parseArray } from "@/lib/json";
import { saveBuffer } from "@/lib/storage";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const scope = url.searchParams.get("scope"); // "global" | "all"
  let where: Record<string, unknown> | undefined;
  if (scope === "global") where = { projectId: null };
  else if (projectId) where = { OR: [{ projectId }, { projectId: null }] };
  const assets = await prisma.asset.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return json(assets);
});

/** Subida multipart: campos "file" (uno o varios), "projectId", "tags". */
export const POST = withAuth(async (req) => {
  const form = await req.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) return errorJson("No se recibió ningún archivo.");

  const projectIdRaw = form.get("projectId");
  const projectId =
    typeof projectIdRaw === "string" && projectIdRaw ? projectIdRaw : null;
  const tagsRaw = form.get("tags");
  const tags =
    typeof tagsRaw === "string"
      ? tagsRaw
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const created = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await saveBuffer(
      buffer,
      file.name || "imagen",
      file.type || "image/jpeg",
    );
    const asset = await prisma.asset.create({
      data: {
        projectId,
        filename: stored.filename,
        originalName: file.name || "",
        url: stored.url,
        mimeType: file.type || "image/jpeg",
        sizeBytes: stored.sizeBytes,
        tags: stringify(tags),
      },
    });
    created.push(asset);
  }
  return json(created, 201);
});

export const dynamic = "force-dynamic";

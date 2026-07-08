import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** Sirve una imagen generada guardada en la base de datos. Pública (sin auth):
 *  la necesitan las redes sociales y la vista previa. */
export async function GET(_req: Request, { params }: Ctx) {
  const img = await prisma.storedImage.findUnique({ where: { id: params.id } });
  if (!img) return new Response("No encontrada", { status: 404 });
  return new Response(Buffer.from(img.bytes), {
    headers: {
      "content-type": img.mimeType || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

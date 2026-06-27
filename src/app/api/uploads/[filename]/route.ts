import { readStored, contentTypeFor } from "@/lib/storage";

type Ctx = { params: { filename: string } };

/** Sirve los archivos del stock guardados en ./uploads. Público (las imágenes
 *  deben ser accesibles por Meta/TikTok al publicar). */
export async function GET(_req: Request, { params }: Ctx) {
  const buffer = await readStored(params.filename);
  if (!buffer) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentTypeFor(params.filename),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export const dynamic = "force-dynamic";

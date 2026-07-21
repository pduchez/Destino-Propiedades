/**
 * Autoriza la subida DIRECTA de archivos pesados (videos de dron) del navegador
 * a Vercel Blob, sin pasar por el servidor (que tiene límite de tamaño). El
 * cliente usa `upload()` de @vercel/blob/client contra esta ruta.
 *
 * Requiere BLOB_READ_WRITE_TOKEN (Vercel lo inyecta al conectar un Blob store).
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        // Solo el administrador puede subir al stock.
        if (!(await isAdminRequest())) throw new Error("No autorizado");
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
          addRandomSuffix: true,
          // Hasta 2 GB por archivo (clips de dron).
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024,
        };
      },
      // El registro del Asset lo hace el cliente al terminar (POST /api/assets).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";

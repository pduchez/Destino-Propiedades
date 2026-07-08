/**
 * Abstracción de almacenamiento de imágenes del stock.
 *  - STORAGE_DRIVER="local" (por defecto): guarda en ./uploads y se sirve vía
 *    /api/uploads/<filename>. Ideal para desarrollo.
 *  - STORAGE_DRIVER="blob": sube a Vercel Blob y usa la URL pública directa.
 *    Ideal para producción en Vercel (filesystem efímero).
 */
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function driver(): "local" | "blob" {
  // Explícito, o automático si hay un Blob store conectado (Vercel setea
  // BLOB_READ_WRITE_TOKEN). En Vercel el FS es efímero, así que si hay Blob
  // disponible se usa para que las imágenes generadas persistan.
  if (process.env.STORAGE_DRIVER === "blob") return "blob";
  if (process.env.STORAGE_DRIVER === "local") return "local";
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
}

function safeExt(originalName: string, mimeType: string): string {
  const ext = path.extname(originalName).toLowerCase();
  if (ext && /^\.(jpg|jpeg|png|webp|gif|mp4|mov)$/.test(ext)) return ext;
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
  };
  return map[mimeType] ?? ".bin";
}

export interface StoredFile {
  filename: string;
  url: string;
  sizeBytes: number;
}

export async function saveBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredFile> {
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt(
    originalName,
    mimeType,
  )}`;

  if (driver() === "blob") {
    // Importación dinámica: el paquete solo se necesita en modo blob.
    const { put } = await import("@vercel/blob");
    const blob = await put(`stock/${filename}`, buffer, {
      access: "public",
      contentType: mimeType,
    });
    return { filename, url: blob.url, sizeBytes: buffer.byteLength };
  }

  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return {
    filename,
    url: `/api/uploads/${filename}`,
    sizeBytes: buffer.byteLength,
  };
}

export async function readStored(filename: string): Promise<Buffer | null> {
  // Solo aplica al driver local. Previene path traversal con basename.
  const base = path.basename(filename);
  const full = path.join(UPLOAD_DIR, base);
  if (!full.startsWith(UPLOAD_DIR) || !existsSync(full)) return null;
  return readFile(full);
}

/** Elimina el archivo. Para blob recibe la URL pública; para local, el filename. */
export async function deleteStored(filenameOrUrl: string): Promise<void> {
  if (driver() === "blob") {
    if (!/^https?:\/\//.test(filenameOrUrl)) return;
    const { del } = await import("@vercel/blob");
    await del(filenameOrUrl).catch(() => {});
    return;
  }
  const base = path.basename(filenameOrUrl);
  const full = path.join(UPLOAD_DIR, base);
  if (full.startsWith(UPLOAD_DIR) && existsSync(full)) {
    await unlink(full).catch(() => {});
  }
}

export function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
  };
  return map[ext] ?? "application/octet-stream";
}

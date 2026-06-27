/**
 * Abstracción de almacenamiento de imágenes del stock.
 * Driver "local": guarda en ./uploads y se sirve vía /api/uploads/<filename>.
 * Diseñado para poder reemplazarse por S3/R2 sin tocar el resto del código.
 */
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

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
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt(
    originalName,
    mimeType,
  )}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return {
    filename,
    url: `/api/uploads/${filename}`,
    sizeBytes: buffer.byteLength,
  };
}

export async function readStored(filename: string): Promise<Buffer | null> {
  // Previene path traversal: solo se permite el nombre base.
  const base = path.basename(filename);
  const full = path.join(UPLOAD_DIR, base);
  if (!full.startsWith(UPLOAD_DIR) || !existsSync(full)) return null;
  return readFile(full);
}

export async function deleteStored(filename: string): Promise<void> {
  const base = path.basename(filename);
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

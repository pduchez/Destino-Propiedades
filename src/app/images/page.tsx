"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

interface Project {
  id: string;
  name: string;
}
interface Asset {
  id: string;
  projectId: string | null;
  url: string;
  originalName: string;
  mimeType: string;
  tags: string;
}

export default function ImagesPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    const [a, p] = await Promise.all([
      api<Asset[]>("/api/assets?scope=all"),
      api<Project[]>("/api/projects"),
    ]);
    setAssets(a);
    setProjects(p);
  }
  useEffect(() => {
    load();
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("file", f));
      if (projectId) fd.append("projectId", projectId);
      if (tags) fd.append("tags", tags);
      await api("/api/assets", { method: "POST", body: fd });
      setFiles(null);
      setTags("");
      (document.getElementById("file-input") as HTMLInputElement).value = "";
      await load();
      setMsg("Subido ✓");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar imagen del stock?")) return;
    await api(`/api/assets/${id}`, { method: "DELETE" });
    await load();
  }

  const visible = assets.filter((a) => {
    if (filter === "all") return true;
    if (filter === "global") return a.projectId === null;
    return a.projectId === filter;
  });

  function tagList(json: string): string[] {
    try {
      return JSON.parse(json) as string[];
    } catch {
      return [];
    }
  }

  const projName = (id: string | null) =>
    id ? projects.find((p) => p.id === id)?.name ?? "—" : "Global";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Stock de imágenes</h1>
      <p className="text-slate-500">
        El bot elige imágenes aleatorias de este stock para acompañar los posts.
        Las imágenes globales sirven para cualquier proyecto. (TikTok usa video: sube .mp4/.mov)
      </p>

      <form onSubmit={upload} className="card space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Asignar a</label>
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Global (todos)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Etiquetas (coma)</label>
            <input className="input" placeholder="fachada, piscina, atardecer" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div>
            <label className="label">Archivos (imágenes o video)</label>
            <input
              id="file-input"
              className="input"
              type="file"
              accept="image/*,video/mp4,video/quicktime"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={uploading}>
            {uploading ? "Subiendo…" : "Subir al stock"}
          </button>
          {msg && <span className="text-sm text-slate-500">{msg}</span>}
        </div>
      </form>

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600">Filtrar:</label>
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todo</option>
          <option value="global">Solo global</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((a) => (
          <div key={a.id} className="card p-2">
            {a.mimeType.startsWith("video/") ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={a.url} className="h-36 w-full rounded object-cover" controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt={a.originalName} className="h-36 w-full rounded object-cover" />
            )}
            <div className="mt-2 px-1">
              <p className="truncate text-xs text-slate-500">{projName(a.projectId)}</p>
              <p className="truncate text-xs text-slate-400">{tagList(a.tags).join(", ")}</p>
              <button className="mt-1 text-xs text-red-600 hover:underline" onClick={() => remove(a.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full text-sm text-slate-500">No hay imágenes en este filtro.</p>
        )}
      </div>
    </div>
  );
}

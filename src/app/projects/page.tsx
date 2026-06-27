"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

interface Project {
  id: string;
  name: string;
  slug: string;
  location: string;
  propertyType: string;
  status: string;
  priceFrom: string;
  currency: string;
  description: string;
  amenities: string;
  highlights: string;
  hashtags: string;
  websiteUrl: string;
  contactInfo: string;
  _count?: { posts: number; assets: number; campaigns: number };
}

const EMPTY = {
  name: "",
  location: "",
  propertyType: "",
  status: "active",
  priceFrom: "",
  currency: "USD",
  description: "",
  amenities: "",
  highlights: "",
  hashtags: "",
  websiteUrl: "",
  contactInfo: "",
};

function arr(json: string): string {
  try {
    return (JSON.parse(json) as string[]).join(", ");
  } catch {
    return "";
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setProjects(await api<Project[]>("/api/projects"));
  }
  useEffect(() => {
    load();
  }, []);

  function edit(p: Project) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      location: p.location,
      propertyType: p.propertyType,
      status: p.status,
      priceFrom: p.priceFrom,
      currency: p.currency,
      description: p.description,
      amenities: arr(p.amenities),
      highlights: arr(p.highlights),
      hashtags: arr(p.hashtags),
      websiteUrl: p.websiteUrl,
      contactInfo: p.contactInfo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      if (editingId) {
        await api(`/api/projects/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      } else {
        await api("/api/projects", { method: "POST", body: JSON.stringify(form) });
      }
      reset();
      await load();
      setMsg("Guardado ✓");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await api(`/api/projects/${id}`, { method: "DELETE" });
    if (editingId === id) reset();
    await load();
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Proyectos inmobiliarios</h1>

      <form onSubmit={save} className="card space-y-4">
        <h2 className="font-semibold">
          {editingId ? "Editar proyecto" : "Nuevo proyecto"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" value={form.name} onChange={set("name")} required />
          </div>
          <div>
            <label className="label">Ubicación</label>
            <input className="input" value={form.location} onChange={set("location")} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <input className="input" placeholder="Apartamento, Casa, Lote…" value={form.propertyType} onChange={set("propertyType")} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.status} onChange={set("status")}>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="sold_out">Agotado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div>
            <label className="label">Precio desde</label>
            <input className="input" value={form.priceFrom} onChange={set("priceFrom")} />
          </div>
          <div>
            <label className="label">Moneda</label>
            <input className="input" value={form.currency} onChange={set("currency")} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descripción</label>
            <textarea className="input" rows={3} value={form.description} onChange={set("description")} />
          </div>
          <div>
            <label className="label">Amenidades (separadas por coma)</label>
            <textarea className="input" rows={2} value={form.amenities} onChange={set("amenities")} />
          </div>
          <div>
            <label className="label">Puntos destacados (separados por coma)</label>
            <textarea className="input" rows={2} value={form.highlights} onChange={set("highlights")} />
          </div>
          <div>
            <label className="label">Hashtags propios (separados por coma)</label>
            <input className="input" value={form.hashtags} onChange={set("hashtags")} />
          </div>
          <div>
            <label className="label">URL del proyecto</label>
            <input className="input" value={form.websiteUrl} onChange={set("websiteUrl")} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Información de contacto</label>
            <input className="input" value={form.contactInfo} onChange={set("contactInfo")} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={saving}>
            {editingId ? "Guardar cambios" : "Crear proyecto"}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={reset}>
              Cancelar
            </button>
          )}
          {msg && <span className="text-sm text-slate-500">{msg}</span>}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-500">
                  {p.location} {p.propertyType && `· ${p.propertyType}`}
                </p>
              </div>
              <span className="badge bg-slate-100 text-slate-600">{p.status}</span>
            </div>
            {p.priceFrom && (
              <p className="mt-2 text-sm">Desde {p.priceFrom} {p.currency}</p>
            )}
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{p.description}</p>
            <div className="mt-3 flex gap-3 text-xs text-slate-500">
              <span>{p._count?.campaigns ?? 0} campañas</span>
              <span>{p._count?.assets ?? 0} imágenes</span>
              <span>{p._count?.posts ?? 0} posts</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-secondary" onClick={() => edit(p)}>Editar</button>
              <button className="btn-danger" onClick={() => remove(p.id)}>Eliminar</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-slate-500">Aún no hay proyectos. Crea el primero arriba.</p>
        )}
      </div>
    </div>
  );
}

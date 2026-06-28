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
  instructionDoc: string;
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
  instructionDoc: "",
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
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docMsg, setDocMsg] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [dataMsg, setDataMsg] = useState("");
  const [dataBusy, setDataBusy] = useState(false);

  async function importData() {
    if (!editingId) return;
    setDataBusy(true);
    setDataMsg("");
    try {
      const r = await api<{ applied: string[]; priceLabel: string | null }>(
        `/api/projects/${editingId}/import-data`,
        { method: "POST", body: JSON.stringify({ url: form.websiteUrl }) },
      );
      // Refresca el formulario con los datos reales traídos del portal.
      const p = await api<Project>(`/api/projects/${editingId}`);
      setForm((f) => ({
        ...f,
        priceFrom: p.priceFrom,
        currency: p.currency,
        description: p.description,
        location: p.location,
      }));
      setDataMsg(
        r.applied.length
          ? `✓ Actualizado del portal: ${r.applied.join(", ")}. Revisa y guarda.`
          : "No se encontraron datos nuevos.",
      );
    } catch (e) {
      setDataMsg((e as Error).message);
    } finally {
      setDataBusy(false);
    }
  }

  async function importImages() {
    if (!editingId) return;
    setImportBusy(true);
    setImportMsg("");
    try {
      const r = await api<{ found: number; created: number }>(
        `/api/projects/${editingId}/import-images`,
        { method: "POST", body: JSON.stringify({ url: form.websiteUrl }) },
      );
      setImportMsg(
        r.created > 0
          ? `✓ Importadas ${r.created} fotos (de ${r.found} encontradas). Revísalas en Stock de imágenes.`
          : `No se agregaron fotos nuevas (encontradas: ${r.found}).`,
      );
    } catch (e) {
      setImportMsg((e as Error).message);
    } finally {
      setImportBusy(false);
    }
  }

  async function uploadProjectDoc() {
    if (!docFile || !editingId) return;
    setDocBusy(true);
    setDocMsg("");
    try {
      const fd = new FormData();
      fd.append("file", docFile);
      fd.append("target", "project");
      fd.append("projectId", editingId);
      await api("/api/instructions/upload", { method: "POST", body: fd });
      const p = await api<Project>(`/api/projects/${editingId}`);
      setForm((f) => ({ ...f, instructionDoc: p.instructionDoc ?? "" }));
      setDocFile(null);
      setDocMsg("Ficha cargada ✓");
    } catch (e) {
      setDocMsg((e as Error).message);
    } finally {
      setDocBusy(false);
    }
  }

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
      instructionDoc: p.instructionDoc ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setDocFile(null);
    setDocMsg("");
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
            <label className="label">URL del proyecto (en el portal)</label>
            <input
              className="input"
              placeholder="https://destinopropiedades.com/condado-del-golfo"
              value={form.websiteUrl}
              onChange={set("websiteUrl")}
            />
            {editingId && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={dataBusy}
                    onClick={importData}
                  >
                    {dataBusy ? "Leyendo portal…" : "📄 Importar datos del portal"}
                  </button>
                  {dataMsg && <span className="text-xs text-slate-500">{dataMsg}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={importBusy}
                    onClick={importImages}
                  >
                    {importBusy ? "Importando…" : "🖼️ Importar fotos del portal"}
                  </button>
                  {importMsg && <span className="text-xs text-slate-500">{importMsg}</span>}
                </div>
                <p className="text-[11px] text-slate-400">
                  Trae precio, descripción y ubicación reales del portal (sin reescribir a mano).
                  El precio se toma como “desde” (el más accesible).
                </p>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label">Información de contacto</label>
            <input className="input" value={form.contactInfo} onChange={set("contactInfo")} />
          </div>
          <div className="md:col-span-2">
            <label className="label">
              Ficha / instrucción del proyecto (target, narrativa, persona, WhatsApp)
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Aquí personalizas fácil el enfoque de ESTE proyecto (ej. los de playa
              apuntan distinto que los residenciales). Puedes editarla aquí o, al
              editar un proyecto guardado, <strong>subir un archivo</strong> (.txt, .md, .pdf).
            </p>
            <textarea
              className="input font-mono text-xs"
              rows={6}
              placeholder="Tipo: beachfront. Persona: Carlos. Ángulo: inversión + turismo. WhatsApp: +503 0000 0000…"
              value={form.instructionDoc}
              onChange={set("instructionDoc")}
            />
            {editingId && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.pdf,text/plain,application/pdf"
                  className="input w-auto"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!docFile || docBusy}
                  onClick={uploadProjectDoc}
                >
                  {docBusy ? "Procesando…" : "Subir ficha"}
                </button>
                {docMsg && <span className="text-sm text-slate-500">{docMsg}</span>}
              </div>
            )}
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

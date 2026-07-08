"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import CampaignCard from "@/components/CampaignCard";

interface Project {
  id: string;
  name: string;
}
interface Campaign {
  id: string;
  projectId: string | null;
  name: string;
  objective: string;
  instructions: string;
  networks: string;
  status: string;
  project?: { name: string } | null;
}

const NETWORKS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    projectId: "",
    name: "",
    objective: "awareness",
    instructions: "",
    networks: ["facebook", "instagram"] as string[],
    status: "active",
  });
  const [msg, setMsg] = useState("");
  const [logFilter, setLogFilter] = useState("");

  const visibleCampaigns = campaigns.filter((c) => {
    if (!logFilter) return true;
    if (logFilter === "__global") return c.projectId === null;
    return c.projectId === logFilter;
  });

  async function load() {
    const [c, p] = await Promise.all([
      api<Campaign[]>("/api/campaigns"),
      api<Project[]>("/api/projects"),
    ]);
    setCampaigns(c);
    setProjects(p);
  }
  useEffect(() => {
    load();
  }, []);

  function toggleNet(id: string) {
    setForm((f) => ({
      ...f,
      networks: f.networks.includes(id)
        ? f.networks.filter((n) => n !== id)
        : [...f.networks, id],
    }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          projectId: form.projectId || null,
        }),
      });
      setForm({ ...form, name: "", instructions: "" });
      await load();
      setMsg("Campaña creada ✓");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar campaña?")) return;
    await api(`/api/campaigns/${id}`, { method: "DELETE" });
    await load();
  }


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Campañas de mercadeo</h1>
      <p className="text-slate-500">
        Una campaña puede ser global (todo el portal) o específica de un proyecto, con
        instrucciones estratégicas que guían la generación.
      </p>

      <form onSubmit={create} className="card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Nombre de la campaña *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Proyecto</label>
            <select
              className="input"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              <option value="">— Global (todo el portal) —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Objetivo</label>
            <select
              className="input"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            >
              <option value="awareness">Reconocimiento</option>
              <option value="leads">Generación de leads</option>
              <option value="sales">Ventas</option>
              <option value="launch">Lanzamiento</option>
              <option value="event">Evento</option>
            </select>
          </div>
          <div>
            <label className="label">Redes</label>
            <div className="flex flex-wrap gap-3 pt-2">
              {NETWORKS.map((n) => (
                <label key={n.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.networks.includes(n.id)}
                    onChange={() => toggleNet(n.id)}
                  />
                  {n.label}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Instrucción estratégica específica</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Ej: enfocar en la cuota inicial financiada y la entrega en 2026; tono de urgencia por descuento de preventa."
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary">Crear campaña</button>
          {msg && <span className="text-sm text-slate-500">{msg}</span>}
        </div>
      </form>

      {/* Log de campañas por proyecto */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600">Ver campañas de:</label>
        <select
          className="input w-auto"
          value={logFilter}
          onChange={(e) => setLogFilter(e.target.value)}
        >
          <option value="">Todos los proyectos</option>
          <option value="__global">Solo globales</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400">{visibleCampaigns.length} campaña(s)</span>
      </div>

      <div className="space-y-3">
        {visibleCampaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} onChange={load} onRemove={remove} />
        ))}
        {visibleCampaigns.length === 0 && (
          <p className="text-sm text-slate-500">No hay campañas en este filtro.</p>
        )}
      </div>
    </div>
  );
}

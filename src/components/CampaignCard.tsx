"use client";

import { useState } from "react";
import { api } from "@/lib/client";

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
interface Recommendation {
  field: "name" | "objective" | "instructions" | "networks" | "status";
  label: string;
  current: string;
  suggested: string;
  reason: string;
}
interface Analysis {
  summary: string;
  comparison: string;
  recommendations: Recommendation[];
}

const OBJETIVOS = [
  { v: "awareness", l: "Reconocimiento" },
  { v: "leads", l: "Generación de leads" },
  { v: "sales", l: "Ventas" },
  { v: "launch", l: "Lanzamiento" },
  { v: "event", l: "Evento" },
];
const NETS = ["facebook", "instagram", "x", "tiktok"];
const nets = (j: string) => { try { return JSON.parse(j) as string[]; } catch { return []; } };

export default function CampaignCard({
  campaign,
  onChange,
  onRemove,
}: {
  campaign: Campaign;
  onChange: () => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState("");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [msg, setMsg] = useState("");

  // --- edición ---
  const [f, setF] = useState({
    name: campaign.name,
    objective: campaign.objective,
    instructions: campaign.instructions,
    status: campaign.status,
    networks: nets(campaign.networks),
  });
  function toggleNet(n: string) {
    setF((s) => ({ ...s, networks: s.networks.includes(n) ? s.networks.filter((x) => x !== n) : [...s.networks, n] }));
  }
  async function saveEdit() {
    setBusy("save");
    try {
      await api(`/api/campaigns/${campaign.id}`, { method: "PATCH", body: JSON.stringify(f) });
      setEditing(false);
      onChange();
    } finally {
      setBusy("");
    }
  }

  // --- análisis ---
  async function analyze() {
    setBusy("analyze");
    setMsg("");
    setAnalysis(null);
    try {
      const r = await api<{ analysis: Analysis }>(`/api/campaigns/${campaign.id}/analyze`, {
        method: "POST",
        timeoutMs: 120000,
      });
      setAnalysis(r.analysis);
      setPicked(new Set(r.analysis.recommendations.map((_, i) => i))); // todas por defecto
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function applyCombo() {
    if (!analysis) return;
    setBusy("apply");
    try {
      const data: Record<string, unknown> = {};
      analysis.recommendations.forEach((rec, i) => {
        if (!picked.has(i)) return;
        if (rec.field === "networks") {
          data.networks = rec.suggested.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
        } else {
          data[rec.field] = rec.suggested;
        }
      });
      if (Object.keys(data).length) {
        await api(`/api/campaigns/${campaign.id}`, { method: "PATCH", body: JSON.stringify(data) });
      }
      setAnalysis(null);
      setMsg("Cambios aplicados ✓");
      onChange();
    } finally {
      setBusy("");
    }
  }

  if (editing) {
    return (
      <div className="card space-y-3">
        <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="input" value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })}>
            {OBJETIVOS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
            <option value="finished">Finalizada</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          {NETS.map((n) => (
            <label key={n} className="flex items-center gap-1 text-sm capitalize">
              <input type="checkbox" checked={f.networks.includes(n)} onChange={() => toggleNet(n)} /> {n}
            </label>
          ))}
        </div>
        <textarea className="input" rows={3} value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} />
        <div className="flex gap-2">
          <button className="btn-primary" onClick={saveEdit} disabled={!!busy}>{busy === "save" ? "Guardando…" : "Guardar"}</button>
          <button className="btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
            <span className="badge bg-brand/10 text-brand">{campaign.objective}</span>
            <span className="badge bg-slate-100 text-slate-600">{campaign.status}</span>
          </div>
          <p className="text-sm text-slate-500">
            {campaign.project?.name ?? "Global"} · {nets(campaign.networks).join(", ") || "sin redes"}
          </p>
          {campaign.instructions && <p className="mt-1 text-sm text-slate-600">{campaign.instructions}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button className="text-sm font-medium text-brand hover:underline" onClick={() => setEditing(true)}>✏️ Editar</button>
          <button className="text-sm text-red-600 hover:underline" onClick={() => onRemove(campaign.id)}>Eliminar</button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-2">
        <button className="btn-secondary" onClick={analyze} disabled={!!busy}>
          {busy === "analyze" ? "Analizando… (~30s)" : "🧠 Analizar con Claude"}
        </button>
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
      </div>

      {analysis && (
        <div className="space-y-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Diagnóstico</div>
            <p className="text-sm text-slate-700">{analysis.summary}</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Comparación (previas · métricas · tendencias)</div>
            <p className="text-sm text-slate-700">{analysis.comparison}</p>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-slate-400">
              Recomendaciones ({picked.size}/{analysis.recommendations.length} seleccionadas)
            </div>
            {analysis.recommendations.length === 0 ? (
              <p className="text-sm text-slate-500">Sin cambios sugeridos: la campaña luce bien. ✓</p>
            ) : (
              <ul className="space-y-2">
                {analysis.recommendations.map((r, i) => (
                  <li key={i} className="rounded bg-white p-2 ring-1 ring-slate-200">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={picked.has(i)}
                        onChange={() =>
                          setPicked((s) => {
                            const n = new Set(s);
                            n.has(i) ? n.delete(i) : n.add(i);
                            return n;
                          })
                        }
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="font-medium text-slate-800">{r.label}</div>
                        <div className="text-slate-500"><span className="text-slate-400">Actual:</span> {r.current || "(vacío)"}</div>
                        <div className="text-emerald-700"><span className="text-slate-400">Sugerido:</span> {r.suggested}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{r.reason}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {analysis.recommendations.length > 0 && (
            <div className="flex gap-2">
              <button className="btn-primary" onClick={applyCombo} disabled={busy === "apply" || picked.size === 0}>
                {busy === "apply" ? "Aplicando…" : `✅ Aplicar ${picked.size} cambio(s) en combo`}
              </button>
              <button className="btn-secondary" onClick={() => setAnalysis(null)}>Descartar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

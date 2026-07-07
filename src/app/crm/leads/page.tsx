"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import {
  STAGES,
  SOURCES,
  TEMPERATURES,
  STAGE_LABEL,
  STAGE_COLOR,
  SOURCE_LABEL,
} from "@/lib/crm";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  projectName: string;
  stage: string;
  temperature: string;
  value: number;
  nextActionAt: string | null;
  assignedTo?: { username: string; displayName: string } | null;
}

const money = (n: number) => (n ? "$" + Math.round(n).toLocaleString("en-US") : "—");

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="card">Cargando…</div>}>
      <LeadsInner />
    </Suspense>
  );
}

function LeadsInner() {
  const sp = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(sp.get("stage") || "");
  const [source, setSource] = useState("");
  const [temp, setTemp] = useState("");
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (source) params.set("source", source);
    if (temp) params.set("temp", temp);
    if (q.trim()) params.set("q", q.trim());
    try {
      const d = await api<{ leads: Lead[] }>(`/api/crm/leads?${params}`);
      setLeads(d.leads);
    } finally {
      setLoading(false);
    }
  }, [stage, source, temp, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + Nuevo lead
        </button>
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap items-end gap-3">
        <div className="min-w-[140px] flex-1">
          <label className="label">Buscar</label>
          <input
            className="input"
            placeholder="Nombre, teléfono, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select label="Etapa" value={stage} onChange={setStage} options={STAGES.map((s) => ({ v: s.key, l: s.label }))} />
        <Select label="Fuente" value={source} onChange={setSource} options={SOURCES.map((s) => ({ v: s.key, l: s.label }))} />
        <Select label="Temperatura" value={temp} onChange={setTemp} options={TEMPERATURES.map((s) => ({ v: s.key, l: s.label }))} />
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className="p-3">Cliente</th>
              <th className="p-3">Proyecto</th>
              <th className="p-3">Etapa</th>
              <th className="p-3">Temp.</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3">Vendedor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-slate-400" colSpan={6}>Cargando…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td className="p-4 text-slate-400" colSpan={6}>Sin leads con estos filtros.</td></tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3">
                    <Link href={`/crm/leads/${l.id}`} className="font-medium text-brand hover:underline">
                      {l.name}
                    </Link>
                    <div className="text-xs text-slate-400">{l.phone}</div>
                  </td>
                  <td className="p-3 text-slate-600">{l.projectName || "—"}</td>
                  <td className="p-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ background: STAGE_COLOR[l.stage] }}
                    >
                      {STAGE_LABEL[l.stage] ?? l.stage}
                    </span>
                  </td>
                  <td className="p-3">{temperatureIcon(l.temperature)}</td>
                  <td className="p-3 text-right">{money(l.value)}</td>
                  <td className="p-3 text-xs text-slate-500">
                    {l.assignedTo?.displayName || l.assignedTo?.username || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onCreated={load} />}
    </div>
  );
}

function temperatureIcon(t: string) {
  return t === "caliente" ? "🔥" : t === "frio" ? "❄️" : "🌤️";
}

function Select({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todas</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  );
}

function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({
    name: "", phone: "", email: "", source: "whatsapp",
    projectSlug: "", value: "", temperature: "tibio", notes: "",
  });
  const [projects, setProjects] = useState<{ slug: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ projects: { slug: string; name: string }[] }>("/api/crm/meta")
      .then((d) => setProjects(d.projects))
      .catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const proj = projects.find((p) => p.slug === f.projectSlug);
      await api("/api/crm/leads", {
        method: "POST",
        body: JSON.stringify({ ...f, value: Number(f.value) || 0, projectName: proj?.name || "" }),
      });
      onCreated();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
        className="card my-8 w-full max-w-lg space-y-3"
      >
        <h2 className="text-lg font-semibold">Nuevo lead</h2>
        <div>
          <label className="label">Nombre *</label>
          <input className="input" value={f.name} onChange={set("name")} autoFocus />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">WhatsApp / teléfono</label>
            <input className="input" value={f.phone} onChange={set("phone")} placeholder="+503 7000 0000" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={f.email} onChange={set("email")} />
          </div>
          <div>
            <label className="label">Fuente</label>
            <select className="input" value={f.source} onChange={set("source")}>
              {SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Proyecto de interés</label>
            <select className="input" value={f.projectSlug} onChange={set("projectSlug")}>
              <option value="">—</option>
              {projects.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Valor estimado (USD)</label>
            <input className="input" type="number" value={f.value} onChange={set("value")} />
          </div>
          <div>
            <label className="label">Temperatura</label>
            <select className="input" value={f.temperature} onChange={set("temperature")}>
              {TEMPERATURES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Notas / conversación de WhatsApp</label>
          <textarea className="input" rows={3} value={f.notes} onChange={set("notes")} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Guardando…" : "Crear lead"}</button>
        </div>
      </form>
    </div>
  );
}

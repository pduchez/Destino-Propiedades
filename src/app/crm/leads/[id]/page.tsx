"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/client";
import {
  STAGES,
  STAGE_LABEL,
  STAGE_COLOR,
  SOURCE_LABEL,
  ACTIVITY_TYPES,
  ACTIVITY_LABEL,
  TEMPERATURES,
} from "@/lib/crm";

interface Activity {
  id: string;
  type: string;
  body: string;
  dueAt: string | null;
  done: boolean;
  createdAt: string;
  user?: { username: string; displayName: string } | null;
}
interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  projectName: string;
  projectSlug: string;
  budget: string;
  value: number;
  stage: string;
  temperature: string;
  lostReason: string;
  notes: string;
  nextActionAt: string | null;
  assignedTo?: { id: string; username: string; displayName: string } | null;
  activities: Activity[];
}

const money = (n: number) => (n ? "$" + Math.round(n).toLocaleString("en-US") : "—");
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" }) : "";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api<{ lead: Lead }>(`/api/crm/leads/${id}`);
      setLead(d.lead);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  async function moveStage(stage: string) {
    await api(`/api/crm/leads/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) });
    load();
  }

  if (err) return <div className="card border-red-200 bg-red-50 text-red-700">{err}</div>;
  if (!lead) return <div className="card">Cargando…</div>;

  return (
    <div className="space-y-4">
      <Link href="/crm/leads" className="text-sm text-slate-400 hover:text-brand">
        ← Volver a leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
          <p className="text-sm text-slate-500">
            {SOURCE_LABEL[lead.source] ?? lead.source} · {lead.projectName || "Sin proyecto"}
          </p>
        </div>
        {lead.phone && (
          <a
            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            className="btn-primary"
          >
            💬 WhatsApp
          </a>
        )}
      </div>

      {/* Pipeline */}
      <div className="card overflow-x-auto">
        <div className="mb-3 text-sm font-semibold text-slate-600">Etapa</div>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => moveStage(s.key)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
              style={
                lead.stage === s.key
                  ? { background: s.color, color: "white" }
                  : { background: "#f1f5f9", color: "#475569" }
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Datos + edición */}
        <div className="space-y-4 lg:col-span-1">
          <LeadInfo lead={lead} onSaved={load} />
        </div>

        {/* Timeline + agregar actividad */}
        <div className="space-y-4 lg:col-span-2">
          <AddActivity leadId={lead.id} onAdded={load} />
          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">Línea de tiempo</h2>
            {lead.activities.length === 0 ? (
              <p className="text-sm text-slate-400">Sin actividades todavía.</p>
            ) : (
              <ul className="space-y-3">
                {lead.activities.map((a) => (
                  <li key={a.id} className="flex gap-3 border-b pb-3 last:border-0">
                    <div className="text-lg">{(ACTIVITY_LABEL[a.type] ?? "📝").split(" ")[0]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                          {ACTIVITY_LABEL[a.type]?.replace(/^\S+\s/, "") ?? a.type}
                          {a.type === "tarea" && a.dueAt && (
                            <span className={a.done ? "text-emerald-600" : "text-amber-600"}>
                              {" "}· {a.done ? "hecha" : "vence " + fmt(a.dueAt)}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-400">{fmt(a.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
                      <div className="text-xs text-slate-400">
                        {a.user?.displayName || a.user?.username || ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadInfo({ lead, onSaved }: { lead: Lead; onSaved: () => void }) {
  const [temp, setTemp] = useState(lead.temperature);
  const [value, setValue] = useState(String(lead.value || ""));
  const [notes, setNotes] = useState(lead.notes);
  const [msg, setMsg] = useState("");

  async function save() {
    setMsg("");
    await api(`/api/crm/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ temperature: temp, value: Number(value) || 0, notes }),
    });
    setMsg("Guardado ✓");
    onSaved();
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold">Ficha</h2>
      <Row label="Teléfono" value={lead.phone || "—"} />
      <Row label="Email" value={lead.email || "—"} />
      <Row label="Fuente" value={SOURCE_LABEL[lead.source] ?? lead.source} />
      <Row label="Proyecto" value={lead.projectName || "—"} />
      <Row label="Vendedor" value={lead.assignedTo?.displayName || lead.assignedTo?.username || "—"} />
      <Row
        label="Etapa"
        value={
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ background: STAGE_COLOR[lead.stage] }}
          >
            {STAGE_LABEL[lead.stage]}
          </span>
        }
      />
      <div>
        <label className="label">Temperatura</label>
        <select className="input" value={temp} onChange={(e) => setTemp(e.target.value)}>
          {TEMPERATURES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Valor estimado (USD)</label>
        <input className="input" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <div>
        <label className="label">Notas</label>
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save}>Guardar</button>
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}

function AddActivity({ leadId, onAdded }: { leadId: string; onAdded: () => void }) {
  const [type, setType] = useState("whatsapp");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api(`/api/crm/leads/${leadId}/activities`, {
        method: "POST",
        body: JSON.stringify({ type, body, dueAt: type === "tarea" && dueAt ? dueAt : null }),
      });
      setBody("");
      setDueAt("");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={add} className="card space-y-3">
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              type === t.key ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        className="input"
        rows={3}
        placeholder={
          type === "whatsapp"
            ? "Pega o resume la conversación de WhatsApp…"
            : type === "director"
            ? "Instrucción o seguimiento del director…"
            : "Escribe la nota…"
        }
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {type === "tarea" && (
        <div>
          <label className="label">Vence</label>
          <input
            className="input"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>
      )}
      <button className="btn-primary" disabled={busy}>
        {busy ? "Guardando…" : "Registrar"}
      </button>
    </form>
  );
}

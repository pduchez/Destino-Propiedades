"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { STAGES, STAGE_COLOR } from "@/lib/crm";

interface Lead {
  id: string;
  name: string;
  stage: string;
  value: number;
  temperature: string;
  projectName: string;
  assignedTo?: { username: string; displayName: string } | null;
}

const money = (n: number) => (n ? "$" + Math.round(n).toLocaleString("en-US") : "");
const tempIcon = (t: string) => (t === "caliente" ? "🔥" : t === "frio" ? "❄️" : "🌤️");

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<{ leads: Lead[] }>("/api/crm/leads");
      setLeads(d.leads);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function move(lead: Lead, stage: string) {
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, stage } : l)));
    await api(`/api/crm/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ stage }) });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Embudo</h1>
        <Link href="/crm/leads" className="btn-secondary">Ver como lista</Link>
      </div>
      {loading ? (
        <div className="card">Cargando…</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((s) => {
            const items = leads.filter((l) => l.stage === s.key);
            const total = items.reduce((a, l) => a + l.value, 0);
            return (
              <div key={s.key} className="w-64 shrink-0">
                <div
                  className="mb-2 flex items-center justify-between rounded-t-lg px-3 py-2 text-sm font-semibold text-white"
                  style={{ background: s.color }}
                >
                  <span>{s.label}</span>
                  <span className="rounded-full bg-white/25 px-2 text-xs">{items.length}</span>
                </div>
                {total > 0 && (
                  <div className="mb-2 text-center text-xs text-slate-400">{money(total)}</div>
                )}
                <div className="space-y-2">
                  {items.map((l) => (
                    <div key={l.id} className="card p-3">
                      <Link href={`/crm/leads/${l.id}`} className="font-medium text-slate-800 hover:text-brand">
                        {tempIcon(l.temperature)} {l.name}
                      </Link>
                      <div className="text-xs text-slate-400">{l.projectName || "—"}</div>
                      {l.value > 0 && (
                        <div className="text-xs font-semibold text-slate-500">{money(l.value)}</div>
                      )}
                      <div className="mt-2 text-xs text-slate-400">
                        {l.assignedTo?.displayName || l.assignedTo?.username || ""}
                      </div>
                      <MoveMenu current={l.stage} onMove={(st) => move(l, st)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MoveMenu({ current, onMove }: { current: string; onMove: (s: string) => void }) {
  return (
    <select
      className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
      value=""
      onChange={(e) => e.target.value && onMove(e.target.value)}
    >
      <option value="">Mover a…</option>
      {STAGES.filter((s) => s.key !== current).map((s) => (
        <option key={s.key} value={s.key}>{s.label}</option>
      ))}
    </select>
  );
}

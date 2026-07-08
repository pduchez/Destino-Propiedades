"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

interface Appt {
  id: string;
  scheduledAt: string;
  location: string;
  notes: string;
  status: string;
  sellerId: string | null;
  createdBy: string;
  lead: { id: string; name: string; phone: string; projectName: string };
}

const fmt = (d: string) =>
  new Date(d).toLocaleString("es-SV", { dateStyle: "full", timeStyle: "short" });
const STATUS: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Agendada", cls: "bg-indigo-100 text-indigo-700" },
  done: { label: "Realizada", cls: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "Cancelada", cls: "bg-slate-100 text-slate-500" },
  no_show: { label: "No asistió", cls: "bg-rose-100 text-rose-700" },
};

export default function AgendaPage() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [sellerName, setSellerName] = useState<Record<string, string>>({});
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<{ appointments: Appt[]; sellerName: Record<string, string>; role: string }>(
        "/api/crm/appointments",
      );
      setAppts(d.appointments);
      setSellerName(d.sellerName);
      setRole(d.role);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    await api("/api/crm/appointments", { method: "PATCH", body: JSON.stringify({ id, status }) });
    load();
  }

  const now = Date.now();
  const upcoming = appts.filter((a) => new Date(a.scheduledAt).getTime() >= now && a.status === "scheduled");
  const past = appts.filter((a) => !(new Date(a.scheduledAt).getTime() >= now && a.status === "scheduled"));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agenda de citas</h1>
        <p className="text-sm text-slate-500">
          Las citas agendadas por el bot de WhatsApp o manualmente aparecen aquí.
        </p>
      </div>

      {loading ? (
        <div className="card">Cargando…</div>
      ) : appts.length === 0 ? (
        <div className="card text-slate-400">Aún no hay citas agendadas.</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Section title={`Próximas (${upcoming.length})`}>
              {upcoming.map((a) => (
                <ApptCard key={a.id} a={a} sellerName={sellerName} role={role} onStatus={setStatus} />
              ))}
            </Section>
          )}
          {past.length > 0 && (
            <Section title={`Historial (${past.length})`}>
              {past.map((a) => (
                <ApptCard key={a.id} a={a} sellerName={sellerName} role={role} onStatus={setStatus} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-600">{title}</h2>
      {children}
    </div>
  );
}

function ApptCard({
  a, sellerName, role, onStatus,
}: {
  a: Appt; sellerName: Record<string, string>; role: string; onStatus: (id: string, s: string) => void;
}) {
  const st = STATUS[a.status] ?? STATUS.scheduled;
  return (
    <div className="card space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-800">{fmt(a.scheduledAt)}</span>
        <span className={`badge ${st.cls}`}>{st.label}</span>
      </div>
      <div className="text-sm text-slate-600">
        <Link href={`/crm/leads/${a.lead.id}`} className="font-medium text-brand hover:underline">
          {a.lead.name}
        </Link>{" "}
        · {a.lead.projectName || "s/proyecto"} · {a.lead.phone}
      </div>
      {a.location && <div className="text-xs text-slate-500">📍 {a.location}</div>}
      {a.notes && <div className="text-xs text-slate-500">{a.notes}</div>}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
        <span>
          {a.createdBy === "bot" ? "🤖 agendada por el bot" : a.createdBy === "director" ? "🎯 director" : "💼 vendedor"}
          {role === "admin" && a.sellerId ? ` · ${sellerName[a.sellerId] ?? ""}` : ""}
        </span>
        {a.status === "scheduled" && (
          <span className="flex gap-2">
            <button onClick={() => onStatus(a.id, "done")} className="text-emerald-600 hover:underline">Realizada</button>
            <button onClick={() => onStatus(a.id, "no_show")} className="text-rose-600 hover:underline">No asistió</button>
            <button onClick={() => onStatus(a.id, "canceled")} className="text-slate-500 hover:underline">Cancelar</button>
          </span>
        )}
      </div>
    </div>
  );
}

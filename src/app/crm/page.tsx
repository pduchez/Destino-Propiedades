"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

interface Stats {
  role: "admin" | "sales";
  kpis: {
    openLeads: number;
    pipelineValue: number;
    wonThisMonthCount: number;
    wonThisMonthValue: number;
    conversion: number;
    overdueTasks: number;
    todayTasks: number;
    lostTotal: number;
  };
  byStage: { key: string; label: string; color: string; count: number; value: number }[];
  bySource: { source: string; count: number }[];
  byProject: { project: string; count: number }[];
  byVendor: { userId: string; name: string; open: number; won: number; value: number }[];
}

const money = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US");

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [seeding, setSeeding] = useState(false);

  async function load() {
    try {
      setS(await api<Stats>("/api/crm/stats"));
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // refresco "tiempo real"
    return () => clearInterval(t);
  }, []);

  async function seed() {
    setSeeding(true);
    try {
      await api("/api/crm/seed", { method: "POST", body: JSON.stringify({}) });
      await load();
    } finally {
      setSeeding(false);
    }
  }

  if (err) return <div className="card border-red-200 bg-red-50 text-red-700">{err}</div>;
  if (!s) return <div className="card">Cargando tablero…</div>;

  const totalLeads = s.byStage.reduce((a, x) => a + x.count, 0);
  const maxStage = Math.max(1, ...s.byStage.map((x) => x.count));
  const isAdmin = s.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin ? "Tablero de dirección" : "Mi tablero"}
          </h1>
          <p className="text-sm text-slate-500">
            Actualización automática cada 30 s · {totalLeads} leads
          </p>
        </div>
        <Link href="/crm/leads" className="btn-primary">
          + Nuevo lead
        </Link>
      </div>

      {totalLeads === 0 && isAdmin && (
        <div className="card flex items-center justify-between border-amber-200 bg-amber-50">
          <span className="text-sm text-amber-800">
            Aún no hay leads. Carga datos de demostración para ver el tablero y los reportes.
          </span>
          <button onClick={seed} disabled={seeding} className="btn-secondary">
            {seeding ? "Cargando…" : "Cargar demo"}
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Leads activos" value={s.kpis.openLeads} icon="🧑‍🤝‍🧑" />
        <Kpi label="Valor del embudo" value={money(s.kpis.pipelineValue)} icon="💰" />
        <Kpi label="Ganados (mes)" value={`${s.kpis.wonThisMonthCount}`} sub={money(s.kpis.wonThisMonthValue)} icon="🏆" />
        <Kpi label="Conversión" value={`${s.kpis.conversion}%`} icon="📈" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Tareas hoy" value={s.kpis.todayTasks} icon="⏰" href="/crm/tareas" />
        <Kpi
          label="Follow-ups vencidos"
          value={s.kpis.overdueTasks}
          icon="🚨"
          danger={s.kpis.overdueTasks > 0}
          href="/crm/tareas"
        />
        <Kpi label="Perdidos" value={s.kpis.lostTotal} icon="❌" />
        <Kpi label="Total leads" value={totalLeads} icon="📋" href="/crm/leads" />
      </div>

      {/* Embudo */}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Embudo de ventas</h2>
        <div className="space-y-2">
          {s.byStage.map((st) => (
            <Link
              href={`/crm/leads?stage=${st.key}`}
              key={st.key}
              className="flex items-center gap-3 hover:opacity-80"
            >
              <span className="w-24 shrink-0 text-sm text-slate-600">{st.label}</span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-slate-100">
                <div
                  className="flex h-full items-center justify-end rounded px-2 text-xs font-semibold text-white"
                  style={{
                    width: `${Math.max(6, (st.count / maxStage) * 100)}%`,
                    background: st.color,
                  }}
                >
                  {st.count}
                </div>
              </div>
              <span className="w-20 shrink-0 text-right text-xs text-slate-400">
                {st.value > 0 ? money(st.value) : ""}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Por fuente */}
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Leads por fuente</h2>
          <BarList items={s.bySource.map((x) => ({ label: x.source, count: x.count }))} />
        </div>
        {/* Por proyecto */}
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Interés por proyecto</h2>
          {s.byProject.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos aún.</p>
          ) : (
            <BarList items={s.byProject.map((x) => ({ label: x.project, count: x.count }))} />
          )}
        </div>
      </div>

      {/* Ranking de vendedores (director) */}
      {isAdmin && s.byVendor.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-lg font-semibold">Ranking de vendedores</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Vendedor</th>
                <th className="py-2 text-right">Activos</th>
                <th className="py-2 text-right">Ganados</th>
                <th className="py-2 text-right">Valor cerrado</th>
              </tr>
            </thead>
            <tbody>
              {s.byVendor.map((v, i) => (
                <tr key={v.userId} className="border-b last:border-0">
                  <td className="py-2 font-medium">
                    {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}
                    {v.name}
                  </td>
                  <td className="py-2 text-right">{v.open}</td>
                  <td className="py-2 text-right font-semibold text-emerald-600">{v.won}</td>
                  <td className="py-2 text-right">{money(v.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  danger,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  danger?: boolean;
  href?: string;
}) {
  const inner = (
    <div className={`card ${danger ? "border-red-200 bg-red-50" : ""}`}>
      <div className="text-xl">{icon}</div>
      <div className={`mt-1 text-2xl font-bold ${danger ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function BarList({ items }: { items: { label: string; count: number }[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-400">Sin datos.</p>;
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm capitalize text-slate-600">
            {it.label}
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
            <div
              className="h-full rounded bg-brand"
              style={{ width: `${Math.max(6, (it.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm text-slate-500">{it.count}</span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { OPEN_STAGES } from "@/lib/crm";

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

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function ReportesPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<Stats>("/api/crm/stats").then(setS).catch((e) => setErr((e as Error).message));
  }, []);

  if (err) return <div className="card border-red-200 bg-red-50 text-red-700">{err}</div>;
  if (!s) return <div className="card">Generando reporte…</div>;

  const totalLeads = s.byStage.reduce((a, x) => a + x.count, 0);
  const totalSource = s.bySource.reduce((a, x) => a + x.count, 0) || 1;
  const won = s.byStage.find((x) => x.key === "ganado");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleString("es-SV", { dateStyle: "full", timeStyle: "short" })}
        </p>
      </div>

      {/* Resumen ejecutivo (legible en móvil) */}
      <div className="card space-y-1 bg-brand/5">
        <h2 className="text-lg font-semibold">Resumen ejecutivo</h2>
        <p className="text-sm text-slate-700">
          Cartera de <strong>{totalLeads} leads</strong>, {s.kpis.openLeads} activos por un valor
          de <strong>{money(s.kpis.pipelineValue)}</strong> en el embudo. Este mes se han cerrado{" "}
          <strong>{s.kpis.wonThisMonthCount} ventas</strong> ({money(s.kpis.wonThisMonthValue)}).
          Tasa de conversión histórica: <strong>{s.kpis.conversion}%</strong>.
          {s.kpis.overdueTasks > 0 ? (
            <span className="text-red-600">
              {" "}⚠️ Hay {s.kpis.overdueTasks} follow-ups vencidos que requieren atención.
            </span>
          ) : (
            <span className="text-emerald-600"> ✓ Sin follow-ups vencidos.</span>
          )}
        </p>
      </div>

      {/* Conversión del embudo */}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Conversión por etapa</h2>
        <table className="w-full text-sm">
          <tbody>
            {s.byStage.map((st) => (
              <tr key={st.key} className="border-b last:border-0">
                <td className="py-2">{st.label}</td>
                <td className="py-2 text-right font-semibold">{st.count}</td>
                <td className="py-2 text-right text-slate-400">
                  {totalLeads ? Math.round((st.count / totalLeads) * 100) : 0}%
                </td>
                <td className="py-2 text-right text-slate-500">
                  {st.value > 0 ? money(st.value) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Por fuente */}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Origen de los leads</h2>
        <table className="w-full text-sm">
          <tbody>
            {s.bySource.map((x) => (
              <tr key={x.source} className="border-b last:border-0">
                <td className="py-2 capitalize">{x.source}</td>
                <td className="py-2 text-right font-semibold">{x.count}</td>
                <td className="py-2 text-right text-slate-400">
                  {Math.round((x.count / totalSource) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ranking vendedores */}
      {s.role === "admin" && s.byVendor.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-lg font-semibold">Desempeño por vendedor</h2>
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
                    {["🥇", "🥈", "🥉"][i] ?? "•"} {v.name}
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

      {/* Por proyecto */}
      {s.byProject.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Demanda por proyecto</h2>
          <table className="w-full text-sm">
            <tbody>
              {s.byProject.map((p) => (
                <tr key={p.project} className="border-b last:border-0">
                  <td className="py-2">{p.project}</td>
                  <td className="py-2 text-right font-semibold">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Reporte en tiempo real · DestinoPropiedades CRM
      </p>
    </div>
  );
}

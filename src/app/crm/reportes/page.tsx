"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

interface Section {
  label: string;
  value: string;
  tone?: "danger" | "ok" | "muted";
  items?: string[];
}
interface Report {
  period: string;
  title: string;
  subtitle: string;
  sections: Section[];
}

const TABS: { key: "daily" | "weekly" | "monthly"; label: string; hint: string }[] = [
  { key: "daily", label: "Hoy", hint: "Qué requiere acción hoy" },
  { key: "weekly", label: "Semana", hint: "Salud del embudo" },
  { key: "monthly", label: "Mes", hint: "Resultados y cierres" },
];

export default function ReportesPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [report, setReport] = useState<Report | null>(null);
  const [role, setRole] = useState<string>("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setReport(null);
    try {
      const d = await api<{ report: Report }>(`/api/crm/report?period=${period}`);
      setReport(d.report);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    api<{ role: string }>("/api/me").then((m) => setRole(m.role || "")).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        {role === "admin" && (
          <Link href="/crm/reportes/programar" className="btn-secondary">
            ⏱️ Programar envíos
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setPeriod(t.key)}
            className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm transition ${
              period === t.key
                ? "border-brand bg-brand/10 font-semibold text-brand"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div>{t.label}</div>
            <div className="text-xs font-normal text-slate-400">{t.hint}</div>
          </button>
        ))}
      </div>

      {err && <div className="card border-red-200 bg-red-50 text-red-700">{err}</div>}
      {!report && !err && <div className="card">Generando reporte…</div>}

      {report && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{report.subtitle}</p>
          {report.sections.map((s, i) => (
            <div
              key={i}
              className={`card ${
                s.tone === "danger" && s.value !== "0" ? "border-red-200 bg-red-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">{s.label}</span>
                <span
                  className={`text-lg font-bold ${
                    s.tone === "danger" && s.value !== "0" ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {s.value}
                </span>
              </div>
              {s.items && s.items.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-sm text-slate-600">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="text-slate-300">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

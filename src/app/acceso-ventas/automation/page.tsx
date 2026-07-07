"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

interface Config {
  autopilot: boolean;
  dailyNetworks: string[];
  postsPerDay: number;
  trendsLoop: boolean;
  autoUpdateInstruction: boolean;
  salesCheckinDay: number;
  videoProvider: string;
  lastDailyRun: string | null;
  lastTrendsRun: string | null;
}
interface Project {
  id: string;
  name: string;
  status: string;
  autoPost: boolean;
}
interface SalesCheckin {
  period: string;
  answered: boolean;
  salesNote: string;
}

const NETWORKS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
  { key: "tiktok", label: "TikTok" },
];

const VIDEO_PROVIDERS = [
  { key: "", label: "Ninguno (subo videos manualmente)" },
  { key: "runway", label: "Runway (API)" },
  { key: "replicate", label: "Replicate (API)" },
  { key: "pika", label: "Pika (API)" },
  { key: "otro", label: "Otro" },
];

const yesNo = (b: boolean) => (b ? "Activado" : "Desactivado");

export default function AutomationPage() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pending, setPending] = useState<SalesCheckin | null>(null);
  const [videoNeeds, setVideoNeeds] = useState<{ projectName: string; networks: string[] }[]>([]);
  const [salesNote, setSalesNote] = useState("");
  const [msg, setMsg] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  // Vacío = sincroniza con ESTE mismo sitio (portal y ARS son la misma app).
  // Solo se llena para leer un portal externo distinto.
  const [syncBase, setSyncBase] = useState("");
  const [busy, setBusy] = useState("");
  const [loadErr, setLoadErr] = useState("");

  async function loadAll() {
    try {
      const [c, ps, s, v] = await Promise.all([
        api<Config>("/api/automation"),
        api<Project[]>("/api/projects"),
        api<{ pending: SalesCheckin | null }>("/api/sales"),
        api<{ needs: { projectName: string; networks: string[] }[] }>("/api/video/needs"),
      ]);
      setCfg(c);
      setProjects(ps);
      setPending(s.pending);
      setVideoNeeds(v.needs);
      setLoadErr("");
    } catch (e) {
      setLoadErr((e as Error).message);
    }
  }
  useEffect(() => {
    loadAll();
  }, []);

  async function patch(partial: Partial<Config>) {
    setMsg("");
    const c = await api<Config>("/api/automation", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    setCfg(c);
    setMsg("Guardado ✓");
  }

  function toggleNetwork(key: string) {
    if (!cfg) return;
    const has = cfg.dailyNetworks.includes(key);
    const next = has ? cfg.dailyNetworks.filter((n) => n !== key) : [...cfg.dailyNetworks, key];
    patch({ dailyNetworks: next });
  }

  async function toggleProject(p: Project) {
    await api(`/api/projects/${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({ autoPost: !p.autoPost }),
    });
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, autoPost: !x.autoPost } : x)));
  }

  async function runNow() {
    setBusy("run");
    setMsg("");
    try {
      const r = await api<{ result: { ran: string[]; daily?: { drafts: number } } }>(
        "/api/cron/tick?force=1",
        { method: "POST" },
      );
      const d = r.result.daily?.drafts ?? 0;
      setMsg(`Ejecutado: ${r.result.ran.join(", ") || "nada pendiente"}. ${d} borradores creados.`);
      loadAll();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function syncPortal() {
    setBusy("sync");
    setSyncMsg("Leyendo el portal…");
    try {
      const r = await api<{ discovered: number; imported: number; totalPhotos: number }>(
        "/api/portal/sync",
        { method: "POST", body: JSON.stringify({ base: syncBase.trim() }) },
      );
      setSyncMsg(`✓ ${r.imported}/${r.discovered} proyectos importados · ${r.totalPhotos} fotos nuevas.`);
      loadAll();
    } catch (e) {
      setSyncMsg((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function answerSales() {
    if (!pending) return;
    setBusy("sales");
    try {
      await api("/api/sales", {
        method: "POST",
        body: JSON.stringify({ period: pending.period, salesNote }),
      });
      setPending(null);
      setSalesNote("");
      setMsg("Gracias. ARS usará este pulso de ventas para ajustar la estrategia.");
    } finally {
      setBusy("");
    }
  }

  if (loadErr)
    return (
      <div className="card border-red-200 bg-red-50">
        <p className="font-semibold text-red-700">No se pudo cargar el panel</p>
        <p className="mt-1 text-sm text-red-600">{loadErr}</p>
        <p className="mt-3 text-sm text-slate-600">
          Suele ser que este despliegue no tiene la <strong>base de datos</strong> configurada.
          En Vercel → el proyecto → <strong>Settings → Environment Variables</strong>, agregá{" "}
          <code>DATABASE_URL</code> (y <code>DASHBOARD_PASSWORD</code>, <code>ANTHROPIC_API_KEY</code>,{" "}
          <code>CRON_SECRET</code>), y volvé a desplegar.
        </p>
        <button className="btn-secondary mt-4" onClick={() => loadAll()}>Reintentar</button>
      </div>
    );
  if (!cfg) return <p className="text-sm text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Automatización de ARS</h1>
        <p className="text-slate-500">
          Controla la autonomía de ARS con menús simples. ARS genera, investiga
          tendencias y se autoajusta sin que tengas que pedirlo.
        </p>
      </div>

      {/* Chequeo mensual de ventas pendiente */}
      {pending && (
        <div className="card border-l-4 border-amber-400">
          <h2 className="font-semibold text-slate-900">📈 ¿Cómo van las ventas en {pending.period}?</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cuéntame el pulso de ventas del mes (unidades, consultas, lo que cerró o costó).
            ARS lo usa para medir efectividad y ajustar la estrategia.
          </p>
          <textarea
            className="input mt-2"
            rows={3}
            placeholder="Ej.: 3 lotes reservados en Condado del Golfo; muchas consultas por WhatsApp desde Instagram; poca tracción en X…"
            value={salesNote}
            onChange={(e) => setSalesNote(e.target.value)}
          />
          <button className="btn-primary mt-2" disabled={busy === "sales"} onClick={answerSales}>
            {busy === "sales" ? "Guardando…" : "Enviar a ARS"}
          </button>
        </div>
      )}

      {/* ARS necesita videos crudos */}
      {videoNeeds.length > 0 && (
        <div className="card border-l-4 border-indigo-400">
          <h2 className="font-semibold text-slate-900">🎥 ARS necesita videos crudos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Estos proyectos van a publicar en redes de video pero no tienen material
            crudo. Sube videos verticales (drone/tour) en{" "}
            <a href="/acceso-ventas/images" className="text-brand underline">Stock de imágenes</a>.
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {videoNeeds.map((n) => (
              <li key={n.projectName}>
                • <strong>{n.projectName}</strong> — {n.networks.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-800">Acciones</h2>
        <div>
          <label className="label">URL del portal a sincronizar (opcional)</label>
          <input
            className="input"
            value={syncBase}
            onChange={(e) => setSyncBase(e.target.value)}
            placeholder="Vacío = este mismo sitio"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Dejalo <strong>vacío</strong>: el portal y el ARS son la misma app, así que
            sincroniza con este mismo sitio automáticamente. Solo llená una URL para
            leer un portal externo distinto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={busy === "sync"} onClick={syncPortal}>
            {busy === "sync" ? "Sincronizando…" : "🔄 Sincronizar con el portal"}
          </button>
          <button className="btn-secondary" disabled={busy === "run"} onClick={runNow}>
            {busy === "run" ? "Ejecutando…" : "▶️ Ejecutar ARS ahora"}
          </button>
        </div>
        {syncMsg && <p className="text-sm text-slate-600">{syncMsg}</p>}
        <p className="text-xs text-slate-400">
          “Sincronizar” trae todos los proyectos y fotos reales del portal. “Ejecutar
          ahora” corre los loops de una vez (útil para probar).
        </p>
      </div>

      {/* Configuración con dropdowns */}
      <div className="card grid gap-4 md:grid-cols-2">
        <Dropdown
          label="Autopiloto diario (genera borradores por proyecto)"
          value={cfg.autopilot ? "on" : "off"}
          onChange={(v) => patch({ autopilot: v === "on" })}
          options={[
            { value: "on", label: "Activado" },
            { value: "off", label: "Desactivado" },
          ]}
        />
        <Dropdown
          label="Borradores por proyecto por día"
          value={String(cfg.postsPerDay)}
          onChange={(v) => patch({ postsPerDay: Number(v) })}
          options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))}
        />
        <Dropdown
          label="Investigación quincenal de tendencias"
          value={cfg.trendsLoop ? "on" : "off"}
          onChange={(v) => patch({ trendsLoop: v === "on" })}
          options={[
            { value: "on", label: "Activada" },
            { value: "off", label: "Desactivada" },
          ]}
        />
        <Dropdown
          label="Autoactualizar la instrucción con tendencias"
          value={cfg.autoUpdateInstruction ? "on" : "off"}
          onChange={(v) => patch({ autoUpdateInstruction: v === "on" })}
          options={[
            { value: "on", label: "Activada" },
            { value: "off", label: "Desactivada" },
          ]}
        />
        <Dropdown
          label="Día del mes para preguntar ventas"
          value={String(cfg.salesCheckinDay)}
          onChange={(v) => patch({ salesCheckinDay: Number(v) })}
          options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
        />
        <Dropdown
          label="Generación de video (API)"
          value={cfg.videoProvider}
          onChange={(v) => patch({ videoProvider: v })}
          options={VIDEO_PROVIDERS.map((p) => ({ value: p.key, label: p.label }))}
        />
        <div className="md:col-span-2">
          <label className="label">Redes para la generación diaria</label>
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((n) => {
              const on = cfg.dailyNetworks.includes(n.key);
              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => toggleNetwork(n.key)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    on ? "border-brand bg-brand/10 text-brand" : "border-slate-200 text-slate-500"
                  }`}
                >
                  {on ? "✓ " : ""}{n.label}
                </button>
              );
            })}
          </div>
        </div>
        {msg && <p className="text-sm text-emerald-700 md:col-span-2">{msg}</p>}
      </div>

      {/* Autopiloto por proyecto */}
      <div className="card">
        <h2 className="font-semibold text-slate-800">Proyectos en autopiloto</h2>
        <p className="mb-2 text-xs text-slate-500">
          Elige de qué proyectos genera ARS automáticamente cada día.
        </p>
        <div className="space-y-2">
          {projects.map((p) => (
            <label key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <span>
                {p.name} <span className="text-slate-400">· {p.status}</span>
              </span>
              <input type="checkbox" checked={p.autoPost} onChange={() => toggleProject(p)} />
            </label>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay proyectos aún. Usa “Sincronizar con el portal”.
            </p>
          )}
        </div>
      </div>

      <div className="card text-sm text-slate-500">
        <div className="flex justify-between"><span>Última generación diaria</span><span>{fmt(cfg.lastDailyRun)}</span></div>
        <div className="mt-1 flex justify-between"><span>Última investigación de tendencias</span><span>{fmt(cfg.lastTrendsRun)}</span></div>
        <p className="mt-2 text-xs text-slate-400">
          Estado actual — Autopiloto: {yesNo(cfg.autopilot)} · Tendencias: {yesNo(cfg.trendsLoop)}.
          Los borradores generados esperan tu aprobación en la cola (Fase 1).
        </p>
      </div>
    </div>
  );
}

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("es-SV") : "—";
}

function Dropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

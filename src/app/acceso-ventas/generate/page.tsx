"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

interface Project {
  id: string;
  name: string;
}
interface Campaign {
  id: string;
  name: string;
  projectId: string | null;
  networks: string;
}
interface Asset {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  tags: string;
}

const NETWORKS = [
  { id: "facebook", label: "📘 Facebook" },
  { id: "instagram", label: "📸 Instagram" },
  { id: "x", label: "✖️ X" },
  { id: "tiktok", label: "🎵 TikTok" },
];

export default function GeneratePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projectId, setProjectId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [networks, setNetworks] = useState<string[]>(["facebook", "instagram"]);
  const [count, setCount] = useState(1);
  const [attachImage, setAttachImage] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState(""); // "" = automática (prefiere embellecida)
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number } | null>(null);
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState<{ aiConfigured: boolean; model: string } | null>(null);
  const [videoConfigured, setVideoConfigured] = useState<boolean | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");

  useEffect(() => {
    api<Project[]>("/api/projects").then(setProjects).catch(() => {});
    api<Campaign[]>("/api/campaigns").then(setCampaigns).catch(() => {});
    api<{ aiConfigured: boolean; model: string; videoConfigured: boolean }>("/api/status")
      .then((s) => {
        setAiStatus({ aiConfigured: s.aiConfigured, model: s.model });
        setVideoConfigured(!!s.videoConfigured);
      })
      .catch(() => {});
  }, []);

  async function generateVideo() {
    if (!projectId) {
      setVideoMsg("Elige un proyecto: el reel se arma con sus fotos reales.");
      return;
    }
    setVideoBusy(true);
    setVideoMsg("Iniciando render del reel…");
    try {
      const r = await api<{ jobId: string; posts: number; usedAI: boolean }>("/api/video/generate", {
        method: "POST",
        body: JSON.stringify({ projectId, networks }),
      });
      setVideoMsg("🎬 Renderizando el video (suele tardar 1–2 min)…");
      // Sondea el estado hasta que termine (máx ~4 min).
      const MAX = 40;
      for (let i = 0; i < MAX; i++) {
        await new Promise((res) => setTimeout(res, 6000));
        const s = await api<{ job: { status: string; error?: string | null } | null }>(
          `/api/render/status?jobId=${r.jobId}`,
        );
        const st = s.job?.status;
        if (st === "done") {
          setVideoMsg(`✓ Video listo. Se crearon ${r.posts} borradores con el reel — revísalos en la cola.`);
          break;
        }
        if (st === "failed") {
          setVideoMsg(`El render falló: ${s.job?.error ?? "error desconocido"}.`);
          break;
        }
        if (i === MAX - 1) setVideoMsg("El render sigue en proceso; ábrelo en la cola en unos minutos (se adjunta solo).");
      }
    } catch (e) {
      setVideoMsg((e as Error).message);
    } finally {
      setVideoBusy(false);
    }
  }

  // Carga las imágenes disponibles según el proyecto (proyecto + globales).
  useEffect(() => {
    setAssetId("");
    const q = projectId ? `projectId=${projectId}` : "scope=global";
    api<Asset[]>(`/api/assets?${q}`)
      .then((a) => setAssets(a.filter((x) => x.mimeType.startsWith("image/"))))
      .catch(() => setAssets([]));
  }, [projectId]);

  const filteredCampaigns = campaigns.filter(
    (c) => !projectId || c.projectId === projectId || c.projectId === null,
  );

  const tagList = (j: string) => {
    try { return JSON.parse(j) as string[]; } catch { return []; }
  };

  function toggle(id: string) {
    setNetworks((n) => (n.includes(id) ? n.filter((x) => x !== id) : [...n, id]));
  }

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api<{ created: number }>("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          projectId: projectId || null,
          campaignId: campaignId || null,
          networks,
          countPerNetwork: count,
          attachImage,
          assetId: attachImage && assetId ? assetId : null,
        }),
      });
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Generar contenido</h1>
        <p className="text-slate-500">
          El bot combina la estrategia de marca, el proyecto/campaña y una imagen
          aleatoria del stock para crear borradores en cada red.
        </p>
      </div>

      {aiStatus && (
        <div
          className={`rounded-lg p-3 text-sm ring-1 ${
            aiStatus.aiConfigured
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-amber-50 text-amber-800 ring-amber-200"
          }`}
        >
          {aiStatus.aiConfigured ? (
            <>✅ Motor de IA activo: <strong>Claude ({aiStatus.model})</strong>. Los textos los escribe la IA.</>
          ) : (
            <>⚠️ La IA NO está activa en este despliegue (modo plantilla). Asegúrate de abrir tu URL de producción y que <code>ANTHROPIC_API_KEY</code> esté configurada.</>
          )}
        </div>
      )}

      <div className="card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Proyecto</label>
            <select
              className="input"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setCampaignId("");
              }}
            >
              <option value="">Institucional (sin proyecto)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Campaña (opcional)</label>
            <select className="input" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">Sin campaña</option>
              {filteredCampaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Redes</label>
          <div className="flex flex-wrap gap-3">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => toggle(n.id)}
                className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                  networks.includes(n.id)
                    ? "bg-brand text-white ring-brand"
                    : "bg-white text-slate-600 ring-slate-300"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Borradores por red</label>
            <input
              type="number"
              min={1}
              max={5}
              className="input"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={attachImage}
                onChange={(e) => setAttachImage(e.target.checked)}
              />
              Adjuntar imagen del stock
            </label>
          </div>
        </div>

        {/* Selector de imagen por proyecto */}
        {attachImage && (
          <div>
            <label className="label">
              Imagen a usar {projectId ? "" : "(institucional / global)"}
            </label>
            {assets.length === 0 ? (
              <p className="text-sm text-slate-400">
                No hay imágenes para este proyecto todavía. Súbelas o embellécelas en
                &quot;Stock de imágenes&quot;. Se usará una automática si existe.
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {/* Opción automática */}
                <button
                  type="button"
                  onClick={() => setAssetId("")}
                  className={`shrink-0 rounded-lg p-2 text-center ring-2 ${
                    assetId === "" ? "ring-brand" : "ring-slate-200"
                  }`}
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded bg-slate-100 text-2xl">🎲</div>
                  <div className="mt-1 w-24 text-xs text-slate-500">Automática<br/>(prefiere ✨)</div>
                </button>
                {assets.map((a) => {
                  const emb = tagList(a.tags).includes("embellecida");
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAssetId(a.id)}
                      className={`relative shrink-0 rounded-lg p-1 ring-2 ${
                        assetId === a.id ? "ring-brand" : "ring-slate-200"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt="" className="h-24 w-24 rounded object-cover" />
                      {emb && (
                        <span className="absolute left-1 top-1 rounded bg-emerald-500 px-1 text-[10px] font-bold text-white">✨</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={loading || networks.length === 0} onClick={generate}>
            {loading ? "Generando…" : "✨ Generar borradores"}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      {result && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          ✓ Se generaron <strong>{result.created}</strong> borradores.{" "}
          <Link href="/acceso-ventas/queue" className="font-medium underline">
            Ir a la cola de aprobación →
          </Link>
        </div>
      )}

      {/* Reel de video (JSON2Video) */}
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-900">🎬 Reel de video (JSON2Video)</h2>
            <p className="text-sm text-slate-500">
              Arma UN reel vertical 9:16 con las <strong>fotos reales</strong> del proyecto +
              texto en pantalla + música (sin voz), y crea un borrador por red con caption
              adaptado. Requiere al menos 4 fotos del proyecto.
            </p>
          </div>
          {videoConfigured !== null && (
            <span
              className={`badge ${
                videoConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {videoConfigured ? "JSON2Video conectado" : "Falta JSON2VIDEO_API_KEY"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn-primary"
            disabled={videoBusy || networks.length === 0}
            onClick={generateVideo}
          >
            {videoBusy ? "Renderizando…" : "🎬 Generar video del proyecto"}
          </button>
          {videoMsg && <span className="text-sm text-slate-600">{videoMsg}</span>}
        </div>
        {!projectId && (
          <p className="text-xs text-slate-400">
            Elige un proyecto arriba: el reel se construye con SUS fotos reales.
          </p>
        )}
      </div>
    </div>
  );
}

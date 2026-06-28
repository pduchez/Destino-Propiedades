"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

const METRIC_FIELDS = [
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Coment." },
  { key: "shares", label: "Compart./Repost" },
  { key: "impressions", label: "Impresiones" },
  { key: "reach", label: "Alcance" },
  { key: "clicks", label: "Clics" },
  { key: "saves", label: "Guardados" },
] as const;

type MetricKey = (typeof METRIC_FIELDS)[number]["key"];

interface Metric {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
  saves: number;
  source: string;
}
interface Post {
  id: string;
  network: string;
  status: string;
  caption: string;
  project?: { name: string } | null;
  metric: Metric | null;
}

interface Agg {
  network?: string;
  projectName?: string;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
  saves: number;
  engagement: number | null;
}
interface Report {
  totals: Agg;
  byNetwork: Agg[];
  byProject: Agg[];
  topPosts: { id: string; network: string; project: string; caption: string; likes: number; shares: number; engagement: number | null }[];
}

const NET_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
};

const pct = (e: number | null) => (e == null ? "—" : `${(e * 100).toFixed(1)}%`);

export default function MetricsPage() {
  const [days, setDays] = useState(7);
  const [report, setReport] = useState<Report | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  // Autoevaluación
  const [evalBusy, setEvalBusy] = useState(false);
  const [evalRes, setEvalRes] = useState<{ summary: string; recommendations: string; usedAI: boolean } | null>(null);
  const [evalMsg, setEvalMsg] = useState("");

  async function loadReport() {
    setLoading(true);
    try {
      const r = await api<{ report: Report }>(`/api/reports/weekly?days=${days}`);
      setReport(r.report);
    } finally {
      setLoading(false);
    }
  }
  async function loadPosts() {
    setPosts(await api<Post[]>("/api/posts"));
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);
  useEffect(() => {
    loadPosts();
  }, []);

  async function runEvaluation(apply: boolean) {
    setEvalBusy(true);
    setEvalMsg("");
    try {
      const r = await api<{ evaluation: { summary: string; recommendations: string; usedAI: boolean } }>(
        "/api/strategy/evaluate",
        { method: "POST", body: JSON.stringify({ days, apply }) },
      );
      setEvalRes(r.evaluation);
      if (apply)
        setEvalMsg("✓ Recomendaciones aplicadas a la estrategia. Se usarán al generar nuevos posts.");
    } catch (e) {
      setEvalMsg((e as Error).message);
    } finally {
      setEvalBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Métricas e informe</h1>
          <p className="text-slate-500">
            Impacto por red social y por proyecto, al estilo Meta Business, con
            autoevaluación semanal de la estrategia.
          </p>
        </div>
        <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Últimos 7 días</option>
          <option value={14}>Últimos 14 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      {/* Resumen por red */}
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800">Por red social</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : report && report.byNetwork.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {report.byNetwork.map((n) => (
              <div key={n.network} className="card">
                <div className="font-semibold">{NET_LABEL[n.network ?? ""] ?? n.network}</div>
                <div className="mt-1 text-xs text-slate-500">{n.posts} posts</div>
                <dl className="mt-2 space-y-1 text-sm">
                  <Row label="❤️ Likes" value={n.likes} />
                  <Row label="🔁 Compart." value={n.shares} />
                  <Row label="👁 Impresiones" value={n.impressions} />
                  <Row label="🔗 Clics" value={n.clicks} />
                  <Row label="📈 Engagement" value={pct(n.engagement)} />
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Aún no hay métricas en este período. Cárgalas abajo en “Registrar métricas”.
          </p>
        )}
      </section>

      {/* Resumen por proyecto */}
      {report && report.byProject.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-slate-800">Por proyecto</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-4">Proyecto</th>
                  <th className="py-1 pr-4">Posts</th>
                  <th className="py-1 pr-4">Likes</th>
                  <th className="py-1 pr-4">Compart.</th>
                  <th className="py-1 pr-4">Impresiones</th>
                  <th className="py-1 pr-4">Clics</th>
                  <th className="py-1 pr-4">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {report.byProject.map((p, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1 pr-4 font-medium">{p.projectName}</td>
                    <td className="py-1 pr-4">{p.posts}</td>
                    <td className="py-1 pr-4">{p.likes}</td>
                    <td className="py-1 pr-4">{p.shares}</td>
                    <td className="py-1 pr-4">{p.impressions}</td>
                    <td className="py-1 pr-4">{p.clicks}</td>
                    <td className="py-1 pr-4">{pct(p.engagement)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Autoevaluación de la estrategia */}
      <section className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-800">
            🤖 Autoevaluación de la estrategia
          </h2>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={evalBusy} onClick={() => runEvaluation(false)}>
              {evalBusy ? "Analizando…" : "Generar análisis"}
            </button>
            <button className="btn-primary" disabled={evalBusy || !evalRes} onClick={() => runEvaluation(true)}>
              Aplicar a la estrategia
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Analiza el rendimiento del período y propone ajustes concretos por red y
          proyecto. “Aplicar” incorpora las recomendaciones a la estrategia para que
          la IA las use al generar los próximos posts (autocorrección).
        </p>
        {evalRes && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Resumen</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{evalRes.summary}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Recomendaciones</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{evalRes.recommendations}</p>
            </div>
            <div className="text-[11px] text-slate-400">
              {evalRes.usedAI ? "Generado con Claude" : "Análisis heurístico (sin IA)"}
            </div>
          </div>
        )}
        {evalMsg && <p className="text-sm text-emerald-700">{evalMsg}</p>}
      </section>

      {/* Registro de métricas por post */}
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800">Registrar métricas</h2>
        <p className="text-xs text-slate-500">
          Ingresa los números de cada red (de Meta Business, X o TikTok) y guarda.
          En la Fase 2 esto se llenará automáticamente desde las APIs.
        </p>
        <div className="space-y-3">
          {posts.map((p) => (
            <MetricRow key={p.id} post={p} onSaved={() => { loadReport(); loadPosts(); }} />
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-slate-500">No hay posts todavía. Genera algunos primero.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function MetricRow({ post, onSaved }: { post: Post; onSaved: () => void }) {
  const [vals, setVals] = useState<Record<MetricKey, string>>(() => {
    const m = post.metric;
    return {
      likes: String(m?.likes ?? ""),
      comments: String(m?.comments ?? ""),
      shares: String(m?.shares ?? ""),
      impressions: String(m?.impressions ?? ""),
      reach: String(m?.reach ?? ""),
      clicks: String(m?.clicks ?? ""),
      saves: String(m?.saves ?? ""),
    };
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = { postId: post.id, source: "manual" };
      for (const f of METRIC_FIELDS) payload[f.key] = Number(vals[f.key] || 0);
      await api("/api/metrics", { method: "POST", body: JSON.stringify(payload) });
      setSaved(true);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="font-semibold">{NET_LABEL[post.network] ?? post.network}</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500">{post.project?.name ?? "Institucional"}</span>
        <span className="ml-auto truncate text-xs text-slate-400">{post.caption.slice(0, 60)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {METRIC_FIELDS.map((f) => (
          <label key={f.key} className="text-xs text-slate-500">
            {f.label}
            <input
              type="number"
              min={0}
              className="input mt-1 py-1 text-sm"
              value={vals[f.key]}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button className="btn-secondary" disabled={busy} onClick={save}>
          {busy ? "Guardando…" : "Guardar métricas"}
        </button>
        {saved && <span className="text-xs text-emerald-700">✓ Guardado</span>}
      </div>
    </div>
  );
}

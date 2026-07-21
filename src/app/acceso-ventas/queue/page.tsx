"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import PostPreview from "@/components/PostPreview";
import PublicarAsistido from "@/components/PublicarAsistido";

interface Asset {
  id: string;
  url: string;
  mimeType: string;
}
interface Post {
  id: string;
  network: string;
  status: string;
  caption: string;
  hashtags: string;
  callToAction: string;
  externalUrl: string | null;
  error: string | null;
  model: string | null;
  renderJobId?: string | null;
  project?: { name: string } | null;
  campaign?: { name: string } | null;
  assets: Asset[];
}

const NET_META: Record<string, { label: string; emoji: string }> = {
  facebook: { label: "Facebook", emoji: "📘" },
  instagram: { label: "Instagram", emoji: "📸" },
  x: { label: "X", emoji: "✖️" },
  tiktok: { label: "TikTok", emoji: "🎵" },
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  approved: "bg-blue-100 text-blue-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  publishing: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  approved: "Aprobado",
  scheduled: "Programado",
  publishing: "Publicando…",
  published: "Publicado",
  rejected: "Rechazado",
  failed: "Falló",
};

export default function QueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [statusFilter, setStatusFilter] = useState("draft");
  const [networkFilter, setNetworkFilter] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (networkFilter) params.set("network", networkFilter);
    setPosts(await api<Post[]>(`/api/posts?${params.toString()}`));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, networkFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Cola de aprobación</h1>
      <p className="text-slate-500">
        Revisa, edita y aprueba cada borrador. Con <strong>📤 Publicar</strong> se abre el
        asistente de 3 pasos (copiar texto → descargar imagen → pegar en Business Suite).
        La publicación directa por API queda para la Fase 2.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input w-auto" value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)}>
          <option value="">Todas las redes</option>
          {Object.entries(NET_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onChange={load} />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-slate-500">No hay posts en este filtro.</p>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onChange }: { post: Post; onChange: () => void }) {
  const meta = NET_META[post.network] ?? { label: post.network, emoji: "📱" };
  const [caption, setCaption] = useState(post.caption);
  const [cta, setCta] = useState(post.callToAction);
  const [hashtags, setHashtags] = useState(() => {
    try {
      return (JSON.parse(post.hashtags) as string[]).join(" ");
    } catch {
      return "";
    }
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [asistido, setAsistido] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setError("");
    await api(`/api/posts/${post.id}`, { method: "PATCH", body: JSON.stringify(body) });
  }

  async function saveEdits() {
    setBusy("save");
    try {
      await patch({ caption, callToAction: cta, hashtags });
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function setStatus(status: string) {
    setBusy(status);
    try {
      await patch({ caption, callToAction: cta, hashtags, status });
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function publish() {
    setBusy("publish");
    setError("");
    try {
      // Guarda ediciones primero
      await patch({ caption, callToAction: cta, hashtags });
      await api(`/api/posts/${post.id}/publish`, { method: "POST" });
      onChange();
    } catch (e) {
      setError((e as Error).message);
      onChange();
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar este borrador?")) return;
    await api(`/api/posts/${post.id}`, { method: "DELETE" });
    onChange();
  }

  const editable = post.status === "draft" || post.status === "approved" || post.status === "failed";
  const asset = post.assets[0];

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.emoji}</span>
          <span className="font-semibold">{meta.label}</span>
          <span className={`badge ${STATUS_BADGE[post.status] ?? "bg-slate-100"}`}>
            {STATUS_LABEL[post.status] ?? post.status}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {post.project?.name ?? "Institucional"}
        </span>
      </div>

      {asset && (
        <div>
          {asset.mimeType.startsWith("video/") ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={asset.url} className="h-44 w-full rounded-lg object-cover" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.url} alt="" className="h-44 w-full rounded-lg object-cover" />
          )}
        </div>
      )}

      {!asset && post.renderJobId && (
        <div className="flex h-24 w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
          🎬 Video en preparación… (recarga en 1–2 min)
        </div>
      )}

      <div>
        <label className="label">Texto del post</label>
        <textarea className="input" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} disabled={!editable} />
      </div>
      <div>
        <label className="label">Llamado a la acción</label>
        <input className="input" value={cta} onChange={(e) => setCta(e.target.value)} disabled={!editable} />
      </div>
      <div>
        <label className="label">Hashtags</label>
        <input className="input" value={hashtags} onChange={(e) => setHashtags(e.target.value)} disabled={!editable} />
      </div>

      {post.error && (
        <p className="rounded bg-red-50 p-2 text-xs text-red-700">⚠️ {post.error}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {post.externalUrl && (
        <a href={post.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-brand underline">
          Ver publicación →
        </a>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button className="btn-secondary" onClick={() => setPreview(true)}>
          👁 Vista previa
        </button>
        {editable && (
          <button className="btn-secondary" onClick={saveEdits} disabled={!!busy}>
            {busy === "save" ? "Guardando…" : "Guardar"}
          </button>
        )}
        {post.status === "draft" && (
          <button className="btn-secondary" onClick={() => setStatus("approved")} disabled={!!busy}>
            Aprobar
          </button>
        )}
        {(post.status === "approved" || post.status === "draft" || post.status === "failed") && (
          <>
            <button
              className="btn-primary"
              disabled={!!busy}
              onClick={async () => {
                // Guarda las ediciones antes de abrir el asistente.
                setBusy("save");
                try {
                  await patch({ caption, callToAction: cta, hashtags });
                } finally {
                  setBusy("");
                }
                setAsistido(true);
              }}
            >
              📤 Publicar
            </button>
            <button
              className="btn-secondary"
              onClick={publish}
              disabled={!!busy}
              title="Publicación directa por API (Fase 2: requiere credenciales de Meta)"
            >
              {busy === "publish" ? "Publicando…" : "🚀 API"}
            </button>
          </>
        )}
        {post.status !== "rejected" && post.status !== "published" && (
          <button className="btn-secondary" onClick={() => setStatus("rejected")} disabled={!!busy}>
            Rechazar
          </button>
        )}
        <button className="btn-danger ml-auto" onClick={remove}>Eliminar</button>
      </div>
      {post.model && (
        <p className="text-[11px] text-slate-400">Generado con: {post.model}</p>
      )}

      {asistido && (
        <PublicarAsistido
          network={post.network}
          caption={caption}
          callToAction={cta}
          hashtags={hashtags}
          imageUrl={asset && !asset.mimeType.startsWith("video/") ? asset.url : undefined}
          postId={post.id}
          onConfirm={async () => {
            await patch({ status: "published" });
            onChange();
          }}
          onClose={() => setAsistido(false)}
        />
      )}

      {preview && (
        <PostPreview
          data={{
            network: post.network,
            caption,
            callToAction: cta,
            hashtags: hashtags.split(/\s+/).filter(Boolean),
            imageUrl: asset?.url,
            brandName: "Destino Propiedades",
          }}
          onClose={() => setPreview(false)}
        />
      )}
    </div>
  );
}

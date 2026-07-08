"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

const ESTILOS = [
  { key: "auto", label: "Automático (según el proyecto)" },
  { key: "lote_limpio", label: "Lote limpio y nivelado" },
  { key: "casa_modelo", label: "Con casa modelo" },
  { key: "playa", label: "Aspiracional de playa" },
  { key: "residencial", label: "Residencial con jardines" },
  { key: "aereo", label: "Vista aérea / dron" },
];

interface Result {
  before: string;
  after: string;
  promptUsed: string;
}

export default function EmbellecerModal({
  assetId,
  beforeUrl,
  onClose,
  onDone,
}: {
  assetId: string;
  beforeUrl: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [estilo, setEstilo] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [cfg, setCfg] = useState<{ falReady: boolean; storageReady: boolean } | null>(null);

  // Detecta si se está usando una URL de PREVIEW (con hash) en vez de la de
  // producción. Los previews traen variables de entorno de un build viejo.
  const [isPreview, setIsPreview] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname;
      // Producción = destino-portal.vercel.app (o dominio propio). Preview =
      // destino-portal-<hash>-....vercel.app
      setIsPreview(/^destino-portal-.+\.vercel\.app$/.test(h));
    }
  }, []);

  useEffect(() => {
    api<{ falReady: boolean; storageReady: boolean }>("/api/embellecer")
      .then(setCfg)
      .catch(() => {});
  }, []);

  async function generar() {
    setBusy(true);
    setErr("");
    try {
      const r = await api<Result>("/api/embellecer", {
        method: "POST",
        body: JSON.stringify({ assetId, estilo }),
        timeoutMs: 180000, // la generación puede tardar ~30-60s
      });
      setResult(r);
      onDone(); // recarga el stock (ya se creó el asset embellecido)
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div className="card my-8 w-full max-w-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-bold text-slate-900">✨ Embellecer imagen</h2>
          <p className="text-sm text-slate-500">
            Claude escribe la instrucción y genera una versión aspiracional del lote,
            con un sello legal discreto al pie. La imagen original no se toca.
          </p>
        </div>

        {isPreview && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            ⚠️ Estás en una URL de <strong>preview</strong> (con código en la dirección), que usa
            configuración vieja. Abre la de <strong>producción</strong>:{" "}
            <a className="font-semibold underline" href="https://destino-portal.vercel.app/acceso-ventas/images">
              destino-portal.vercel.app
            </a>
          </div>
        )}

        {cfg && (!cfg.falReady || !cfg.storageReady) && (
          <div className="rounded bg-amber-50 p-2 text-xs text-amber-800 ring-1 ring-amber-200">
            {!cfg.falReady && <div>⚠️ Falta <code>FAL_KEY</code> en Vercel.</div>}
            {!cfg.storageReady && (
              <div>⚠️ Falta conectar <strong>Vercel Blob</strong> (Storage → Create → Blob) para guardar la imagen generada.</div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="label">Estilo</label>
            <select className="input" value={estilo} onChange={(e) => setEstilo(e.target.value)} disabled={busy}>
              {ESTILOS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={generar} disabled={busy}>
            {busy ? "Generando… (~20s)" : result ? "🔄 Generar otra" : "✨ Generar"}
          </button>
        </div>

        {err && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-500">ANTES (real)</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result?.before || beforeUrl} alt="antes" className="w-full rounded-lg object-cover" />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-emerald-600">DESPUÉS (embellecida)</div>
            {result ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.after} alt="después" className="w-full rounded-lg object-cover ring-2 ring-emerald-300" />
            ) : (
              <div className="flex h-full min-h-[120px] items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
                {busy ? "Generando…" : "Aún no generada"}
              </div>
            )}
          </div>
        </div>

        {result && (
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">Ver instrucción que usó Claude</summary>
            <p className="mt-1 rounded bg-slate-50 p-2 font-mono">{result.promptUsed}</p>
          </details>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <button className="btn-secondary" onClick={onClose}>
            {result ? "Listo" : "Cerrar"}
          </button>
        </div>
        {result && (
          <p className="text-center text-xs text-emerald-600">
            ✓ Guardada en el stock como &quot;embellecida&quot;. ARS la preferirá para los posts.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

/**
 * Publicación asistida (sin API): asistente de 3 pasos a prueba de errores.
 * 1) Copiar el texto  2) Descargar la imagen  3) Abrir Business Suite y pegar.
 * Al confirmar, el post se marca como "Publicado" para que métricas y
 * reportes funcionen igual que con la publicación por API (Fase 2).
 */
import { useMemo, useState } from "react";

interface Props {
  network: string; // facebook | instagram | x | tiktok
  caption: string;
  callToAction: string;
  hashtags: string; // separados por espacio
  imageUrl?: string;
  postId: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

const DESTINO: Record<string, { label: string; url: string; nota: string }> = {
  facebook: {
    label: "Meta Business Suite",
    url: "https://business.facebook.com/latest/composer",
    nota: "En Business Suite, verifica que esté marcada tu página de Facebook.",
  },
  instagram: {
    label: "Meta Business Suite",
    url: "https://business.facebook.com/latest/composer",
    nota: "En Business Suite, verifica que esté marcada tu cuenta de Instagram.",
  },
  x: {
    label: "X (Twitter)",
    url: "https://x.com/compose/post",
    nota: "Se abrirá el compositor de X con tu sesión.",
  },
  tiktok: {
    label: "TikTok",
    url: "https://www.tiktok.com/upload",
    nota: "TikTok requiere video; usa la imagen como portada si aplica.",
  },
};

export default function PublicarAsistido({
  network,
  caption,
  callToAction,
  hashtags,
  imageUrl,
  postId,
  onConfirm,
  onClose,
}: Props) {
  const destino = DESTINO[network] ?? DESTINO.facebook;
  const hasImage = !!imageUrl;

  // Texto final: caption + CTA + hashtags, listo para pegar tal cual.
  const textoFinal = useMemo(
    () =>
      [caption.trim(), callToAction.trim(), hashtags.trim()]
        .filter(Boolean)
        .join("\n\n"),
    [caption, callToAction, hashtags],
  );

  const [done, setDone] = useState({ copy: false, img: !hasImage, open: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const allDone = done.copy && done.img && done.open;

  async function copiar() {
    setErr("");
    try {
      await navigator.clipboard.writeText(textoFinal);
    } catch {
      // Fallback para navegadores restrictivos
      const ta = document.createElement("textarea");
      ta.value = textoFinal;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setDone((d) => ({ ...d, copy: true }));
  }

  async function descargar() {
    if (!imageUrl) return;
    setErr("");
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `post-${network}-${postId.slice(-6)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDone((d) => ({ ...d, img: true }));
    } catch {
      setErr("No se pudo descargar la imagen. Intenta clic derecho → Guardar imagen.");
    }
  }

  function abrir() {
    window.open(destino.url, "_blank", "noopener");
    setDone((d) => ({ ...d, open: true }));
  }

  async function confirmar() {
    setBusy(true);
    setErr("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="card my-8 w-full max-w-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            📤 Publicar en {network === "instagram" ? "Instagram" : network === "facebook" ? "Facebook" : destino.label}
          </h2>
          <p className="text-sm text-slate-500">
            Sigue los 3 pasos en orden. No hay que pensar nada: copiar, descargar, pegar.
          </p>
        </div>

        {/* Paso 1 */}
        <Paso n={1} listo={done.copy} titulo="Copia el texto del post">
          <div className="max-h-28 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            {textoFinal || "(sin texto)"}
          </div>
          <button className="btn-primary mt-2 w-full" onClick={copiar}>
            {done.copy ? "✓ Texto copiado (volver a copiar)" : "📋 Copiar texto"}
          </button>
        </Paso>

        {/* Paso 2 */}
        {hasImage && (
          <Paso n={2} listo={done.img} titulo="Descarga la imagen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-28 w-full rounded-lg object-cover" />
            <button className="btn-primary mt-2 w-full" onClick={descargar}>
              {done.img ? "✓ Imagen descargada (volver a descargar)" : "⬇️ Descargar imagen"}
            </button>
          </Paso>
        )}

        {/* Paso 3 */}
        <Paso n={hasImage ? 3 : 2} listo={done.open} titulo={`Abre ${destino.label} y pega`}>
          <p className="text-xs text-slate-500">
            Pega el texto, adjunta la imagen descargada y dale Publicar (o Programar).{" "}
            {destino.nota}
          </p>
          <button className="btn-primary mt-2 w-full" onClick={abrir}>
            {done.open ? `✓ ${destino.label} abierto (abrir de nuevo)` : `↗️ Abrir ${destino.label}`}
          </button>
        </Paso>

        {err && <p className="text-sm text-red-600">{err}</p>}

        {/* Confirmación */}
        <div className="border-t border-slate-200 pt-3">
          <button
            className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition ${
              allDone ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300"
            }`}
            disabled={!allDone || busy}
            onClick={confirmar}
          >
            {busy ? "Guardando…" : "✅ Ya la publiqué — marcar como Publicado"}
          </button>
          {!allDone && (
            <p className="mt-1 text-center text-xs text-slate-400">
              Completa los pasos de arriba para habilitar este botón.
            </p>
          )}
          <button className="mt-2 w-full text-sm text-slate-400 hover:text-slate-600" onClick={onClose}>
            Cancelar (el post queda como está)
          </button>
        </div>
      </div>
    </div>
  );
}

function Paso({
  n,
  listo,
  titulo,
  children,
}: {
  n: number;
  listo: boolean;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl p-3 ring-1 ${listo ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-slate-200"}`}>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
            listo ? "bg-emerald-500" : "bg-slate-400"
          }`}
        >
          {listo ? "✓" : n}
        </span>
        <span className="text-sm font-semibold text-slate-800">{titulo}</span>
      </div>
      {children}
    </div>
  );
}

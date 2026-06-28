"use client";

/**
 * Vista previa gráfica de un post tal como se vería en cada red social.
 * Mockups simplificados pero reconocibles de Facebook, Instagram, X y TikTok.
 */

export interface PreviewData {
  network: string;
  caption: string;
  callToAction: string;
  hashtags: string[];
  imageUrl?: string;
  brandName?: string;
}

function fullText(d: PreviewData): { body: string; tags: string } {
  const body = [d.caption?.trim(), d.callToAction?.trim()].filter(Boolean).join("\n\n");
  return { body, tags: (d.hashtags || []).join(" ") };
}

export default function PostPreview({
  data,
  onClose,
}: {
  data: PreviewData;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between text-white">
          <span className="text-sm font-medium">Vista previa · {label(data.network)}</span>
          <button
            onClick={onClose}
            className="rounded-full bg-white/20 px-3 py-1 text-sm hover:bg-white/30"
          >
            Cerrar ✕
          </button>
        </div>
        {render(data)}
      </div>
    </div>
  );
}

function label(n: string): string {
  return (
    { facebook: "Facebook", instagram: "Instagram", x: "X", tiktok: "TikTok" }[n] ?? n
  );
}

function render(d: PreviewData) {
  switch (d.network) {
    case "facebook":
      return <FacebookPreview d={d} />;
    case "instagram":
      return <InstagramPreview d={d} />;
    case "x":
      return <XPreview d={d} />;
    case "tiktok":
      return <TikTokPreview d={d} />;
    default:
      return <FacebookPreview d={d} />;
  }
}

function Avatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white"
      style={{ width: size, height: size }}
    >
      D
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */

function FacebookPreview({ d }: { d: PreviewData }) {
  const { body, tags } = fullText(d);
  const name = d.brandName || "Destino Propiedades";
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-xl">
      <div className="flex items-center gap-2 p-3">
        <Avatar />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">{name}</div>
          <div className="text-xs text-slate-500">Publicidad · 🌐</div>
        </div>
      </div>
      <div className="whitespace-pre-wrap px-3 pb-3 text-sm text-slate-800">
        {body} {tags && <span className="text-blue-600">{tags}</span>}
      </div>
      {d.imageUrl && (
        <img src={d.imageUrl} alt="" className="w-full object-cover" />
      )}
      <div className="flex items-center justify-around border-t border-slate-200 py-2 text-sm font-medium text-slate-500">
        <span>👍 Me gusta</span>
        <span>💬 Comentar</span>
        <span>↪ Compartir</span>
      </div>
    </div>
  );
}

function InstagramPreview({ d }: { d: PreviewData }) {
  const { body, tags } = fullText(d);
  const user = "destinopropiedades";
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-xl">
      <div className="flex items-center gap-2 p-3">
        <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
          <div className="rounded-full bg-white p-0.5">
            <Avatar size={32} />
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-900">{user}</div>
        <span className="ml-auto text-slate-400">⋯</span>
      </div>
      {d.imageUrl ? (
        <img src={d.imageUrl} alt="" className="aspect-square w-full object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-slate-100 text-slate-400">
          Sin imagen
        </div>
      )}
      <div className="flex items-center gap-4 px-3 pt-3 text-xl">
        <span>🤍</span>
        <span>💬</span>
        <span>✈️</span>
        <span className="ml-auto">🔖</span>
      </div>
      <div className="whitespace-pre-wrap px-3 py-2 text-sm text-slate-800">
        <span className="font-semibold">{user}</span> {body}{" "}
        {tags && <span className="text-blue-900">{tags}</span>}
      </div>
    </div>
  );
}

function XPreview({ d }: { d: PreviewData }) {
  const { body, tags } = fullText(d);
  const name = d.brandName || "Destino Propiedades";
  return (
    <div className="rounded-2xl bg-white p-3 shadow-xl">
      <div className="flex gap-3">
        <Avatar />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-bold text-slate-900">{name}</span>
            <span className="text-slate-500">@destinoprop · ahora</span>
          </div>
          <div className="whitespace-pre-wrap py-1 text-sm text-slate-800">
            {body} {tags && <span className="text-sky-500">{tags}</span>}
          </div>
          {d.imageUrl && (
            <img src={d.imageUrl} alt="" className="mt-2 w-full rounded-2xl border border-slate-200 object-cover" />
          )}
          <div className="mt-2 flex items-center justify-between pr-6 text-sm text-slate-500">
            <span>💬 12</span>
            <span>🔁 8</span>
            <span>🤍 34</span>
            <span>📊 1.2K</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TikTokPreview({ d }: { d: PreviewData }) {
  const { body, tags } = fullText(d);
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-2xl bg-black shadow-xl">
      {d.imageUrl ? (
        <img src={d.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      ) : (
        <div className="absolute inset-0 bg-slate-800" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pb-4 text-white">
        <div className="text-sm font-semibold">@destinopropiedades</div>
        <div className="mt-1 whitespace-pre-wrap text-sm">
          {body} <span className="font-semibold">{tags}</span>
        </div>
        <div className="mt-1 text-xs opacity-80">♫ sonido original — Destino Propiedades</div>
      </div>
      <div className="absolute bottom-16 right-2 flex flex-col items-center gap-4 text-center text-white">
        <div className="text-2xl">🤍<div className="text-xs">1.2K</div></div>
        <div className="text-2xl">💬<div className="text-xs">88</div></div>
        <div className="text-2xl">↪<div className="text-xs">Compartir</div></div>
      </div>
    </div>
  );
}

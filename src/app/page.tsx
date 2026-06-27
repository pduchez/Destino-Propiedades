"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

interface Status {
  aiConfigured: boolean;
  model: string;
  counts: { projects: number; drafts: number; published: number; assets: number };
}

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    api<Status>("/api/status").then(setStatus).catch(() => {});
  }, []);

  const cards = [
    { label: "Proyectos", value: status?.counts.projects, href: "/projects", icon: "🏢" },
    { label: "Borradores por aprobar", value: status?.counts.drafts, href: "/queue", icon: "✅" },
    { label: "Publicados", value: status?.counts.published, href: "/queue", icon: "🚀" },
    { label: "Imágenes en stock", value: status?.counts.assets, href: "/images", icon: "🖼️" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de control</h1>
        <p className="text-slate-500">
          Agente de generación y publicación de contenido para Destinopropiedades.com
        </p>
      </div>

      {status && !status.aiConfigured && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          ⚠️ No se detectó <code>ANTHROPIC_API_KEY</code>. El bot está usando el
          generador por <strong>plantillas</strong>. Configura tu API key de Claude
          en el archivo <code>.env</code> para generar copys con IA.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card hover:ring-brand">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {c.value ?? "—"}
            </div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-slate-900">¿Cómo funciona?</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-600">
            <li>1. Define la <Link href="/settings" className="text-brand underline">estrategia de marca</Link> y tus <Link href="/projects" className="text-brand underline">proyectos</Link>.</li>
            <li>2. Sube imágenes al <Link href="/images" className="text-brand underline">stock</Link> (globales o por proyecto).</li>
            <li>3. Crea <Link href="/campaigns" className="text-brand underline">campañas</Link> con instrucciones específicas (opcional).</li>
            <li>4. <Link href="/generate" className="text-brand underline">Genera</Link> borradores para Facebook, Instagram, X y TikTok.</li>
            <li>5. Revisa y aprueba en la <Link href="/queue" className="text-brand underline">cola de aprobación</Link>; publica con un clic.</li>
          </ol>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-900">Estado del sistema</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Motor de IA</span>
              <span className={status?.aiConfigured ? "text-emerald-600" : "text-amber-600"}>
                {status?.aiConfigured ? `Claude (${status.model})` : "Plantillas (sin API key)"}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Fase de publicación</span>
              <span className="text-slate-800">Fase 1 — Aprobación humana</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Redes objetivo</span>
              <span className="text-slate-800">Facebook · Instagram · X · TikTok</span>
            </li>
          </ul>
          <Link href="/settings" className="btn-secondary mt-4">Ir a configuración</Link>
        </div>
      </div>
    </div>
  );
}

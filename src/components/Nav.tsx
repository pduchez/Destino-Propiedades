"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import IdleLogout from "@/components/IdleLogout";

const BASE = "/acceso-ventas";
const LINKS = [
  { href: BASE, label: "Inicio", icon: "🏠" },
  { href: `${BASE}/generate`, label: "Generar", icon: "✨" },
  { href: `${BASE}/queue`, label: "Aprobación", icon: "✅" },
  { href: `${BASE}/automation`, label: "Automatización", icon: "🤖" },
  { href: `${BASE}/metrics`, label: "Métricas e informe", icon: "📊" },
  { href: `${BASE}/projects`, label: "Proyectos", icon: "🏢" },
  { href: `${BASE}/campaigns`, label: "Campañas", icon: "📣" },
  { href: `${BASE}/images`, label: "Stock de imágenes", icon: "🖼️" },
  { href: `${BASE}/settings`, label: "Configuración", icon: "⚙️" },
  { href: `${BASE}/cuenta`, label: "Mi cuenta", icon: "👤" },
];

/** Shell responsivo de ARS: barra lateral en escritorio y menú desplegable en
 *  móvil (siempre accesible con el botón ☰). Envuelve el contenido. */
export default function Nav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === BASE ? pathname === BASE : pathname.startsWith(href));

  const linkList = (
    <nav className="space-y-1">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
            isActive(l.href) ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );

  const modLinks = (
    <div className="space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-400">
      <Link href="/inicio" onClick={() => setOpen(false)} className="block hover:text-brand">⇄ Cambiar módulo (CRM/ARS)</Link>
      <Link href="/" onClick={() => setOpen(false)} className="block hover:text-brand">← Volver al portal</Link>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <IdleLogout />
      {/* Sidebar escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="p-5">
          <Link href={BASE} className="block">
            <div className="text-lg font-bold text-brand">ARS</div>
            <div className="text-xs text-slate-500">Agente de Redes Sociales</div>
          </Link>
        </div>
        <div className="px-3">{linkList}</div>
        <div className="mt-auto p-4">{modLinks}</div>
      </aside>

      {/* Contenido + barra móvil */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white p-3 md:hidden">
          <Link href={BASE} className="font-bold text-brand">ARS</Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200"
            aria-label="Menú"
          >
            ☰ Menú
          </button>
        </header>
        {open && (
          <div className="space-y-2 border-b border-slate-200 bg-white p-3 md:hidden">
            {linkList}
            {modLinks}
          </div>
        )}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

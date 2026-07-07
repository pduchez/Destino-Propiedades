"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="p-5">
        <Link href={BASE} className="block">
          <div className="text-lg font-bold text-brand">ARS</div>
          <div className="text-xs text-slate-500">Agente de Redes Sociales</div>
        </Link>
        <Link href="/" className="mt-2 inline-block text-xs text-slate-400 hover:text-brand">
          ← Volver al portal
        </Link>
      </div>
      <nav className="space-y-1 px-3">
        {LINKS.map((l) => {
          const active =
            l.href === BASE ? pathname === BASE : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

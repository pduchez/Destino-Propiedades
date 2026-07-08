"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import IdleLogout from "@/components/IdleLogout";

const NAV = [
  { href: "/crm", label: "Tablero", icon: "📊", exact: true },
  { href: "/crm/leads", label: "Leads", icon: "🧑‍🤝‍🧑" },
  { href: "/crm/pipeline", label: "Embudo", icon: "📈" },
  { href: "/crm/agenda", label: "Agenda", icon: "📅" },
  { href: "/crm/tareas", label: "Tareas", icon: "⏰" },
  { href: "/crm/reportes", label: "Reportes", icon: "📑" },
  { href: "/crm/cuenta", label: "Mi cuenta", icon: "👤" },
];

export default function CrmShell({
  role,
  username,
  children,
}: {
  role: "admin" | "sales";
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await api("/api/auth", { method: "DELETE" }).catch(() => {});
    window.location.href = "/inicio";
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const links = (
    <nav className="space-y-1">
      {NAV.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
            isActive(l.href, l.exact)
              ? "bg-brand/10 text-brand"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <IdleLogout />
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="p-5">
          <div className="text-lg font-bold text-brand">DestinoPropiedades</div>
          <div className="text-xs text-slate-500">
            CRM · {role === "admin" ? "Dirección" : "Ventas"}
          </div>
        </div>
        <div className="px-3">{links}</div>
        <div className="mt-auto p-4 text-xs text-slate-400">
          {/* Cambio de módulo: solo el Director (admin) puede ir a ARS. */}
          <div className="mb-3 space-y-1 border-b border-slate-100 pb-3">
            {role === "admin" && (
              <>
                <a href="/inicio" className="block hover:text-brand">⇄ Cambiar módulo</a>
                <a href="/acceso-ventas" className="block hover:text-brand">🤖 Ir a ARS</a>
              </>
            )}
            <a href="/" className="block hover:text-brand">🌐 Ver portal</a>
          </div>
          <div className="mb-2 truncate">👤 {username}</div>
          <button onClick={logout} className="hover:text-brand">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar móvil */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white p-3 md:hidden">
          <div className="font-bold text-brand">CRM</div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200"
          >
            ☰ Menú
          </button>
        </header>
        {open && (
          <div className="border-b border-slate-200 bg-white p-3 md:hidden">
            {links}
            <div className="mt-2 space-y-1 border-t border-slate-100 px-3 pt-2 text-sm text-slate-500">
              {role === "admin" && <a href="/acceso-ventas" className="block hover:text-brand">🤖 Ir a ARS</a>}
              <a href="/" className="block hover:text-brand">🌐 Ver portal</a>
              <button onClick={logout} className="hover:text-brand">Cerrar sesión</button>
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

interface Me {
  authenticated: boolean;
  username?: string;
  role?: "admin" | "sales";
}

export default function InicioPage() {
  const [state, setState] = useState<"checking" | "chooser" | "login">("checking");
  const [role, setRole] = useState<"admin" | "sales">("sales");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function route(me: Me) {
    if (!me.authenticated) return setState("login");
    // Ambos roles llegan al selector de módulos (con opciones según su rol).
    setRole(me.role === "admin" ? "admin" : "sales");
    setState("chooser");
  }

  useEffect(() => {
    api<Me>("/api/me").then(route).catch(() => setState("login"));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api<{ role: "admin" | "sales" }>("/api/auth", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setRole(res.role === "admin" ? "admin" : "sales");
      setState("chooser");
    } catch (e) {
      setError((e as Error).message || "Usuario o contraseña incorrectos");
      setBusy(false);
    }
  }

  if (state === "checking") {
    return <div className="flex h-screen items-center justify-center text-slate-400">Cargando…</div>;
  }

  if (state === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <form onSubmit={login} className="card w-80 space-y-4">
          <div>
            <div className="text-lg font-bold text-brand">DestinoPropiedades</div>
            <div className="text-sm text-slate-500">Acceso ventas</div>
          </div>
          <div>
            <label className="label">Usuario</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        </form>
      </div>
    );
  }

  // Selector de módulos. Director1 (admin): CRM + ARS + Asistente de Cierre.
  // Ventas1..5 (sales): CRM + Asistente de Cierre.
  const isAdmin = role === "admin";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">¿Qué quieres hacer?</h1>
      <p className="mb-8 text-slate-500">Elige un módulo para continuar</p>
      <div
        className={`grid w-full gap-6 ${
          isAdmin ? "max-w-3xl sm:grid-cols-3" : "max-w-2xl sm:grid-cols-2"
        }`}
      >
        <a
          href="/crm"
          className="card flex flex-col items-center gap-3 py-10 text-center transition hover:ring-2 hover:ring-brand"
        >
          <span className="text-6xl">📊</span>
          <span className="text-xl font-bold text-slate-900">CRM</span>
          <span className="text-sm text-slate-500">Gestión de ventas, leads y reportes</span>
        </a>

        <a
          href="/asistente"
          className="card flex flex-col items-center gap-3 py-10 text-center transition hover:ring-2 hover:ring-brand"
        >
          <span className="text-6xl">🤝</span>
          <span className="text-xl font-bold text-slate-900">Asistente de Cierre</span>
          <span className="text-sm text-slate-500">Cotiza, reserva y firma en la cita</span>
        </a>

        {isAdmin && (
          <a
            href="/acceso-ventas"
            className="card flex flex-col items-center gap-3 py-10 text-center transition hover:ring-2 hover:ring-brand"
          >
            <span className="text-6xl">🤖</span>
            <span className="text-xl font-bold text-slate-900">ARS</span>
            <span className="text-sm text-slate-500">Agente de Redes Sociales</span>
          </a>
        )}
      </div>
      <button
        onClick={async () => {
          await api("/api/auth", { method: "DELETE" }).catch(() => {});
          window.location.href = "/inicio";
        }}
        className="mt-8 text-sm text-slate-400 hover:text-brand"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

interface Me {
  authenticated: boolean;
  username?: string;
  role?: "admin" | "sales";
}

/**
 * Puerta de acceso del área privada. Verifica la sesión vía /api/me:
 *  - No autenticado  → formulario de login (usuario + contraseña).
 *  - Rol `sales`     → se redirige al CRM.
 *  - Rol `admin`     → renderiza el panel ARS.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "admin" | "locked">("checking");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function check() {
    try {
      const me = await api<Me>("/api/me");
      if (!me.authenticated) {
        setState("locked");
      } else if (me.role === "admin") {
        setState("admin");
      } else {
        window.location.href = "/crm";
      }
    } catch {
      setState("locked");
    }
  }

  useEffect(() => {
    check();
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
      if (res.role === "admin") {
        setState("admin");
      } else {
        window.location.href = "/crm";
      }
    } catch (e) {
      setError((e as Error).message || "Usuario o contraseña incorrectos");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking") {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Cargando…
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <form onSubmit={login} className="card w-80 space-y-4">
          <div>
            <div className="text-lg font-bold text-brand">DestinoPropiedades</div>
            <div className="text-sm text-slate-500">Acceso ventas</div>
          </div>
          <div>
            <label className="label">Usuario</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

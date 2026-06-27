"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

/** Verifica acceso al cargar; si el dashboard está protegido y no hay sesión,
 *  muestra un prompt de contraseña. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "ok" | "locked">("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function check() {
    try {
      await api("/api/status");
      setState("ok");
    } catch (e) {
      if ((e as { status?: number }).status === 401) setState("locked");
      else setState("ok"); // otros errores no bloquean el render
    }
  }

  useEffect(() => {
    check();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setState("ok");
    } catch {
      setError("Contraseña incorrecta");
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
            <div className="text-lg font-bold text-brand">Destino</div>
            <div className="text-sm text-slate-500">
              Acceso al panel de control
            </div>
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full">Entrar</button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

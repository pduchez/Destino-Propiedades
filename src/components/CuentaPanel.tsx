"use client";

import { useState } from "react";
import { api } from "@/lib/client";

/** Tarjeta de cuenta: cambiar contraseña + cerrar sesión. Reutilizable por
 *  el panel ARS (Director1) y el CRM (usuarios de ventas). */
export default function CuentaPanel({ username }: { username?: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (next !== confirm) {
      setErr("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/account/password", {
        method: "POST",
        body: JSON.stringify({ current, next }),
      });
      setMsg("Contraseña actualizada ✓");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await api("/api/auth", { method: "DELETE" }).catch(() => {});
    window.location.href = "/acceso-ventas";
  }

  return (
    <div className="card max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mi cuenta</h2>
        {username && (
          <span className="badge bg-slate-100 text-slate-600">{username}</span>
        )}
      </div>
      <form onSubmit={change} className="space-y-3">
        <div>
          <label className="label">Contraseña actual</label>
          <input
            type="password"
            className="input"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="label">Nueva contraseña</label>
          <input
            type="password"
            className="input"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirmar nueva contraseña</label>
          <input
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </form>
      <div className="border-t border-slate-200 pt-3">
        <button onClick={logout} className="btn-secondary">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

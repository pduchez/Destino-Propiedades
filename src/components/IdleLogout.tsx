"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/client";

/**
 * Cierra la sesión tras un periodo de inactividad (por defecto 2 h). Cualquier
 * interacción (teclado, mouse, toque, scroll) reinicia el contador. Al expirar,
 * borra la cookie y manda al login. Complementa a la cookie de sesión (que ya
 * muere al cerrar el navegador).
 */
export default function IdleLogout({ minutes = 120 }: { minutes?: number }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ms = minutes * 60 * 1000;
    async function logout() {
      await api("/api/auth", { method: "DELETE" }).catch(() => {});
      window.location.href = "/inicio";
    }
    function reset() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(logout, ms);
    }
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [minutes]);

  return null;
}

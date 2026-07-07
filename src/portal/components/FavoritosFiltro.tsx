"use client";

import { useEffect } from "react";

// Muestra solo las tarjetas marcadas con ❤️ (localStorage). Opera sobre las
// tarjetas ya renderizadas en el servidor. Portado del sitio Astro.
export function FavoritosFiltro() {
  useEffect(() => {
    const grilla = document.getElementById("fav-grilla");
    const vacio = document.getElementById("fav-vacio");
    const intro = document.getElementById("fav-intro");
    if (!grilla) return;

    const favoritos = (): string[] => {
      try {
        const v = JSON.parse(localStorage.getItem("destino:favoritos") || "[]");
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    };
    const render = () => {
      const favs = favoritos();
      let visibles = 0;
      grilla.querySelectorAll<HTMLElement>("[data-card]").forEach((card) => {
        const slug = card.querySelector("[data-fav-slug]")?.getAttribute("data-fav-slug");
        const on = !!slug && favs.includes(slug);
        card.style.display = on ? "" : "none";
        if (on) visibles++;
      });
      const hay = visibles > 0;
      grilla.classList.toggle("hidden", !hay);
      vacio?.classList.toggle("hidden", hay);
      if (intro) intro.textContent = hay ? `${visibles} ${visibles === 1 ? "proyecto guardado" : "proyectos guardados"} en este dispositivo.` : "";
    };
    render();
    document.addEventListener("favoritos:cambio", render);
    return () => document.removeEventListener("favoritos:cambio", render);
  }, []);
  return null;
}

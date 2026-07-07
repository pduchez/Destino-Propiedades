"use client";

import { useEffect } from "react";

// Filtro/orden/paginación del listado (isla de interactividad). Opera sobre
// las tarjetas ya renderizadas en el servidor ([data-card]) leyendo sus
// data-*; lee ?q=&tipo=&zona=&precio=&orden= de la URL. Portado del sitio Astro.
export function FiltrosProyectos() {
  useEffect(() => {
    const PAGINA_TAM = 9;
    const grilla = document.getElementById("grilla");
    if (!grilla) return;
    const cards = Array.from(grilla.querySelectorAll<HTMLElement>("[data-card]"));
    const contador = document.getElementById("contador")!;
    const sinResultados = document.getElementById("sin-resultados")!;
    const paginacion = document.getElementById("paginacion")!;
    const fQ = document.getElementById("f-q") as HTMLInputElement;
    const fTipo = document.getElementById("f-tipo") as HTMLSelectElement;
    const fZona = document.getElementById("f-zona") as HTMLSelectElement;
    const fPrecio = document.getElementById("f-precio") as HTMLSelectElement;
    const fOrden = document.getElementById("f-orden") as HTMLSelectElement;
    const limpiar = document.getElementById("limpiar");
    let paginaActual = 1;

    const params = new URLSearchParams(location.search);
    if (params.get("q")) fQ.value = params.get("q")!;
    if (params.get("tipo")) fTipo.value = params.get("tipo")!;
    if (params.get("zona")) fZona.value = params.get("zona")!.toLowerCase();
    if (params.get("precio")) fPrecio.value = params.get("precio")!;
    if (params.get("orden")) fOrden.value = params.get("orden")!;

    const num = (v: string | null): number | null => (v === "" || v === null ? null : Number(v));

    const pasaFiltros = (card: HTMLElement): boolean => {
      const q = fQ.value.trim().toLowerCase();
      if (q) {
        const texto = `${card.dataset.nombre} ${card.dataset.municipio} ${card.dataset.departamento}`;
        if (!texto.includes(q)) return false;
      }
      if (fTipo.value && card.dataset.tipo !== fTipo.value) return false;
      if (fZona.value && card.dataset.departamento !== fZona.value) return false;
      if (fPrecio.value) {
        const precio = num(card.dataset.precio ?? "");
        if (precio === null) return false;
        const [min, max] = fPrecio.value.split("-");
        if (min && precio < Number(min)) return false;
        if (max && precio > Number(max)) return false;
      }
      return true;
    };

    const ordenar = (lista: HTMLElement[]): HTMLElement[] => {
      const orden = fOrden.value;
      if (!orden) return lista;
      const copia = [...lista];
      if (orden === "precio-asc" || orden === "precio-desc") {
        copia.sort((a, b) => {
          const pa = num(a.dataset.precio ?? "") ?? Infinity;
          const pb = num(b.dataset.precio ?? "") ?? Infinity;
          return orden === "precio-asc" ? pa - pb : pb - pa;
        });
      } else if (orden === "area-desc") {
        copia.sort((a, b) => (num(b.dataset.area ?? "") ?? 0) - (num(a.dataset.area ?? "") ?? 0));
      }
      return copia;
    };

    const actualizarURL = () => {
      const p = new URLSearchParams();
      if (fQ.value.trim()) p.set("q", fQ.value.trim());
      if (fTipo.value) p.set("tipo", fTipo.value);
      if (fZona.value) p.set("zona", fZona.value);
      if (fPrecio.value) p.set("precio", fPrecio.value);
      if (fOrden.value) p.set("orden", fOrden.value);
      const qs = p.toString();
      history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
    };

    const renderPaginacion = (total: number) => {
      paginacion.innerHTML = "";
      if (total <= 1) {
        paginacion.classList.add("hidden");
        return;
      }
      paginacion.classList.remove("hidden");
      for (let i = 1; i <= total; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = String(i);
        b.className =
          "h-9 w-9 rounded-full text-sm font-semibold transition-colors " +
          (i === paginaActual ? "bg-navy text-cream" : "bg-surface border border-line hover:bg-navy/5");
        b.addEventListener("click", () => {
          paginaActual = i;
          render();
          document.getElementById("grilla")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        paginacion.appendChild(b);
      }
    };

    function render() {
      const visibles = ordenar(cards.filter(pasaFiltros));
      const totalLotes = visibles.reduce((s, c) => s + (Number(c.dataset.disp) || 0), 0);
      const nProy = visibles.length;
      contador.textContent =
        nProy === 0 ? "" : `${nProy} ${nProy === 1 ? "proyecto" : "proyectos"}` + (totalLotes > 0 ? ` · ${totalLotes} lotes disponibles` : "");
      sinResultados.classList.toggle("hidden", nProy > 0);

      const totalPaginas = Math.ceil(nProy / PAGINA_TAM) || 1;
      if (paginaActual > totalPaginas) paginaActual = 1;
      const inicio = (paginaActual - 1) * PAGINA_TAM;
      const fin = inicio + PAGINA_TAM;
      cards.forEach((c) => (c.style.display = "none"));
      visibles.forEach((c, i) => {
        grilla!.appendChild(c);
        c.style.display = i >= inicio && i < fin ? "" : "none";
      });
      renderPaginacion(totalPaginas);
      actualizarURL();
    }

    const onChange = () => {
      paginaActual = 1;
      render();
    };
    [fTipo, fZona, fPrecio, fOrden].forEach((el) => el.addEventListener("change", onChange));
    fQ.addEventListener("input", onChange);
    limpiar?.addEventListener("click", () => {
      fQ.value = "";
      fTipo.value = "";
      fZona.value = "";
      fPrecio.value = "";
      fOrden.value = "";
      paginaActual = 1;
      render();
    });
    render();
  }, []);

  return null;
}

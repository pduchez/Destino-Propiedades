"use client";

import { useEffect } from "react";
import Script from "next/script";

/* ── Medición (opcional, apagada por defecto) ───────────────────────────────
   Instala el listener de eventos de conversión: cualquier elemento con
   data-evento="nombre" empuja a dataLayer al hacer clic. Carga GTM/GA4 solo
   si están definidas las variables NEXT_PUBLIC_GTM_CONTAINER_ID / _GA4. */
export function Medicion() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  useEffect(() => {
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as HTMLElement)?.closest?.("[data-evento]");
      if (!el) return;
      const evento = el.getAttribute("data-evento");
      if (!evento) return;
      w.dataLayer!.push({ event: evento, proyecto: el.getAttribute("data-proyecto") || undefined });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (gtmId) {
    return (
      <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</Script>
    );
  }
  if (ga4Id) {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});`}</Script>
      </>
    );
  }
  return null;
}

/* ── Favoritos (❤️) con localStorage, sin backend ──────────────────────────── */
export function FavoritosScript() {
  useEffect(() => {
    const CLAVE = "destino:favoritos";
    const leer = (): string[] => {
      try {
        const v = JSON.parse(localStorage.getItem(CLAVE) || "[]");
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    };
    const guardar = (l: string[]) => localStorage.setItem(CLAVE, JSON.stringify(l));

    const pintar = (btn: Element, activo: boolean) => {
      btn.setAttribute("aria-pressed", activo ? "true" : "false");
      const icon = btn.querySelector(".fav-icon");
      if (icon) icon.setAttribute("fill", activo ? "currentColor" : "none");
      btn.classList.toggle("text-[#e23b3b]", activo);
      btn.classList.toggle("text-navy", !activo);
    };
    const contadores = () => {
      const n = leer().length;
      document.querySelectorAll("[data-fav-count]").forEach((el) => {
        el.textContent = String(n);
        el.classList.toggle("hidden", n === 0);
      });
    };
    const sincronizar = () => {
      const favs = leer();
      document.querySelectorAll("[data-fav]").forEach((btn) =>
        pintar(btn, favs.includes(btn.getAttribute("data-fav-slug") || "")),
      );
      contadores();
    };
    const alternar = (slug: string) => {
      const favs = leer();
      const i = favs.indexOf(slug);
      if (i >= 0) favs.splice(i, 1);
      else favs.push(slug);
      guardar(favs);
      sincronizar();
      document.dispatchEvent(new CustomEvent("favoritos:cambio"));
    };
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement)?.closest?.("[data-fav]");
      if (!btn) return;
      e.preventDefault();
      alternar(btn.getAttribute("data-fav-slug") || "");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === CLAVE) sincronizar();
    };
    document.addEventListener("click", onClick);
    window.addEventListener("storage", onStorage);
    (window as unknown as { DestinoFavoritos?: unknown }).DestinoFavoritos = { leer };
    sincronizar();
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return null;
}

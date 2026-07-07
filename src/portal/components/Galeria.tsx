"use client";

import { useEffect, useState } from "react";
import { withBase } from "../lib/rutas";

export function Galeria({ fotos: fotosRaw, nombreProyecto }: { fotos: string[]; nombreProyecto: string }) {
  const fotos = fotosRaw.map((f) => withBase(f));
  const total = fotos.length;
  const [actual, setActual] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const mostrar = (i: number) => setActual((i + total) % total);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
      if (e.key === "ArrowLeft") mostrar(actual - 1);
      if (e.key === "ArrowRight") mostrar(actual + 1);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, actual]);

  if (total === 0) return null;

  return (
    <div className="galeria">
      <button type="button" className="relative block w-full overflow-hidden rounded-xl bg-navy/10 aspect-[3/2]" onClick={() => setAbierto(true)} aria-label="Ver foto a pantalla completa">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotos[actual]} alt={`${nombreProyecto} — foto ${actual + 1} de ${total}`} className="h-full w-full object-cover" width={1600} height={1067} />
        <span className="absolute bottom-3 right-3 rounded-full bg-navy/80 px-3 py-1 text-xs font-semibold text-cream">{actual + 1} / {total}</span>
      </button>

      {total > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {fotos.map((foto, i) => (
            <button key={foto} type="button" onClick={() => mostrar(i)} aria-label={`Ver foto ${i + 1}`} className={`overflow-hidden rounded-lg ring-2 aspect-[3/2] ${i === actual ? "ring-sand" : "ring-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt={`${nombreProyecto} — miniatura ${i + 1}`} className="h-full w-full object-cover" loading="lazy" width={400} height={267} />
            </button>
          ))}
        </div>
      )}

      {abierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Galería a pantalla completa" onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}>
          <button type="button" className="absolute right-4 top-4 p-2 text-white/80 hover:text-white" onClick={() => setAbierto(false)} aria-label="Cerrar">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button type="button" className="absolute left-2 sm:left-6 p-2 text-white/80 hover:text-white" onClick={() => mostrar(actual - 1)} aria-label="Foto anterior">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotos[actual]} alt={nombreProyecto} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" />
          <button type="button" className="absolute right-2 sm:right-6 p-2 text-white/80 hover:text-white" onClick={() => mostrar(actual + 1)} aria-label="Foto siguiente">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1 text-sm text-white">{actual + 1} / {total}</span>
        </div>
      )}
    </div>
  );
}

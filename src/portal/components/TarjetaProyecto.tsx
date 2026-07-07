import Link from "next/link";
import type { Proyecto } from "../data/proyectos";
import { PlaceholderFoto } from "./ui";
import { labelTipo, labelEstado, etiquetaUnidad } from "../lib/formato";
import { rangoArea, lotesDisponibles } from "../lib/relaciones";
import { withBase } from "../lib/rutas";

export function TarjetaProyecto({ proyecto }: { proyecto: Proyecto }) {
  const rango = rangoArea(proyecto);
  const disponibles = lotesDisponibles(proyecto);
  const areaTexto = rango
    ? rango.min === rango.max
      ? `${rango.min} ${etiquetaUnidad(rango.unidad)}`
      : `${rango.min}–${rango.max} ${etiquetaUnidad(rango.unidad)}`
    : null;

  return (
    <article
      className="tarjeta group flex flex-col bg-surface rounded-2xl overflow-hidden border border-line shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5 transition-all duration-300"
      data-card
      data-nombre={proyecto.nombre.toLowerCase()}
      data-tipo={proyecto.tipo}
      data-departamento={proyecto.departamento.toLowerCase()}
      data-municipio={proyecto.municipio.toLowerCase()}
      data-estado={proyecto.estado}
      data-precio={proyecto.precioDesde ?? ""}
      data-area={rango ? rango.min : ""}
      data-disp={disponibles}
    >
      <div className="relative h-48 overflow-hidden">
        <Link href={`/proyectos/${proyecto.slug}`} className="block h-full">
          {proyecto.galeria.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withBase(proyecto.galeria[0])} alt={`${proyecto.nombre}, ${proyecto.municipio}, ${proyecto.departamento}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" width={400} height={267} />
          ) : (
            <PlaceholderFoto nombre={proyecto.nombre} />
          )}
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy/50 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-cream bg-navy/85 backdrop-blur px-2.5 py-1 rounded-full">{labelTipo[proyecto.tipo]}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-navy bg-cream/90 backdrop-blur px-2.5 py-1 rounded-full">{labelEstado[proyecto.estado]}</span>
        </div>
        <button type="button" className="fav-btn absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white hover:scale-105 transition-all text-navy" data-fav data-fav-slug={proyecto.slug} aria-label={`Guardar ${proyecto.nombre} en favoritos`} aria-pressed="false">
          <svg className="fav-icon h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/proyectos/${proyecto.slug}`} className="block">
          <h3 className="font-display text-xl leading-tight group-hover:text-navy-light transition-colors">{proyecto.nombre}</h3>
          <p className="text-sm text-ink/55 mt-1 flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-sand-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            {proyecto.municipio}, {proyecto.departamento}
          </p>
        </Link>

        <p className="text-navy font-display font-semibold text-lg mt-3">
          {proyecto.etiquetaPrecio}
          <span className="block h-0.5 w-8 bg-sand mt-1.5 rounded-full" />
        </p>

        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/65 border-t border-line pt-3">
          {areaTexto && (
            <li className="flex items-center gap-1">
              <svg className="h-4 w-4 text-sand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" /></svg>
              {areaTexto}
            </li>
          )}
          <li className="flex items-center gap-1">
            <svg className="h-4 w-4 text-sand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10" /></svg>
            {labelTipo[proyecto.tipo]}
          </li>
          {proyecto.servicios.length > 0 && (
            <li className="flex items-center gap-1">
              <svg className="h-4 w-4 text-sand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {proyecto.servicios.length} servicios
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}

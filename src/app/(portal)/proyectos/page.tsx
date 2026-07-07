import type { Metadata } from "next";
import { proyectos } from "@/portal/data/proyectos";
import { sitio } from "@/portal/data/sitio";
import { labelTipo } from "@/portal/lib/formato";
import { TarjetaProyecto } from "@/portal/components/TarjetaProyecto";
import { FiltrosProyectos } from "@/portal/components/FiltrosProyectos";

export const metadata: Metadata = {
  title: `Proyectos — ${sitio.marcaPlataforma}`,
  description:
    "Buscá y filtrá lotificaciones disponibles en El Salvador por zona, tipo y precio. Información clara y contacto directo por WhatsApp.",
};

export default function Listado() {
  const tiposDisponibles = Array.from(new Set(proyectos.map((p) => p.tipo)));
  const departamentosDisponibles = Array.from(new Set(proyectos.map((p) => p.departamento))).sort();
  const inputCls = "w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:border-sand bg-surface";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide text-navy/50 mb-1";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl sm:text-4xl mb-1">Proyectos</h1>
      <p className="text-navy/70 mb-6">Lotificaciones disponibles en El Salvador, en alianza con {sitio.desarrolladorActual.nombre}.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-surface border border-line rounded-2xl p-4 mb-5 shadow-[var(--shadow-card)]">
        <div>
          <label htmlFor="f-q" className={labelCls}>Buscar</label>
          <input id="f-q" type="text" placeholder="Zona, municipio o nombre" className={inputCls} />
        </div>
        <div>
          <label htmlFor="f-tipo" className={labelCls}>Tipo</label>
          <select id="f-tipo" className={inputCls}>
            <option value="">Todos</option>
            {tiposDisponibles.map((t) => <option key={t} value={t}>{labelTipo[t]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-zona" className={labelCls}>Zona</label>
          <select id="f-zona" className={inputCls}>
            <option value="">Todas</option>
            {departamentosDisponibles.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-precio" className={labelCls}>Precio</label>
          <select id="f-precio" className={inputCls}>
            <option value="">Cualquiera</option>
            <option value="0-30000">Hasta $30,000</option>
            <option value="30000-50000">$30,000 – $50,000</option>
            <option value="50000-">Más de $50,000</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p id="contador" className="text-sm text-navy/70" aria-live="polite" />
        <div className="flex items-center gap-2">
          <label htmlFor="f-orden" className="text-sm text-navy/60">Ordenar:</label>
          <select id="f-orden" className="rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:border-sand bg-surface">
            <option value="">Destacados</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="area-desc">Área: mayor primero</option>
          </select>
        </div>
      </div>

      <div id="grilla" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {proyectos.map((p) => <TarjetaProyecto key={p.slug} proyecto={p} />)}
      </div>

      <p id="sin-resultados" className="hidden text-center text-navy/60 py-12">
        No encontramos proyectos con esos filtros.
        <button id="limpiar" type="button" className="underline text-navy hover:text-sand ml-1">Limpiar filtros</button>
      </p>

      <nav id="paginacion" className="hidden mt-8 flex justify-center gap-2" aria-label="Paginación" />

      <FiltrosProyectos />
    </section>
  );
}

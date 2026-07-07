import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { proyectos } from "@/portal/data/proyectos";
import { sitio } from "@/portal/data/sitio";
import { linkLlamar, linkWhatsapp } from "@/portal/lib/whatsapp";
import { formatoPrecio, formatoArea, labelTipo, labelLotesDe, labelEstado } from "@/portal/lib/formato";
import { rangoArea, lotesDisponibles, zonaDeProyecto } from "@/portal/lib/relaciones";
import { proyectoJsonLd, breadcrumbJsonLd } from "@/portal/lib/seo";
import { SITE } from "@/portal/lib/site";
import { Galeria } from "@/portal/components/Galeria";
import { PlaceholderFoto, MigasDePan, JsonLd } from "@/portal/components/ui";

export const dynamicParams = false;
export function generateStaticParams() {
  return proyectos.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = proyectos.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: p.seo.titulo,
    description: p.seo.metaDescripcion,
    openGraph: {
      title: p.seo.titulo,
      description: p.seo.metaDescripcion,
      images: [p.seo.ogImage],
      type: "article",
    },
  };
}

export default function Ficha({ params }: { params: { slug: string } }) {
  const proyecto = proyectos.find((p) => p.slug === params.slug);
  if (!proyecto) notFound();

  const whatsappUrl = linkWhatsapp(sitio.contacto.whatsapp, proyecto.whatsappMensaje);
  const telUrl = linkLlamar(sitio.contacto.telefono);
  const rango = rangoArea(proyecto);
  const disponibles = lotesDisponibles(proyecto);
  const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${proyecto.ubicacion.lat},${proyecto.ubicacion.lng}`;
  const zona = zonaDeProyecto(proyecto);
  const migas = [
    { label: "Inicio", href: "/" },
    { label: labelLotesDe[proyecto.tipo], href: `/proyectos?tipo=${proyecto.tipo}` },
    { label: zona ? zona.nombre : proyecto.departamento, href: zona ? `/${zona.slug}` : undefined },
    { label: proyecto.nombre },
  ];
  const datosClave = [
    { label: "Ubicación", valor: `${proyecto.municipio}, ${proyecto.departamento}` },
    { label: "Tipo", valor: labelTipo[proyecto.tipo] },
    { label: "Estado", valor: labelEstado[proyecto.estado] },
    ...(rango ? [{ label: "Área de lotes", valor: rango.min === rango.max ? formatoArea(rango.min, rango.unidad) : `${rango.min}–${formatoArea(rango.max, rango.unidad)}` }] : []),
    ...(disponibles > 0 ? [{ label: "Lotes disponibles", valor: String(disponibles) }] : []),
  ];

  return (
    <>
      <JsonLd data={proyectoJsonLd(proyecto, SITE)} />
      <JsonLd data={breadcrumbJsonLd(migas, SITE)} />

      <div className="mx-auto max-w-6xl px-4 py-6"><MigasDePan items={migas} /></div>

      <div className="mx-auto max-w-6xl px-4 pb-12 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <header className="mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cream bg-navy px-3 py-1.5 rounded-full">En venta · {labelEstado[proyecto.estado]}</span>
            <h1 className="font-display text-3xl sm:text-4xl mt-3">{proyecto.nombre}</h1>
            <p className="text-navy/60 mt-1 flex items-center gap-1.5">
              <svg className="h-4 w-4 text-sand-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {proyecto.municipio}, {proyecto.departamento}
            </p>
            <p className="text-2xl font-display font-bold text-navy mt-3 inline-flex flex-col">
              {proyecto.etiquetaPrecio}
              <span className="h-0.5 w-10 bg-sand mt-1.5 rounded-full" />
            </p>
          </header>

          {proyecto.galeria.length > 0 ? (
            <Galeria fotos={proyecto.galeria} nombreProyecto={proyecto.nombre} />
          ) : (
            <div className="aspect-[3/2] w-full overflow-hidden rounded-xl"><PlaceholderFoto nombre={proyecto.nombre} detalle /></div>
          )}

          {proyecto.vistas360 && proyecto.vistas360.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-2xl mb-3">Recorrido 360°</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {proyecto.vistas360.map((v) => (
                  <figure key={v.url} className="rounded-xl overflow-hidden border border-navy/10 bg-black">
                    <div className="aspect-video">
                      <iframe src={v.url} title={`Vista 360° de ${proyecto.nombre}: ${v.titulo}`} loading="lazy" allow="accelerometer; gyroscope; fullscreen; xr-spatial-tracking" allowFullScreen className="h-full w-full border-0" />
                    </div>
                    <figcaption className="bg-white px-3 py-2 text-sm font-semibold text-navy">{v.titulo}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {datosClave.map((d) => (
              <div key={d.label} className="rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs uppercase tracking-wider text-navy/45">{d.label}</p>
                <p className="font-semibold mt-1">{d.valor}</p>
              </div>
            ))}
          </section>

          <section className="mt-8">
            <h2 className="font-display text-2xl mb-2">Sobre el proyecto</h2>
            <p className="text-navy/80 leading-relaxed">{proyecto.descripcion}</p>
          </section>

          {proyecto.tiposDeLote.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-2xl mb-3">Tipos de lote</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {proyecto.tiposDeLote.map((t) => (
                  <div key={t.nombre} className="rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
                    <p className="font-semibold">{t.nombre}</p>
                    <p className="text-sm text-navy/60 mt-1">{formatoArea(t.area, t.unidad)}</p>
                    <p className="text-navy font-display font-bold mt-2">{t.precio > 0 ? formatoPrecio(t.precio) : "Consultar"}</p>
                    {t.disponibilidad > 0 && <p className="text-xs text-navy/50 mt-1">{t.disponibilidad} disponibles</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {proyecto.servicios.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-2xl mb-3">Servicios y factibilidades</h2>
              <ul className="flex flex-wrap gap-2">
                {proyecto.servicios.map((s) => <li key={s} className="rounded-full bg-navy/5 border border-navy/10 px-3 py-1 text-sm">{s}</li>)}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-2xl mb-3">Ubicación</h2>
            <p className="text-navy/70 mb-2">{proyecto.municipio}, {proyecto.departamento}, El Salvador.</p>
            <a href={mapaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-navy font-semibold underline hover:text-sand transition-colors">Ver ubicación en Google Maps</a>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-sm text-navy/60">Precio</p>
            <p className="text-2xl font-display font-bold text-navy">{proyecto.etiquetaPrecio}</p>
            <p className="mt-4 text-sm text-navy/70">Escribinos y un asesor te responde con disponibilidad, fotos y formas de pago de <strong>{proyecto.nombre}</strong>.</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-evento="click_whatsapp" data-proyecto={proyecto.slug} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-semibold text-white hover:opacity-90 transition-opacity">
              <svg viewBox="0 0 32 32" className="h-5 w-5 fill-white"><path d="M16.04 4C9.4 4 4 9.36 4 15.96c0 2.5.74 4.83 2.02 6.79L4 28l5.43-1.97a12.1 12.1 0 0 0 6.61 1.93h.01c6.64 0 12.04-5.36 12.04-11.96C28.09 9.36 22.69 4 16.04 4Z" /></svg>
              Escribir por WhatsApp
            </a>
            <a href={telUrl} className="mt-3 flex items-center justify-center gap-2 rounded-full border border-navy/20 px-5 py-3 font-semibold text-navy hover:bg-navy/5 transition-colors">Llamar ahora</a>
            <button type="button" className="fav-btn text-navy mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-navy/20 px-5 py-3 font-semibold hover:bg-navy/5 transition-colors" data-fav data-fav-slug={proyecto.slug} aria-pressed="false">
              <svg className="fav-icon h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              <span>Guardar en favoritos</span>
            </button>
            <p className="mt-4 text-xs text-navy/50 text-center">En alianza con {sitio.desarrolladorActual.nombre}.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

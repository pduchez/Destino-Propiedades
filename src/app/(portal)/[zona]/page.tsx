import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { zonas } from "@/portal/data/zonas";
import { sitio } from "@/portal/data/sitio";
import { linkWhatsapp } from "@/portal/lib/whatsapp";
import { faqJsonLd, breadcrumbJsonLd, zonaJsonLd } from "@/portal/lib/seo";
import { SITE } from "@/portal/lib/site";
import { proyectosDeZona } from "@/portal/lib/relaciones";
import { TarjetaProyecto } from "@/portal/components/TarjetaProyecto";
import { MigasDePan, JsonLd } from "@/portal/components/ui";

export const dynamicParams = false;
export function generateStaticParams() {
  return zonas.map((z) => ({ zona: z.slug }));
}
export function generateMetadata({ params }: { params: { zona: string } }): Metadata {
  const z = zonas.find((x) => x.slug === params.zona);
  if (!z) return {};
  return {
    title: z.titulo,
    description: z.metaDescripcion,
    openGraph: { title: z.titulo, description: z.metaDescripcion, images: [`/assets/og/zona-${z.slug}.jpg`] },
  };
}

export default function ZonaPage({ params }: { params: { zona: string } }) {
  const zona = zonas.find((z) => z.slug === params.zona);
  if (!zona) notFound();

  const proyectosZona = proyectosDeZona(zona);
  const mensaje = `Hola, me interesan los lotes en ${zona.departamento} que vi en ${sitio.marcaPlataforma}.`;
  const whatsappUrl = linkWhatsapp(sitio.contacto.whatsapp, mensaje);
  const migas = [
    { label: "Inicio", href: "/" },
    { label: "Proyectos", href: "/proyectos" },
    { label: zona.nombre },
  ];

  return (
    <>
      <JsonLd data={zonaJsonLd(zona, SITE)} />
      <JsonLd data={faqJsonLd(zona.faq)} />
      <JsonLd data={breadcrumbJsonLd(migas, SITE)} />

      <div className="mx-auto max-w-5xl px-4 py-6"><MigasDePan items={migas} /></div>

      <article className="mx-auto max-w-5xl px-4 pb-12">
        <h1 className="font-display text-3xl sm:text-4xl mb-4">{zona.nombre}</h1>
        <div className="space-y-4 text-navy/80 leading-relaxed max-w-3xl">
          <p>{zona.descripcion}</p>
          <p>{zona.contexto}</p>
        </div>

        {zona.ventajas.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl mb-3">Ventajas de la zona</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {zona.ventajas.map((v) => (
                <li key={v} className="flex items-start gap-2 text-navy/80">
                  <svg className="h-5 w-5 text-sand shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {v}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl mb-4">{proyectosZona.length > 0 ? `Proyectos en ${zona.departamento}` : `Próximamente en ${zona.departamento}`}</h2>
          {proyectosZona.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {proyectosZona.map((p) => <TarjetaProyecto key={p.slug} proyecto={p} />)}
            </div>
          ) : (
            <p className="text-navy/70">Aún no tenemos proyectos publicados en esta zona. Escribinos por WhatsApp y te avisamos apenas haya disponibilidad.</p>
          )}
        </section>

        {zona.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl mb-4">Preguntas frecuentes</h2>
            <div className="space-y-3">
              {zona.faq.map((f) => (
                <details key={f.pregunta} className="group rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between gap-2">
                    {f.pregunta}
                    <span className="text-sand transition-transform group-open:rotate-180">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </summary>
                  <p className="mt-2 text-navy/75 leading-relaxed">{f.respuesta}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-2xl bg-navy text-cream p-8 text-center shadow-[var(--shadow-card)]">
          <p className="font-display text-2xl mb-2">¿Te interesa esta zona?</p>
          <p className="text-cream/80 mb-4 max-w-xl mx-auto">Escribinos y un asesor te comparte disponibilidad, precios y formas de pago de los proyectos en {zona.departamento}.</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-evento="click_whatsapp" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity">Escribir por WhatsApp</a>
        </section>
      </article>
    </>
  );
}

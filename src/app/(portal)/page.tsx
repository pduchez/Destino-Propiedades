import Link from "next/link";
import type { Metadata } from "next";
import { sitio } from "@/portal/data/sitio";
import { proyectos } from "@/portal/data/proyectos";
import { linkWhatsapp } from "@/portal/lib/whatsapp";
import { labelTipo } from "@/portal/lib/formato";
import { websiteJsonLd, organizationJsonLd } from "@/portal/lib/seo";
import { SITE } from "@/portal/lib/site";
import { TarjetaProyecto } from "@/portal/components/TarjetaProyecto";
import { JsonLd } from "@/portal/components/ui";

export const metadata: Metadata = {
  title: `${sitio.marcaPlataforma} — Lotes en El Salvador`,
  description:
    "Encontrá lotes en lotificaciones confiables en El Salvador. Confianza, datos claros y contacto directo por WhatsApp.",
};

const Check = ({ className = "h-5 w-5 text-sand shrink-0" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 1.5 1.5 3-3.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const Flecha = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function Home() {
  const mensaje = `Hola, quisiera más información sobre los proyectos de ${sitio.marcaPlataforma}.`;
  const whatsappUrl = linkWhatsapp(sitio.contacto.whatsapp, mensaje);
  const tiposPresentes = Array.from(new Set(proyectos.map((p) => p.tipo)));
  const departamentosPresentes = Array.from(new Set(proyectos.map((p) => p.departamento))).sort();
  const burbujas = [
    ...tiposPresentes.map((t) => ({ label: labelTipo[t], href: `/proyectos?tipo=${t}` })),
    ...departamentosPresentes.map((d) => ({ label: d, href: `/proyectos?zona=${encodeURIComponent(d.toLowerCase())}` })),
  ];
  const destacados = (proyectos.some((p) => p.destacado) ? proyectos.filter((p) => p.destacado) : proyectos).slice(0, 3);

  return (
    <>
      <JsonLd data={websiteJsonLd(SITE)} />
      <JsonLd data={organizationJsonLd(SITE)} />

      {/* Hero con foto real (golfo de Fonseca) */}
      <section className="relative text-cream overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/proyectos/condado-del-golfo/panoramica-golfo.webp" alt="Vista aérea de la costa de El Salvador" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/75 to-navy-deep/90" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 text-center">
          <h1 className="font-display text-3xl sm:text-5xl leading-tight max-w-3xl mx-auto">
            Tu propiedad en El Salvador, con confianza y acompañamiento
          </h1>
          <p className="mt-5 text-base sm:text-lg text-cream/80 max-w-2xl mx-auto">
            Conectamos a los salvadoreños —dentro y fuera del país— con lotes y proyectos confiables. Te asesoramos en cada paso del proceso y, con nuestra red de contactos en El Salvador, armamos soluciones a tu medida. Información clara, sin sorpresas, y un asesor real siempre a un mensaje de distancia.
          </p>

          <form action="/proyectos" method="get" className="mt-8 mx-auto max-w-3xl flex flex-col sm:flex-row gap-2 bg-white/95 rounded-2xl sm:rounded-full p-2 shadow-lg">
            <div className="relative flex-1">
              <label htmlFor="h-tipo" className="sr-only">Tipo de lotificación</label>
              <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10" /></svg>
              <select id="h-tipo" name="tipo" defaultValue="" className="w-full appearance-none bg-transparent text-navy font-medium pl-11 pr-9 py-3 rounded-full focus:outline-none cursor-pointer">
                <option value="">Todo tipo de lote</option>
                {tiposPresentes.map((t) => <option key={t} value={t}>{labelTipo[t]}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
            <span className="hidden sm:block w-px bg-navy/10 my-2" />
            <div className="relative flex-1">
              <label htmlFor="h-zona" className="sr-only">Departamento</label>
              <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <select id="h-zona" name="zona" defaultValue="" className="w-full appearance-none bg-transparent text-navy font-medium pl-11 pr-9 py-3 rounded-full focus:outline-none cursor-pointer">
                <option value="">Todos los departamentos</option>
                {departamentosPresentes.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
            <button type="submit" className="flex items-center justify-center gap-2 bg-sand text-navy font-semibold px-7 py-3 rounded-full hover:bg-sand-light transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" /></svg>
              Buscar
            </button>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {burbujas.map((b) => (
              <Link key={b.href} href={b.href} className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/5 px-4 py-2 text-sm text-cream hover:bg-cream/15 hover:border-sand transition-colors">
                {b.label}
              </Link>
            ))}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center text-sm">
            <Link href="/proyectos" className="underline hover:text-sand transition-colors">Ver todos los proyectos</Link>
            <span className="hidden sm:inline text-cream/40">·</span>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-sand transition-colors">O escribinos por WhatsApp</a>
          </div>
        </div>
      </section>

      {/* Destacados */}
      {destacados.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl">Proyectos destacados</h2>
              <p className="text-navy/70 mt-1">Una selección de lotificaciones para conocer hoy.</p>
            </div>
            <Link href="/proyectos" className="text-navy font-semibold underline hover:text-sand transition-colors whitespace-nowrap">Ver todos los proyectos</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destacados.map((p) => <TarjetaProyecto key={p.slug} proyecto={p} />)}
          </div>
        </section>
      )}

      {/* Bloques de audiencia */}
      <section className="bg-surface-soft py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl sm:text-3xl">¿Desde dónde comprás?</h2>
            <p className="text-navy/70 mt-2">Cada situación es distinta. Te armamos una solución a la medida y coordinamos cada gestión con nuestra red de aliados en El Salvador.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl bg-navy text-cream p-8 shadow-[var(--shadow-card)] flex flex-col">
              <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sand/10" />
              <svg className="h-9 w-9 text-sand mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              <h3 className="font-display text-xl mb-1">Comprás desde el exterior</h3>
              <p className="text-sm text-cream/70 mb-4">Invertí en tu tierra sin tener que viajar para empezar, con respaldo en cada paso.</p>
              <ul className="space-y-2.5 text-sm text-cream/85 flex-1">
                <li className="flex gap-2.5"><Check /><span>Compra a distancia: te orientamos con el poder legalizado/apostillado o la compra a nombre de un familiar de confianza.</span></li>
                <li className="flex gap-2.5"><Check /><span>Verificación legal del lote (estudio registral y linderos) antes de que pongás un dólar.</span></li>
                <li className="flex gap-2.5"><Check /><span>Fotos, recorrido y un asesor real que te representa en El Salvador.</span></li>
              </ul>
              <Link href="/proyectos" className="mt-6 inline-flex items-center gap-2 text-sand font-semibold hover:gap-3 transition-all">Ver proyectos <Flecha /></Link>
            </div>
            <div className="group relative overflow-hidden rounded-2xl bg-surface border border-line p-8 shadow-[var(--shadow-card)] flex flex-col">
              <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sand/10" />
              <svg className="h-9 w-9 text-sand-dark mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6h6v6" />
              </svg>
              <h3 className="font-display text-xl mb-1 text-navy">Comprás en El Salvador</h3>
              <p className="text-sm text-navy/60 mb-4">Conocé el lote en persona y avanzá con agilidad y respaldo.</p>
              <ul className="space-y-2.5 text-sm text-navy/75 flex-1">
                <li className="flex gap-2.5"><Check className="h-5 w-5 text-sand-dark shrink-0" /><span>Coordinamos tu visita y recorrido al lote cuando te quede mejor.</span></li>
                <li className="flex gap-2.5"><Check className="h-5 w-5 text-sand-dark shrink-0" /><span>Te orientamos en las opciones de financiamiento: plan directo del desarrollador o crédito.</span></li>
                <li className="flex gap-2.5"><Check className="h-5 w-5 text-sand-dark shrink-0" /><span>Acompañamos la escrituración y los trámites hasta que el lote quede a tu nombre.</span></li>
              </ul>
              <Link href="/proyectos" className="mt-6 inline-flex items-center gap-2 text-navy font-semibold hover:gap-3 transition-all">Ver proyectos <Flecha /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cadena de valor */}
      <section className="bg-navy-deep text-cream py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sand font-semibold uppercase tracking-wider text-sm mb-2">Un solo lugar</p>
            <h2 className="font-display text-2xl sm:text-3xl text-cream">Te acompañamos de principio a fin</h2>
            <p className="text-cream/70 mt-2">No solo te mostramos el lote: coordinamos y orientamos cada paso del proceso con nuestra red de aliados en El Salvador.</p>
          </div>
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
            {[
              { t: "Asesoría", d: "Entendemos tu objetivo y tu situación." },
              { t: "Verificación legal", d: "Estudio registral y linderos del lote." },
              { t: "Estructura de compra", d: "Poder, titularidad o financiamiento." },
              { t: "Pago", d: "Te guiamos en prima y cuotas, con comprobantes." },
              { t: "Escrituración", d: "Trámites hasta dejar el lote a tu nombre." },
              { t: "Post-venta", d: "Impuestos, construcción y cuido del lote." },
            ].map((paso, i) => (
              <li key={paso.t} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-sand text-navy font-display font-bold text-lg shadow-[var(--shadow-float)] z-10">{i + 1}</span>
                <p className="font-semibold mt-3">{paso.t}</p>
                <p className="text-xs text-cream/65 mt-1 max-w-[22ch]">{paso.d}</p>
              </li>
            ))}
            <span className="hidden lg:block absolute top-[22px] left-[8%] right-[8%] h-px bg-cream/15" />
          </ol>
        </div>
      </section>

      {/* Banda de confianza */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { t: "Confianza primero", d: "Información clara y verificada de cada proyecto, sin promesas vacías." },
            { t: "Proyectos verificados", d: "Trabajamos con desarrolladores establecidos, comenzando con Grupo Inmobiliario Chacón." },
            { t: "Atención directa", d: "Hablás por WhatsApp con una persona real, no con un formulario sin respuesta." },
          ].map((p) => (
            <div key={p.t} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-sand/15 mb-4">
                <svg className="h-6 w-6 text-sand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </span>
              <p className="font-display text-lg mb-1">{p.t}</p>
              <p className="text-sm text-navy/70">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cierre WhatsApp */}
      <section className="bg-navy text-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sand font-semibold uppercase tracking-wider text-sm mb-3">Hablemos hoy</p>
            <h2 className="font-display text-2xl sm:text-3xl mb-4 text-cream">¿Tenés dudas sobre un lote? <span className="acento">Escribinos por WhatsApp</span></h2>
            <p className="text-cream/75 max-w-md mb-7">Te respondemos con fotos, ubicación exacta, precios y disponibilidad. Sin compromiso y con una persona real del otro lado.</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-evento="click_whatsapp" className="inline-flex items-center gap-2.5 bg-sand text-navy font-semibold px-6 py-3.5 rounded-full hover:bg-sand-light transition-colors shadow-[var(--shadow-float)]">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24z" /></svg>
              Escribir por WhatsApp
            </a>
            <p className="text-cream/55 text-sm mt-4">O llamanos al <a href={`tel:${sitio.contacto.telefono}`} className="underline hover:text-sand">{sitio.contacto.telefono}</a>.</p>
          </div>
          <div className="hidden md:block">
            <div className="relative rounded-2xl border border-cream/15 bg-navy-deep/60 p-6 shadow-[var(--shadow-float)]">
              <div className="flex items-center gap-3 mb-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-sand/20 text-sand font-display font-bold">DP</span>
                <div>
                  <p className="font-semibold leading-tight">DestinoPropiedades.com</p>
                  <p className="text-xs text-cream/50">en línea · responde rápido</p>
                </div>
              </div>
              <div className="space-y-2.5 text-sm">
                <p className="max-w-[80%] rounded-2xl rounded-tl-sm bg-cream/10 px-4 py-2.5">Hola 👋 quiero info de un lote en la playa</p>
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-sand text-navy px-4 py-2.5">¡Con gusto! Te paso fotos, ubicación y precios. ¿Para vos o para tu familia en El Salvador?</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alianza */}
      <section className="bg-navy/5 py-14">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="font-display text-2xl mb-3">En alianza con {sitio.desarrolladorActual.nombre}</p>
          <p className="text-navy/70 max-w-2xl mx-auto mb-5">DestinoPropiedades.com es la plataforma; {sitio.desarrolladorActual.nombre} es nuestro desarrollador aliado actual para los proyectos en venta.</p>
          <Link href="/quienes-somos" className="text-navy font-semibold underline hover:text-sand transition-colors">Conocé más sobre quiénes somos</Link>
        </div>
      </section>
    </>
  );
}

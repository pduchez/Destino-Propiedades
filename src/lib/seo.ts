// Constructores de datos estructurados schema.org (JSON-LD).
// Reciben la URL base del sitio para generar enlaces absolutos.
import type { Proyecto } from "../data/proyectos";
import type { Zona, FaqItem } from "../data/zonas";
import { sitio } from "../data/sitio";

function abs(path: string, base: URL | string): string {
  return new URL(path, base).href;
}

const disponibilidadSchema: Record<string, string> = {
  disponible: "https://schema.org/InStock",
  preventa: "https://schema.org/PreOrder",
  agotado: "https://schema.org/SoldOut",
};

/** Migas de pan estructuradas. items: [{ label, url? }] en orden. */
export function breadcrumbJsonLd(
  items: { label: string; url?: string }[],
  base: URL | string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.url ? { item: abs(it.url, base) } : {}),
    })),
  };
}

/** Producto (lote) con precio agregado, para snippets de precio en Google. */
export function proyectoJsonLd(proyecto: Proyecto, base: URL | string) {
  const preciados = proyecto.tiposDeLote.filter((t) => t.precio > 0);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: proyecto.nombre,
    description: proyecto.seo.metaDescripcion,
    image: proyecto.galeria.slice(0, 5).map((g) => abs(g, base)),
    category: "Lote / Terreno",
    brand: {
      "@type": "Organization",
      name: sitio.desarrolladorActual.nombre,
      url: sitio.desarrolladorActual.web,
    },
    areaServed: `${proyecto.municipio}, ${proyecto.departamento}, El Salvador`,
  };

  if (preciados.length > 0) {
    const precios = preciados.map((t) => t.precio);
    data.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: Math.min(...precios),
      highPrice: Math.max(...precios),
      offerCount: preciados.length,
      availability: disponibilidadSchema[proyecto.estado],
      url: abs(`/proyectos/${proyecto.slug}`, base),
    };
  }
  return data;
}

/** Preguntas frecuentes (rich results de FAQ). */
export function faqJsonLd(faq: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.pregunta,
      acceptedAnswer: { "@type": "Answer", text: f.respuesta },
    })),
  };
}

/** WebSite con buscador (puede habilitar la caja de búsqueda en Google). */
export function websiteJsonLd(base: URL | string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: sitio.marcaPlataforma,
    url: abs("/", base),
    inLanguage: "es-SV",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: abs("/proyectos?q={search_term_string}", base),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Organización (marca) con redes y contacto. */
export function organizationJsonLd(base: URL | string) {
  const sameAs = [
    sitio.redes.facebook,
    sitio.redes.instagram,
    sitio.redes.tiktok,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: sitio.marcaPlataforma,
    url: abs("/", base),
    logo: abs("/assets/og/default.jpg", base),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "ventas",
      telephone: sitio.contacto.telefono,
      areaServed: "SV",
      availableLanguage: ["es"],
    },
  };
}

/** Resumen de zona (CollectionPage) — opcional, complementa FAQ + breadcrumb. */
export function zonaJsonLd(zona: Zona, base: URL | string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: zona.nombre,
    description: zona.descripcion,
    url: abs(`/${zona.slug}`, base),
    inLanguage: "es-SV",
  };
}

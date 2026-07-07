// Feed de datos del portal para el ARS (agente de redes sociales).
// Se genera estático al publicar (sin backend) a partir de `proyectos.ts`.
// El ARS lee este JSON como fuente de verdad: imágenes, precios, amenidades
// y "novedades" a comunicar. Así el dueño edita en UN solo lugar (el portal)
// y el ARS se alimenta solo, sin doble carga.
import type { APIContext } from "astro";
import { proyectos } from "../data/proyectos";
import { labelTipo, etiquetaUnidad } from "../lib/formato";
import { rangoArea, lotesDisponibles } from "../lib/relaciones";
import { withBase } from "../lib/rutas";
import { sitio } from "../data/sitio";

export const prerender = true;

export function GET({ site }: APIContext) {
  const base = site ?? new URL("https://destinopropiedades.com");
  const abs = (path: string) => new URL(withBase(path), base).href;
  const generado = new Date().toISOString();

  const items = proyectos.map((p) => {
    const rango = rangoArea(p);
    const areaTexto = rango
      ? rango.min === rango.max
        ? `${rango.min} ${etiquetaUnidad(rango.unidad as any)}`
        : `${rango.min}–${rango.max} ${etiquetaUnidad(rango.unidad as any)}`
      : null;

    return {
      slug: p.slug,
      nombre: p.nombre,
      url: abs(`/proyectos/${p.slug}`),
      tipo: p.tipo,
      tipoLabel: labelTipo[p.tipo],
      estado: p.estado,
      destacado: Boolean(p.destacado),
      departamento: p.departamento,
      municipio: p.municipio,
      ubicacion: `${p.municipio}, ${p.departamento}`,
      etiquetaPrecio: p.etiquetaPrecio,
      precioDesde: p.precioDesde,
      moneda: "USD",
      area: areaTexto,
      lotesDisponibles: lotesDisponibles(p),
      descripcion: p.descripcion,
      servicios: p.servicios,
      imagenes: p.galeria.map((g) => abs(g)),
      // Novedad puntual a comunicar en redes (opcional, la escribe el dueño).
      novedad: p.novedad ?? null,
      // Última actualización relevante; si no se define, la de publicación.
      actualizado: p.actualizado ?? generado.slice(0, 10),
    };
  });

  const payload = {
    marca: sitio.marcaPlataforma,
    portalUrl: base.href.replace(/\/$/, ""),
    generado,
    total: items.length,
    proyectos: items,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Cache razonable: el ARS puede leer seguido sin martillar.
      "Cache-Control": "public, max-age=300",
    },
  });
}

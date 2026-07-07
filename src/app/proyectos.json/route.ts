// Feed de datos del portal para el ARS (agente de redes sociales).
// Fuente de verdad: proyectos.ts. El ARS lo consume (imágenes, precios,
// amenidades, novedades). Ver src/app/api/portal/sync/route.ts (rama ars).
import { proyectos } from "@/portal/data/proyectos";
import { labelTipo, etiquetaUnidad } from "@/portal/lib/formato";
import { rangoArea, lotesDisponibles } from "@/portal/lib/relaciones";
import { sitio } from "@/portal/data/sitio";
import { SITE } from "@/portal/lib/site";

export const dynamic = "force-static";

export function GET() {
  const abs = (path: string) => new URL(path, SITE).href;
  const generado = new Date().toISOString();

  const items = proyectos.map((p) => {
    const rango = rangoArea(p);
    const areaTexto = rango
      ? rango.min === rango.max
        ? `${rango.min} ${etiquetaUnidad(rango.unidad)}`
        : `${rango.min}–${rango.max} ${etiquetaUnidad(rango.unidad)}`
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
      novedad: p.novedad ?? null,
      actualizado: p.actualizado ?? generado.slice(0, 10),
    };
  });

  return Response.json({
    marca: sitio.marcaPlataforma,
    portalUrl: SITE.href.replace(/\/$/, ""),
    generado,
    total: items.length,
    proyectos: items,
  });
}

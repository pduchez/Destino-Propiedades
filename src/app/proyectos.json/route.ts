// Feed de datos del portal para el ARS (agente de redes sociales).
// Fuente de verdad: proyectos.ts. El ARS lo consume (imágenes, precios,
// amenidades, novedades). Ver src/app/api/portal/sync/route.ts (rama ars).
import { proyectos } from "@/portal/data/proyectos";
import { labelTipo, etiquetaUnidad } from "@/portal/lib/formato";
import { rangoArea, lotesDisponibles } from "@/portal/lib/relaciones";
import { sitio } from "@/portal/data/sitio";
import { SITE } from "@/portal/lib/site";

// Dinámico: las URLs absolutas (páginas e imágenes) se arman con el ORIGEN de
// la petición, para que resuelvan tanto en producción como en un preview de
// Vercel (donde el dominio final aún no está activo). Cae a SITE si no hay
// origen (build).
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const origin = (() => {
    try {
      return new URL(req.url).origin;
    } catch {
      return SITE.href.replace(/\/$/, "");
    }
  })();
  const abs = (path: string) => new URL(path, origin).href;
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
    portalUrl: origin,
    generado,
    total: items.length,
    proyectos: items,
  });
}

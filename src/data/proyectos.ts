// Proyectos (lotificaciones). Esta es la lista que arma casi todo el sitio:
// listados, fichas, buscador, páginas de zona.
//
// Los proyectos de este archivo son EJEMPLOS INVENTADOS para poblar el sitio
// mientras llegan los datos reales de Grupo Inmobiliario Chacón. Reemplazar
// o borrar cuando haya información real (nombres, fotos, precios, ubicación).

export type TipoProyecto = "playa" | "urbano" | "residencial";
export type EstadoProyecto = "disponible" | "preventa" | "agotado";
export type UnidadArea = "v2" | "m2";

export interface TipoDeLote {
  nombre: string;
  area: number;
  unidad: UnidadArea;
  precio: number;
  disponibilidad: number;
}

export interface Proyecto {
  id: string;
  slug: string;
  nombre: string;
  desarrolladorId: string;
  departamento: string;
  municipio: string;
  tipo: TipoProyecto;
  estado: EstadoProyecto;
  descripcion: string;
  galeria: string[];
  /** Número en USD, o null si el precio es solo "Consultar". */
  precioDesde: number | null;
  /** Regla única: "Desde $X por lote" o "Consultar". */
  etiquetaPrecio: string;
  tiposDeLote: TipoDeLote[];
  servicios: string[];
  ubicacion: { lat: number; lng: number };
  seo: {
    titulo: string;
    metaDescripcion: string;
    ogImage: string;
  };
  /** Plantilla del mensaje de WhatsApp pre-escrito para este proyecto. */
  whatsappMensaje: string;
}

function mensajeWhatsapp(nombre: string, slug: string): string {
  return `Hola, me interesa el proyecto *${nombre}* que vi en DestinoPropiedades: https://destinopropiedades.com/proyectos/${slug}`;
}

export const proyectos: Proyecto[] = [
  {
    id: "riviera-del-pacifico",
    slug: "riviera-del-pacifico",
    nombre: "Riviera del Pacífico", // EJEMPLO
    desarrolladorId: "grupo-chacon",
    departamento: "Sonsonate",
    municipio: "Acajutla",
    tipo: "playa",
    estado: "disponible",
    descripcion:
      "Lotificación frente al Pacífico con acceso directo a playa, pensada " +
      "para quienes buscan construir su casa de descanso o invertir en la " +
      "costa salvadoreña. Lotes amplios, calles internas pavimentadas y " +
      "acceso controlado las 24 horas.",
    galeria: [
      "/assets/proyectos/riviera-del-pacifico/1.webp",
      "/assets/proyectos/riviera-del-pacifico/2.webp",
      "/assets/proyectos/riviera-del-pacifico/3.webp",
      "/assets/proyectos/riviera-del-pacifico/4.webp",
      "/assets/proyectos/riviera-del-pacifico/5.webp",
      "/assets/proyectos/riviera-del-pacifico/6.webp",
      "/assets/proyectos/riviera-del-pacifico/7.webp",
      "/assets/proyectos/riviera-del-pacifico/8.webp",
    ], // PENDIENTE: reemplazar con fotos reales (8-15 fotos)
    precioDesde: 28000,
    etiquetaPrecio: "Desde $28,000 por lote",
    tiposDeLote: [
      { nombre: "Lote estándar", area: 300, unidad: "v2", precio: 28000, disponibilidad: 12 },
      { nombre: "Lote frente a playa", area: 450, unidad: "v2", precio: 52000, disponibilidad: 4 },
    ],
    servicios: ["Acceso controlado", "Agua potable", "Energía eléctrica", "Acceso a playa", "Calles pavimentadas"],
    ubicacion: { lat: 13.5928, lng: -89.8275 },
    seo: {
      titulo: "Riviera del Pacífico — Lotes frente al mar en Acajutla, Sonsonate",
      metaDescripcion:
        "Lotes de playa en Acajutla, Sonsonate, con acceso controlado y servicios completos. Desde $28,000. Consultá disponibilidad por WhatsApp.",
      ogImage: "/assets/proyectos/riviera-del-pacifico/1.webp",
    },
    whatsappMensaje: mensajeWhatsapp("Riviera del Pacífico", "riviera-del-pacifico"),
  },
  {
    id: "altos-de-costa-azul",
    slug: "altos-de-costa-azul",
    nombre: "Altos de Costa Azul", // EJEMPLO
    desarrolladorId: "grupo-chacon",
    departamento: "La Libertad",
    municipio: "Costa del Sol",
    tipo: "playa",
    estado: "preventa",
    descripcion:
      "Proyecto en preventa sobre las alturas de Costa del Sol, con vista al " +
      "mar y a pocos minutos de la playa. Ideal para quienes buscan invertir " +
      "temprano en una zona de alta plusvalía.",
    galeria: [
      "/assets/proyectos/altos-de-costa-azul/1.webp",
      "/assets/proyectos/altos-de-costa-azul/2.webp",
      "/assets/proyectos/altos-de-costa-azul/3.webp",
      "/assets/proyectos/altos-de-costa-azul/4.webp",
      "/assets/proyectos/altos-de-costa-azul/5.webp",
      "/assets/proyectos/altos-de-costa-azul/6.webp",
    ], // PENDIENTE: reemplazar con fotos reales (8-15 fotos)
    precioDesde: null,
    etiquetaPrecio: "Consultar",
    tiposDeLote: [
      { nombre: "Lote vista al mar", area: 350, unidad: "v2", precio: 0, disponibilidad: 20 },
    ],
    servicios: ["Acceso controlado", "Agua potable", "Energía eléctrica", "Vista al mar"],
    ubicacion: { lat: 13.4525, lng: -89.0667 },
    seo: {
      titulo: "Altos de Costa Azul — Lotes en preventa en Costa del Sol, La Libertad",
      metaDescripcion:
        "Lotes en preventa con vista al mar en Costa del Sol, La Libertad. Acceso controlado y alta plusvalía. Consultá precios por WhatsApp.",
      ogImage: "/assets/proyectos/altos-de-costa-azul/1.webp",
    },
    whatsappMensaje: mensajeWhatsapp("Altos de Costa Azul", "altos-de-costa-azul"),
  },
  {
    id: "vista-mar-el-zonte",
    slug: "vista-mar-el-zonte",
    nombre: "Vista Mar El Zonte", // EJEMPLO
    desarrolladorId: "grupo-chacon",
    departamento: "La Libertad",
    municipio: "El Zonte",
    tipo: "playa",
    estado: "disponible",
    descripcion:
      "Lotificación cercana a El Zonte, una de las zonas de playa más " +
      "buscadas por su ambiente surfero y crecimiento turístico. Lotes " +
      "listos para construir, a pocos minutos de la playa.",
    galeria: [
      "/assets/proyectos/vista-mar-el-zonte/1.webp",
      "/assets/proyectos/vista-mar-el-zonte/2.webp",
      "/assets/proyectos/vista-mar-el-zonte/3.webp",
      "/assets/proyectos/vista-mar-el-zonte/4.webp",
      "/assets/proyectos/vista-mar-el-zonte/5.webp",
      "/assets/proyectos/vista-mar-el-zonte/6.webp",
    ], // PENDIENTE: reemplazar con fotos reales (8-15 fotos)
    precioDesde: 35000,
    etiquetaPrecio: "Desde $35,000 por lote",
    tiposDeLote: [
      { nombre: "Lote estándar", area: 280, unidad: "v2", precio: 35000, disponibilidad: 8 },
    ],
    servicios: ["Agua potable", "Energía eléctrica", "Cercano a playa", "Zona turística"],
    ubicacion: { lat: 13.4953, lng: -89.4083 },
    seo: {
      titulo: "Vista Mar El Zonte — Lotes cerca de la playa en La Libertad",
      metaDescripcion:
        "Lotes listos para construir cerca de El Zonte, La Libertad. Zona turística y surfera en crecimiento. Desde $35,000.",
      ogImage: "/assets/proyectos/vista-mar-el-zonte/1.webp",
    },
    whatsappMensaje: mensajeWhatsapp("Vista Mar El Zonte", "vista-mar-el-zonte"),
  },
];

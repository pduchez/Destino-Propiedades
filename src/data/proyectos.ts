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
      // Imagen de marca para compartir (1200x630). Se regenera con _gen-og.ts.
      ogImage: "/assets/og/riviera-del-pacifico.jpg",
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
      ogImage: "/assets/og/altos-de-costa-azul.jpg",
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
      ogImage: "/assets/og/vista-mar-el-zonte.jpg",
    },
    whatsappMensaje: mensajeWhatsapp("Vista Mar El Zonte", "vista-mar-el-zonte"),
  },

  // ───────────────────────────────────────────────────────────────────────
  // PROYECTO REAL — datos tomados de los documentos de Grupo Chacón / GESCOSAL
  // (presentación, lista de precios, ficha de amenidades y plano). Las FOTOS
  // siguen pendientes (las de marketing están en la "Presentación general"
  // que no se incluyó); por ahora hay placeholders + el plano real.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "condado-del-golfo",
    slug: "condado-del-golfo",
    nombre: "Condado del Golfo",
    desarrolladorId: "grupo-chacon",
    departamento: "La Unión",
    municipio: "Conchagua",
    tipo: "residencial",
    estado: "disponible",
    descripcion:
      "Lotificación residencial Bella Vista “Condado del Golfo”, ubicada en " +
      "Conchagua, sobre el bulevar a apenas medio kilómetro de la ciudad de " +
      "La Unión. Es un proyecto amplio y pensado como comunidad: calles " +
      "asfaltadas, cordón cuneta, aceras, áreas verdes jardinizadas, casa " +
      "club, ciclovía y zona pet-friendly, con caseta de seguridad y " +
      "factibilidades de servicios básicos. Una opción para volver, invertir " +
      "y construir patrimonio familiar en una zona en crecimiento, cerca de " +
      "servicios como el Hospital Nacional de La Unión.",
    galeria: [
      "/assets/proyectos/condado-del-golfo/1.webp", // foto aérea real (calles y lotes)
      "/assets/proyectos/condado-del-golfo/2.webp", // foto aérea real (entrada y casas terminadas)
      "/assets/proyectos/condado-del-golfo/plano.webp", // plano real de distribución
      "/assets/proyectos/condado-del-golfo/3.webp",
      "/assets/proyectos/condado-del-golfo/4.webp",
    ], // PENDIENTE: reemplazar 3-4 con más fotos reales (caseta, casa club)
    precioDesde: 24693,
    etiquetaPrecio: "Desde $24,693 por lote",
    // Tipos representativos calculados desde el inventario real (261 lotes).
    // El precio es el "desde" de cada rango; validar lote a lote antes de vender.
    tiposDeLote: [
      { nombre: "Lote compacto (157–170 m²)", area: 224, unidad: "v2", precio: 24693, disponibilidad: 90 },
      { nombre: "Lote estándar (187–228 m²)", area: 293, unidad: "v2", precio: 29420, disponibilidad: 106 },
      { nombre: "Lote amplio (233–316 m²)", area: 380, unidad: "v2", precio: 36717, disponibilidad: 53 },
      { nombre: "Lote gran formato (322–470 m²)", area: 460, unidad: "v2", precio: 50726, disponibilidad: 11 },
    ],
    servicios: [
      "Caseta de seguridad",
      "Factibilidades de servicios básicos",
      "Calles asfaltadas",
      "Cordón cuneta",
      "Aceras",
      "Áreas verdes jardinizadas",
      "Casa club",
      "Ciclovía",
      "Estacionamiento de visitas",
      "Zona pet-friendly",
    ],
    // Ubicación aproximada de Conchagua / La Unión. PENDIENTE: ajustar al
    // punto exacto del proyecto sobre el bulevar antes de La Unión.
    ubicacion: { lat: 13.33, lng: -87.852 },
    seo: {
      titulo: "Condado del Golfo — Lotes residenciales en Conchagua, La Unión | DestinoPropiedades.com",
      metaDescripcion:
        "Lotes residenciales en Condado del Golfo, Conchagua, La Unión: calles asfaltadas, casa club, ciclovía y áreas verdes. Desde $24,693 por lote. Consultá por WhatsApp.",
      ogImage: "/assets/og/condado-del-golfo.jpg",
    },
    whatsappMensaje: mensajeWhatsapp("Condado del Golfo", "condado-del-golfo"),
  },
];

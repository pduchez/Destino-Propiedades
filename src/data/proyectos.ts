// Proyectos (lotificaciones). Esta es la lista que arma casi todo el sitio:
// listados, fichas, buscador, páginas de zona.
//
// Esta lista mezcla:
//  - PROYECTOS REALES (datos tomados de los documentos de Grupo Inmobiliario
//    Chacón: lista de precios, amenidades, plano y PPDS): Condado del Golfo,
//    Adelaida City y Altos de las Mercedes. Algunos aún no tienen fotos
//    (`galeria: []`): se muestran con el marcador "Fotos en camino" hasta que
//    el desarrollador suba las tomas. Las fotos llegan por partes.
//  - EJEMPLOS INVENTADOS para poblar el sitio (Riviera del Pacífico, Altos de
//    Costa Azul, Vista Mar El Zonte). Reemplazar o borrar cuando haya más
//    proyectos reales.

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

/**
 * Vista 360° / recorrido virtual de un proyecto. PREVISTO para la estrategia
 * de marketing visual: los videos 360 se están generando. Cuando estén,
 * basta con agregar entradas aquí (no requiere rediseño).
 * - `tipo`: de dónde viene el embed (YouTube 360, Kuula, Matterport, etc.).
 * - `url`: enlace al recorrido o al embed.
 * - `titulo`: rótulo corto ("Entrada", "Casa club", "Vista al Golfo"…).
 * - `miniatura`: imagen de previsualización opcional.
 */
export interface Vista360 {
  tipo: "youtube" | "kuula" | "matterport" | "iframe";
  url: string;
  titulo: string;
  miniatura?: string;
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
  /**
   * Marca el proyecto como destacado para promocionarlo en la portada
   * (sección "Proyectos destacados"). Opcional: si ningún proyecto lo tiene,
   * la portada muestra los primeros por defecto.
   */
  destacado?: boolean;
  descripcion: string;
  galeria: string[];
  /** Número en USD, o null si el precio es solo "Consultar". */
  precioDesde: number | null;
  /** Regla única: "Desde $X por lote" o "Consultar". */
  etiquetaPrecio: string;
  tiposDeLote: TipoDeLote[];
  servicios: string[];
  /**
   * Vistas 360° / recorridos virtuales. PREVISTO (opcional): se llenará
   * cuando estén listos los videos 360. Si está vacío o ausente, la sección
   * simplemente no aparece en la ficha.
   */
  vistas360?: Vista360[];
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
  // (presentación, lista de precios, ficha de amenidades y plano) y fotos
  // aéreas reales (dron) provistas por el desarrollador.
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
    destacado: true,
    descripcion:
      "Lotificación residencial Bella Vista “Condado del Golfo”, ubicada en " +
      "Conchagua, sobre el bulevar a apenas medio kilómetro de la ciudad de " +
      "La Unión. Es un proyecto amplio y pensado como comunidad: calles " +
      "asfaltadas, cordón cuneta, aceras, áreas verdes jardinizadas, casa " +
      "club, ciclovía y zona pet-friendly, con caseta de seguridad y " +
      "factibilidades de servicios básicos. Desde el proyecto se aprecia la " +
      "vista al Golfo de Fonseca y a los volcanes de la zona. Una opción para " +
      "volver, invertir y construir patrimonio familiar en una zona en " +
      "crecimiento, cerca de servicios como el Hospital Nacional de La Unión.",
    // Fotos aéreas reales del proyecto (dron). Portada: panorámica con el
    // Golfo de Fonseca y los volcanes al fondo.
    galeria: [
      "/assets/proyectos/condado-del-golfo/panoramica-golfo.webp", // vista al Golfo de Fonseca
      "/assets/proyectos/condado-del-golfo/vista-aerea.webp", // calles internas y lotes
      "/assets/proyectos/condado-del-golfo/entrada-casas.webp", // entrada y casas terminadas
      "/assets/proyectos/condado-del-golfo/calles.webp", // calles con cordón cuneta
      "/assets/proyectos/condado-del-golfo/obra.webp", // obra en avance (maquinaria)
      "/assets/proyectos/condado-del-golfo/plano.webp", // plano real de distribución
    ],
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

  // ───────────────────────────────────────────────────────────────────────
  // PROYECTO REAL — Adelaida City. Datos tomados de la lista de precios,
  // ficha de amenidades, plano y PPDS de Grupo Chacón / GESCOSAL S.A. de C.V.
  // Fotos PENDIENTES (las sube el desarrollador): galería vacía → se muestra
  // el marcador "Fotos en camino".
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "adelaida-city",
    slug: "adelaida-city",
    nombre: "Adelaida City",
    desarrolladorId: "grupo-chacon",
    departamento: "Sonsonate",
    municipio: "Izalco",
    tipo: "residencial",
    estado: "disponible",
    destacado: true,
    descripcion:
      "Lotificación residencial Adelaida City, ubicada en el Cantón Cután, " +
      "Izalco, departamento de Sonsonate. Lotes residenciales con " +
      "factibilidad de servicios básicos, cordón cuneta, calles balastreadas " +
      "y áreas verdes jardinizadas, en una zona del occidente del país con " +
      "acceso a carretera y en crecimiento. Una opción accesible para la " +
      "familia salvadoreña que quiere invertir en un terreno propio en El " +
      "Salvador, con precio por vara cuadrada uniforme y planes de pago " +
      "directo con el desarrollador.",
    // Fotos pendientes: el desarrollador las subirá por partes.
    galeria: [],
    precioDesde: 22034,
    etiquetaPrecio: "Desde $22,034 por lote",
    // Tipos representativos calculados desde la lista de precios real (41 lotes
    // listados, precio uniforme de US$77 por vara²). Disponibilidad según la
    // lista; confirmar disponibilidad real lote a lote antes de vender.
    tiposDeLote: [
      { nombre: "Lote desde ≈200 m²", area: 286, unidad: "v2", precio: 22034, disponibilidad: 22 },
      { nombre: "Lote intermedio ≈230 m²", area: 330, unidad: "v2", precio: 25410, disponibilidad: 12 },
      { nombre: "Lote amplio hasta ≈317 m²", area: 453, unidad: "v2", precio: 34879, disponibilidad: 7 },
    ],
    servicios: [
      "Factibilidad de servicios básicos",
      "Cordón cuneta",
      "Calles balastreadas",
      "Áreas verdes jardinizadas",
    ],
    // Ubicación aproximada de Izalco / Cantón Cután. PENDIENTE: ajustar al
    // punto exacto del proyecto cuando lo confirme el desarrollador.
    ubicacion: { lat: 13.7458, lng: -89.6775 },
    seo: {
      titulo: "Adelaida City — Lotes residenciales en Izalco, Sonsonate | DestinoPropiedades.com",
      metaDescripcion:
        "Lotes residenciales en Adelaida City, Izalco, Sonsonate, El Salvador: servicios básicos, calles y áreas verdes. Desde $22,034 por lote, con pago directo. Consultá por WhatsApp.",
      ogImage: "/assets/og/adelaida-city.jpg",
    },
    whatsappMensaje: mensajeWhatsapp("Adelaida City", "adelaida-city"),
  },

  // ───────────────────────────────────────────────────────────────────────
  // PROYECTO REAL — Altos de las Mercedes. Datos tomados de la lista de
  // precios, ficha de amenidades, plano y PPDS de Grupo Chacón / PARSAL
  // S.A. de C.V. Fotos PENDIENTES: galería vacía → marcador "Fotos en camino".
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "altos-de-las-mercedes",
    slug: "altos-de-las-mercedes",
    nombre: "Altos de las Mercedes",
    desarrolladorId: "grupo-chacon",
    departamento: "La Libertad",
    municipio: "Quezaltepeque",
    tipo: "residencial",
    estado: "disponible",
    destacado: true,
    descripcion:
      "Lotificación residencial Altos de las Mercedes, sobre la calle hacia " +
      "el volcán, en Quezaltepeque, La Libertad — a corta distancia de San " +
      "Salvador. Proyecto residencial desarrollado por etapas, con " +
      "factibilidad de servicios básicos, áreas verdes jardinizadas, " +
      "estacionamiento de visitas y zona pet-friendly. Pensado para quienes " +
      "buscan un lote para construir o invertir en una zona de crecimiento del " +
      "Gran San Salvador, con financiamiento directo del desarrollador.",
    // Fotos pendientes: el desarrollador las subirá por partes.
    galeria: [],
    precioDesde: 29023,
    etiquetaPrecio: "Desde $29,023 por lote",
    // Tipos representativos desde la lista de precios real (precio uniforme de
    // US$110 por vara²; etapas 1 y 2). Algunos lotes figuran como
    // reservados/vendidos: confirmar disponibilidad real antes de vender.
    tiposDeLote: [
      { nombre: "Lote compacto desde ≈184 m²", area: 264, unidad: "v2", precio: 29023, disponibilidad: 4 },
      { nombre: "Lote estándar ≈200 m²", area: 286, unidad: "v2", precio: 31460, disponibilidad: 20 },
      { nombre: "Lote amplio hasta ≈354 m²", area: 506, unidad: "v2", precio: 55660, disponibilidad: 6 },
    ],
    servicios: [
      "Factibilidad de servicios básicos",
      "Áreas verdes jardinizadas",
      "Estacionamiento de visitas",
      "Zona pet-friendly",
    ],
    // Ubicación aproximada de Quezaltepeque (calle hacia el volcán).
    // PENDIENTE: ajustar al punto exacto del proyecto.
    ubicacion: { lat: 13.834, lng: -89.289 },
    seo: {
      titulo: "Altos de las Mercedes — Lotes residenciales en Quezaltepeque, La Libertad | DestinoPropiedades.com",
      metaDescripcion:
        "Lotes residenciales en Altos de las Mercedes, Quezaltepeque, La Libertad, cerca de San Salvador: áreas verdes y zona pet-friendly. Desde $29,023 por lote. Consultá por WhatsApp.",
      ogImage: "/assets/og/altos-de-las-mercedes.jpg",
    },
    whatsappMensaje: mensajeWhatsapp("Altos de las Mercedes", "altos-de-las-mercedes"),
  },

  // ───────────────────────────────────────────────────────────────────────
  // PROYECTO REAL — Highlights (El Zapote). Lotificación frente al mar en
  // Punta Zapote, San Francisco Menéndez, Ahuachapán. Datos tomados de la
  // lista de precios (PARSAL S.A. de C.V., 21/09/2025), ficha de amenidades,
  // plano y PPDS de Grupo Chacón. 139 lotes en polígonos A-F. Fotos
  // PENDIENTES: galería vacía → marcador "Fotos en camino".
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "highlights",
    slug: "highlights",
    nombre: "Highlights",
    desarrolladorId: "grupo-chacon",
    departamento: "Ahuachapán",
    municipio: "San Francisco Menéndez",
    tipo: "playa",
    estado: "disponible",
    destacado: true,
    descripcion:
      "Highlights (El Zapote) es una lotificación frente al mar en el Cantón " +
      "Punta Zapote, San Francisco Menéndez, Ahuachapán, en la costa del " +
      "occidente salvadoreño. Ofrece lotes amplios —desde poco más de 350 " +
      "hasta más de 1,600 varas²— con factibilidad de agua y luz, caseta de " +
      "seguridad, áreas verdes jardinizadas, piscina y casa club. Pensado " +
      "para quien busca tierra frente al mar como patrimonio familiar, " +
      "segunda casa o inversión turística-residencial, con planes de pago " +
      "directos con el desarrollador.",
    // Fotos pendientes: el desarrollador las subirá por partes.
    galeria: [],
    precioDesde: 64930,
    etiquetaPrecio: "Desde $64,930 por lote",
    // Tipos representativos de los 139 lotes en polígonos A-F (lista de precios
    // real). El precio por vara² varía por polígono. La disponibilidad real por
    // lote NO está confirmada en la lista (se marca "No especificado"): se deja
    // en 0 y se confirma lote a lote con el desarrollador antes de vender.
    tiposDeLote: [
      { nombre: "Lote estándar ≈360–635 v²", area: 360, unidad: "v2", precio: 64930, disponibilidad: 0 },
      { nombre: "Lote amplio ≈677–992 v²", area: 677, unidad: "v2", precio: 124023, disponibilidad: 0 },
      { nombre: "Lote frente al mar ≈1,140–1,612 v²", area: 1140, unidad: "v2", precio: 219995, disponibilidad: 0 },
    ],
    servicios: [
      "Factibilidad de servicios básicos (agua y luz)",
      "Caseta de seguridad",
      "Cordón cuneta",
      "Aceras",
      "Áreas verdes jardinizadas",
      "Piscina",
      "Casa club",
      "Estacionamiento de visitas",
      "Zona pet-friendly",
    ],
    // Ubicación aproximada de Punta Zapote / Barra de Santiago (costa de
    // Ahuachapán). PENDIENTE: ajustar al punto exacto del proyecto cuando lo
    // confirme el desarrollador (coordenadas marcadas como faltantes en el PPDS).
    ubicacion: { lat: 13.701, lng: -90.027 },
    seo: {
      titulo: "Highlights — Lotes frente al mar en Ahuachapán | DestinoPropiedades.com",
      metaDescripcion:
        "Lotes frente al mar en Highlights (El Zapote), Punta Zapote, San Francisco Menéndez, Ahuachapán: factibilidad de agua y luz, caseta, piscina y casa club. Desde $64,930 por lote. Consultá por WhatsApp.",
      ogImage: "/assets/og/highlights.jpg",
    },
    whatsappMensaje: mensajeWhatsapp("Highlights", "highlights"),
  },
];

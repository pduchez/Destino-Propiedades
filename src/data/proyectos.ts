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
  // ───────────────────────────────────────────────────────────────────────
  // PROYECTO REAL — Riviera del Pacífico (Sunsita #1). Lotificación costera
  // en Cantón Sunza, Acajutla, Sonsonate. Datos de lista de precios
  // (Parceladora Salvadoreña S.A. de C.V., $165/v², prima 20%), ficha de
  // amenidades, plano y PPDS de Grupo Chacón. 46 lotes (polígonos A-D).
  // Reemplaza la versión de EJEMPLO previa. Fotos PENDIENTES: galería vacía
  // → marcador "Fotos en camino".
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "riviera-del-pacifico",
    slug: "riviera-del-pacifico",
    nombre: "Riviera del Pacífico",
    desarrolladorId: "grupo-chacon",
    departamento: "Sonsonate",
    municipio: "Acajutla",
    tipo: "playa",
    estado: "disponible",
    destacado: true,
    descripcion:
      "Riviera del Pacífico (Sunsita #1) es una lotificación costera en el " +
      "Cantón Sunza, Acajutla, Sonsonate. Ofrece lotes amplios —de unas 515 " +
      "a más de 1,300 varas²— con acceso controlado, caseta de seguridad, " +
      "muro perimetral, calles adoquinadas, áreas verdes jardinizadas y un " +
      "conjunto de amenidades premium (piscina, gimnasio, casa club, " +
      "ciclovía). Pensada para la familia salvadoreña que busca tierra cerca " +
      "del mar como patrimonio, segunda vivienda o inversión turística, con " +
      "planes de pago directos: prima del 20% y saldo financiado con el " +
      "desarrollador.",
    // Fotos pendientes: el desarrollador las subirá por partes.
    galeria: [],
    precioDesde: 85066,
    etiquetaPrecio: "Desde $85,066 por lote",
    // Tipos representativos de los 46 lotes (polígonos A-D; precio uniforme de
    // US$165 por vara², prima 20%). La disponibilidad real por lote NO está
    // confirmada en la lista ("No especificado"): se deja en 0 y se confirma
    // lote a lote antes de vender.
    tiposDeLote: [
      { nombre: "Lote estándar ≈515–750 v²", area: 515, unidad: "v2", precio: 85066, disponibilidad: 0 },
      { nombre: "Lote amplio ≈800–1,050 v²", area: 800, unidad: "v2", precio: 133290, disponibilidad: 0 },
      { nombre: "Lote premium hasta ≈1,300 v²", area: 1300, unidad: "v2", precio: 214635, disponibilidad: 0 },
    ],
    servicios: [
      "Acceso controlado",
      "Caseta de seguridad",
      "Factibilidad de servicios básicos",
      "Muro perimetral",
      "Calles adoquinadas",
      "Cordón cuneta",
      "Aceras",
      "Áreas verdes jardinizadas",
      "Piscina",
      "Gimnasio",
      "Casa club",
      "Ciclovía",
      "Estacionamiento de visitas",
    ],
    // Ubicación aproximada del Cantón Sunza, Acajutla. PENDIENTE: ajustar al
    // punto exacto del proyecto (coordenadas marcadas como faltantes en el PPDS).
    ubicacion: { lat: 13.575, lng: -89.8 },
    seo: {
      titulo: "Riviera del Pacífico — Lotes frente al mar en Acajutla, Sonsonate | DestinoPropiedades.com",
      metaDescripcion:
        "Lotes de playa en Riviera del Pacífico, Cantón Sunza, Acajutla, Sonsonate: acceso controlado, piscina, casa club y amenidades premium. Desde $85,066 por lote, prima 20%. Consultá por WhatsApp.",
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

  // ───────────────────────────────────────────────────────────────────────
  // PROYECTO REAL — Galveston (Vista al Mar / Suncita II). Parcelación de uso
  // mixto (vivienda/negocio/logística) en El Suncita, Acajutla, Sonsonate.
  // Datos de lista de precios (OVC Constructores S.A. de C.V., $121/v²),
  // ficha de amenidades, plano y PPDS de Grupo Chacón. GUARDRAIL: NO es
  // "frente al mar" — se vende por ubicación, conectividad y uso mixto, no
  // como playa. Fotos PENDIENTES: galería vacía → marcador "Fotos en camino".
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "galveston",
    slug: "galveston",
    nombre: "Galveston",
    desarrolladorId: "grupo-chacon",
    departamento: "Sonsonate",
    municipio: "Acajutla",
    tipo: "urbano",
    estado: "disponible",
    destacado: true,
    descripcion:
      "Galveston — Vista al Mar (Suncita II) es una parcelación de uso mixto " +
      "en el Cantón El Suncita, Acajutla, Sonsonate. Lotes pensados para " +
      "vivienda, negocio o inversión, en una zona conectada del occidente " +
      "del país con vocación logística cercana al puerto de Acajutla. " +
      "Incluye factibilidad de servicios básicos, calles asfaltadas, cordón " +
      "cuneta, aceras, áreas verdes jardinizadas, caseta de seguridad y " +
      "estacionamiento de visitas, con precio por vara cuadrada uniforme y " +
      "planes de pago directos con el desarrollador.",
    // Fotos pendientes: el desarrollador las subirá por partes.
    galeria: [],
    precioDesde: 36357,
    etiquetaPrecio: "Desde $36,357 por lote",
    // Tipos representativos de los 43 lotes listados (polígonos E, F y K;
    // precio uniforme de US$121 por vara²). La disponibilidad real por lote NO
    // está confirmada en la lista ("No especificado"): se deja en 0 y se
    // confirma lote a lote antes de vender.
    tiposDeLote: [
      { nombre: "Lote compacto ≈210 m² (≈300 v²)", area: 300, unidad: "v2", precio: 36357, disponibilidad: 0 },
      { nombre: "Lote estándar ≈306–345 m² (≈438–494 v²)", area: 438, unidad: "v2", precio: 52976, disponibilidad: 0 },
      { nombre: "Lote amplio hasta ≈462 m² (≈661 v²)", area: 661, unidad: "v2", precio: 80010, disponibilidad: 0 },
    ],
    servicios: [
      "Factibilidad de servicios básicos",
      "Caseta de seguridad",
      "Calles asfaltadas",
      "Cordón cuneta",
      "Aceras",
      "Áreas verdes jardinizadas",
      "Estacionamiento de visitas",
      "Zona pet-friendly",
    ],
    // Ubicación aproximada de El Suncita / Acajutla. PENDIENTE: ajustar al
    // punto exacto del proyecto (coordenadas marcadas como faltantes en el PPDS).
    ubicacion: { lat: 13.62, lng: -89.82 },
    seo: {
      titulo: "Galveston — Vista al Mar, lotes en Acajutla, Sonsonate | DestinoPropiedades.com",
      metaDescripcion:
        "Lotes de uso mixto en Galveston (Vista al Mar), El Suncita, Acajutla, Sonsonate: servicios básicos, calles asfaltadas y áreas verdes. Ideal para vivienda, negocio o inversión. Desde $36,357 por lote. Consultá por WhatsApp.",
      ogImage: "/assets/og/galveston.jpg",
    },
    whatsappMensaje: mensajeWhatsapp("Galveston", "galveston"),
  },

  // ───────────────────────────────────────────────────────────────────────
  // PROYECTO REAL — Villa Lourdes (Condado Villa Lourdes). Urbanización
  // residencial en Lourdes Colón, La Libertad. Datos de lista de precios
  // (GESCOSAL S.A. de C.V.), ficha de amenidades, plano y PPDS de Grupo
  // Chacón. 389 lotes (polígonos F, G, I, J). GUARDRAIL: hay lotes "marcados
  // en amarillo" (posible reserva) — no afirmar disponibilidad sin confirmar.
  // Fotos PENDIENTES: galería vacía → marcador "Fotos en camino".
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "villa-lourdes",
    slug: "villa-lourdes",
    nombre: "Villa Lourdes",
    desarrolladorId: "grupo-chacon",
    departamento: "La Libertad",
    municipio: "Lourdes Colón",
    tipo: "residencial",
    estado: "disponible",
    destacado: true,
    descripcion:
      "Urbanización Villa Lourdes (Condado Villa Lourdes) es un proyecto " +
      "residencial en la Hacienda Agua Fría, Cantón El Capulín, Lourdes " +
      "Colón, La Libertad — una zona céntrica y bien conectada del occidente " +
      "del Gran San Salvador. Ofrece lotes para vivienda o inversión con " +
      "factibilidad de servicios básicos, calles asfaltadas, aceras, cordón " +
      "cuneta, caseta de seguridad, áreas verdes jardinizadas, planta de " +
      "tratamiento y equipamiento social. Una opción accesible para la " +
      "familia salvadoreña que quiere construir o invertir en tierra urbana, " +
      "con planes de pago directos con el desarrollador.",
    // Fotos pendientes: el desarrollador las subirá por partes.
    galeria: [],
    precioDesde: 25182,
    etiquetaPrecio: "Desde $25,182 por lote",
    // Tipos representativos de los 389 lotes (polígonos F, G, I, J; precio por
    // vara² entre ≈US$286 y US$367). Hay lotes "marcados en amarillo" (posible
    // reserva): la disponibilidad real por lote NO está confirmada, se deja en
    // 0 y se confirma lote a lote antes de vender.
    tiposDeLote: [
      { nombre: "Lote compacto ≈50–85 m² (≈72–120 v²)", area: 72, unidad: "v2", precio: 25182, disponibilidad: 0 },
      { nombre: "Lote estándar ≈90–140 m² (≈130–200 v²)", area: 130, unidad: "v2", precio: 44216, disponibilidad: 0 },
      { nombre: "Lote amplio hasta ≈200 m² (≈287 v²)", area: 287, unidad: "v2", precio: 105247, disponibilidad: 0 },
    ],
    servicios: [
      "Factibilidad de servicios básicos",
      "Caseta de seguridad",
      "Calles asfaltadas",
      "Cordón cuneta",
      "Aceras",
      "Áreas verdes jardinizadas",
      "Estacionamiento de visitas",
      "Planta de tratamiento",
      "Equipamiento social",
    ],
    // Ubicación aproximada de Lourdes Colón. PENDIENTE: ajustar al punto exacto
    // del proyecto (coordenadas marcadas como faltantes en el PPDS).
    ubicacion: { lat: 13.708, lng: -89.357 },
    seo: {
      titulo: "Villa Lourdes — Lotes residenciales en Lourdes Colón, La Libertad | DestinoPropiedades.com",
      metaDescripcion:
        "Lotes residenciales en Urbanización Villa Lourdes, Lourdes Colón, La Libertad: calles asfaltadas, servicios básicos, seguridad y áreas verdes. Desde $25,182 por lote. Consultá por WhatsApp.",
      ogImage: "/assets/og/villa-lourdes.jpg",
    },
    whatsappMensaje: mensajeWhatsapp("Villa Lourdes", "villa-lourdes"),
  },
];

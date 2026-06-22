// Zonas (departamento/municipio) para páginas SEO. Cada zona lista los
// proyectos relacionados (por departamento/municipio) y agrega contenido
// descriptivo y FAQ para posicionar en Google.

export interface FaqItem {
  pregunta: string;
  respuesta: string;
}

export interface Zona {
  slug: string;
  nombre: string;
  departamento: string;
  municipio: string | null;
  /**
   * Filtro opcional por tipo de proyecto. Si se define (p. ej. "playa"), la
   * zona solo agrupa proyectos de ese tipo dentro del departamento; así una
   * página "Lotes de playa en X" no captura proyectos residenciales de la
   * misma zona. Si se omite, agrupa todos los del departamento/municipio.
   */
  tipo?: "playa" | "urbano" | "residencial";
  descripcion: string;
  /** Segundo párrafo descriptivo (contexto/inversión) para SEO. */
  contexto: string;
  /** Ventajas de la zona, en viñetas. */
  ventajas: string[];
  faq: FaqItem[];
  /** SEO propio de la página de zona. */
  titulo: string;
  metaDescripcion: string;
}

export const zonas: Zona[] = [
  {
    slug: "lotes-de-playa-sonsonate",
    nombre: "Lotes de playa en Sonsonate",
    departamento: "Sonsonate",
    municipio: null,
    tipo: "playa",
    descripcion:
      "Sonsonate es uno de los departamentos costeros más buscados de El " +
      "Salvador, con playas como Los Cóbanos y Acajutla. La zona combina " +
      "acceso a carretera, infraestructura turística en crecimiento y " +
      "precios todavía accesibles frente a otras zonas costeras del país.",
    contexto:
      "Comprar un lote en la costa de Sonsonate es una forma concreta de " +
      "mantener raíces en El Salvador y, a la vez, invertir en una zona con " +
      "plusvalía al alza. Para la familia salvadoreña en el exterior, es la " +
      "posibilidad de tener un pedazo de tierra propio cerca del mar, con " +
      "respaldo legal y acompañamiento en cada paso.",
    ventajas: [
      "Acceso directo por carretera desde San Salvador y el occidente del país",
      "Playas reconocidas como Los Cóbanos y Acajutla",
      "Precios de lote todavía accesibles frente a otras zonas costeras",
      "Plusvalía en aumento por el crecimiento turístico",
    ],
    titulo: "Lotes de playa en Sonsonate — Acajutla y Los Cóbanos | DestinoPropiedades.com",
    metaDescripcion:
      "Lotes de playa en venta en Sonsonate, El Salvador: Acajutla y la costa del Pacífico. Servicios, precios y disponibilidad. Consultá por WhatsApp.",
    faq: [
      {
        pregunta: "¿Cuál es el precio típico de un lote de playa en Sonsonate?",
        respuesta:
          "Varía según cercanía a la playa y servicios, pero los lotes en " +
          "lotificaciones con acceso controlado suelen iniciar alrededor de " +
          "$25,000 a $30,000. Consultá el precio exacto de cada proyecto " +
          "por WhatsApp.",
      },
      {
        pregunta: "¿Se puede financiar la compra de un lote?",
        respuesta:
          "Depende del proyecto y del desarrollador. Algunos ofrecen planes " +
          "de pago directo; para crédito bancario, lo recomendable es " +
          "consultar con el desarrollador del proyecto específico.",
      },
      {
        pregunta: "¿Qué papeles debo revisar antes de comprar?",
        respuesta:
          "Como mínimo: escritura del inmueble matriz, permiso de " +
          "lotificación del municipio/Vice Ministerio de Vivienda, y que el " +
          "lote esté debidamente segregado a tu nombre al momento de la " +
          "escrituración.",
      },
      {
        pregunta: "¿Por qué invertir en esta zona?",
        respuesta:
          "La costa de Sonsonate ha tenido un crecimiento turístico " +
          "sostenido en los últimos años, lo que ha impulsado la plusvalía " +
          "de los terrenos cercanos a la playa.",
      },
    ],
  },
  {
    slug: "lotes-de-playa-la-libertad",
    nombre: "Lotes de playa en La Libertad",
    departamento: "La Libertad",
    municipio: null,
    tipo: "playa",
    descripcion:
      "La Libertad concentra algunas de las playas más reconocidas del " +
      "país, como El Zonte y Costa del Sol, con fuerte presencia de " +
      "turismo internacional y proyectos residenciales de playa.",
    contexto:
      "Es una de las zonas de mayor demanda del país, impulsada por el " +
      "turismo internacional y el auge de la 'Surf City'. Invertir en un " +
      "lote en La Libertad significa apostar a una zona consolidada, ideal " +
      "tanto para construir una casa de playa como para resguardar capital " +
      "en un terreno con alta proyección de plusvalía.",
    ventajas: [
      "Playas de fama internacional como El Zonte y El Tunco",
      "Impulso turístico sostenido por la iniciativa Surf City",
      "Cercanía relativa al Aeropuerto Internacional y a San Salvador",
      "Alta proyección de plusvalía y demanda de alquiler turístico",
    ],
    titulo: "Lotes de playa en La Libertad — El Zonte y Costa del Sol | DestinoPropiedades.com",
    metaDescripcion:
      "Lotes de playa en venta en La Libertad, El Salvador: El Zonte, Costa del Sol y Surf City. Precios, servicios y disponibilidad. Consultá por WhatsApp.",
    faq: [
      {
        pregunta: "¿Cuál es el precio típico de un lote de playa en La Libertad?",
        respuesta:
          "Por la demanda turística de la zona, los precios suelen ser " +
          "más altos que en otros departamentos costeros, iniciando " +
          "generalmente sobre los $30,000 según cercanía a la playa.",
      },
      {
        pregunta: "¿Se puede financiar la compra de un lote?",
        respuesta:
          "Algunos proyectos en preventa ofrecen planes de pago directo " +
          "con el desarrollador. Consultá las condiciones específicas de " +
          "cada proyecto por WhatsApp.",
      },
      {
        pregunta: "¿Qué papeles debo revisar antes de comprar?",
        respuesta:
          "Verificá la escritura matriz, el permiso de lotificación y que " +
          "el lote quede segregado a tu nombre en la escritura final.",
      },
      {
        pregunta: "¿Por qué invertir en esta zona?",
        respuesta:
          "El crecimiento turístico de zonas como El Zonte y Costa del Sol " +
          "ha generado una plusvalía sostenida en los terrenos cercanos.",
      },
    ],
  },
  {
    slug: "lotes-de-playa-ahuachapan",
    nombre: "Lotes de playa en Ahuachapán",
    departamento: "Ahuachapán",
    municipio: null,
    tipo: "playa",
    descripcion:
      "La costa de Ahuachapán, en el extremo occidente de El Salvador, " +
      "incluye zonas como Barra de Santiago y Punta Zapote: playas amplias, " +
      "manglares protegidos y un entorno todavía tranquilo, con lotes frente " +
      "al mar de mayor tamaño y precios competitivos frente a otras costas " +
      "del país.",
    contexto:
      "Para la familia salvadoreña en el exterior, un lote frente al mar en " +
      "Ahuachapán es la posibilidad de tener tierra propia en la costa como " +
      "patrimonio familiar, segunda casa o inversión turística-residencial. " +
      "Es una de las zonas costeras con mayor proyección a futuro por su " +
      "naturaleza y la disponibilidad de terrenos amplios.",
    ventajas: [
      "Lotes frente al mar de mayor tamaño que en otras costas del país",
      "Zonas naturales como Barra de Santiago y sus manglares",
      "Precios competitivos frente a La Libertad y la costa central",
      "Alta proyección de plusvalía por desarrollo turístico incipiente",
    ],
    titulo: "Lotes de playa en Ahuachapán — Barra de Santiago y Punta Zapote | DestinoPropiedades.com",
    metaDescripcion:
      "Lotes de playa frente al mar en Ahuachapán, El Salvador: Punta Zapote y Barra de Santiago. Lotes amplios con servicios. Precios y disponibilidad por WhatsApp.",
    faq: [
      {
        pregunta: "¿Cuál es el precio típico de un lote de playa en Ahuachapán?",
        respuesta:
          "Los lotes frente al mar en esta zona suelen ser más amplios, por " +
          "lo que el precio total varía según el tamaño; los proyectos con " +
          "amenidades inician alrededor de $65,000. Consultá el precio exacto " +
          "de cada lote por WhatsApp.",
      },
      {
        pregunta: "¿Se puede financiar la compra de un lote?",
        respuesta:
          "Algunos proyectos ofrecen planes de pago directo con el " +
          "desarrollador. Consultá las condiciones específicas de cada " +
          "proyecto por WhatsApp.",
      },
      {
        pregunta: "¿Qué papeles debo revisar antes de comprar?",
        respuesta:
          "Verificá la escritura matriz, el permiso de lotificación y que el " +
          "lote quede segregado a tu nombre en la escritura final.",
      },
      {
        pregunta: "¿Por qué invertir en esta zona?",
        respuesta:
          "La costa de Ahuachapán conserva terrenos amplios frente al mar a " +
          "precios competitivos, con una proyección de plusvalía impulsada " +
          "por el creciente interés turístico en el occidente del país.",
      },
    ],
  },
];

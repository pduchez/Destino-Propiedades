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

  // ── Zonas residenciales/urbanas (departamentos del centro y oriente) ──────
  // No llevan `tipo`: agrupan todos los proyectos del departamento.
  {
    slug: "lotes-en-chalatenango",
    nombre: "Lotes en Chalatenango",
    departamento: "Chalatenango",
    municipio: null,
    descripcion:
      "Chalatenango es un departamento del norte de El Salvador, de clima " +
      "fresco y paisaje montañoso, conectado con el resto del país por la " +
      "Carretera Longitudinal del Norte. Es una zona tranquila, ideal para " +
      "quien busca tierra para vivienda, retiro o patrimonio familiar a " +
      "precios accesibles.",
    contexto:
      "Para la familia salvadoreña en el exterior, un lote en Chalatenango " +
      "es la oportunidad de tener un pedazo de tierra propio en una zona de " +
      "raíces, con buen acceso vial y precios todavía bajos frente al Gran " +
      "San Salvador. Una opción concreta para construir a futuro o resguardar " +
      "capital en terreno.",
    ventajas: [
      "Conexión directa por la Carretera Longitudinal del Norte",
      "Clima fresco de montaña y entorno tranquilo",
      "Precios de lote accesibles frente a la zona central del país",
      "Ideal para vivienda, retiro o patrimonio familiar",
    ],
    titulo: "Lotes en Chalatenango — Lotificaciones residenciales | DestinoPropiedades.com",
    metaDescripcion:
      "Lotes residenciales en venta en Chalatenango, El Salvador: servicios básicos, acceso por la Longitudinal del Norte y precios accesibles. Consultá por WhatsApp.",
    faq: [
      {
        pregunta: "¿Cuál es el precio típico de un lote en Chalatenango?",
        respuesta:
          "En lotificaciones con servicios básicos, los lotes pueden iniciar " +
          "alrededor de $22,000. Consultá el precio exacto de cada proyecto " +
          "por WhatsApp.",
      },
      {
        pregunta: "¿Se puede financiar la compra de un lote?",
        respuesta:
          "Algunos proyectos ofrecen planes de pago directo con el " +
          "desarrollador. Consultá las condiciones de cada proyecto por " +
          "WhatsApp.",
      },
      {
        pregunta: "¿Qué papeles debo revisar antes de comprar?",
        respuesta:
          "Verificá la escritura matriz, el permiso de lotificación y que el " +
          "lote quede segregado a tu nombre en la escritura final.",
      },
      {
        pregunta: "¿Por qué comprar tierra en Chalatenango?",
        respuesta:
          "Es una zona de clima fresco, buen acceso vial y precios más bajos " +
          "que la zona central, atractiva para vivienda futura, retiro o como " +
          "patrimonio familiar.",
      },
    ],
  },
  {
    slug: "lotes-en-san-vicente",
    nombre: "Lotes en San Vicente",
    departamento: "San Vicente",
    municipio: null,
    descripcion:
      "San Vicente es un departamento del centro de El Salvador, a los pies " +
      "del volcán Chinchontepec y sobre el eje de la Carretera Panamericana. " +
      "Su ubicación central lo conecta con buena parte del país y lo hace " +
      "atractivo para vivienda e inversión en tierra.",
    contexto:
      "Comprar un lote en San Vicente es apostar a una zona céntrica y bien " +
      "comunicada, con proyectos residenciales que ofrecen servicios y " +
      "equipamiento. Para el salvadoreño en el exterior, es una forma de " +
      "construir patrimonio en el corazón del país con planes de pago " +
      "directos.",
    ventajas: [
      "Ubicación central con acceso por la Carretera Panamericana",
      "Entorno con servicios y equipamiento en proyectos consolidados",
      "Precios competitivos frente al Gran San Salvador",
      "Buena conectividad hacia el oriente y occidente del país",
    ],
    titulo: "Lotes en San Vicente — Lotificaciones residenciales | DestinoPropiedades.com",
    metaDescripcion:
      "Lotes residenciales en venta en San Vicente, El Salvador: servicios, áreas verdes y acceso por la Panamericana. Precios y disponibilidad por WhatsApp.",
    faq: [
      {
        pregunta: "¿Cuál es el precio típico de un lote en San Vicente?",
        respuesta:
          "En proyectos residenciales con servicios y amenidades, los lotes " +
          "pueden iniciar alrededor de $39,000. Consultá el precio exacto de " +
          "cada proyecto por WhatsApp.",
      },
      {
        pregunta: "¿Se puede financiar la compra de un lote?",
        respuesta:
          "Algunos proyectos ofrecen planes de pago directo con el " +
          "desarrollador. Consultá las condiciones de cada proyecto por " +
          "WhatsApp.",
      },
      {
        pregunta: "¿Qué papeles debo revisar antes de comprar?",
        respuesta:
          "Verificá la escritura matriz, el permiso de lotificación y que el " +
          "lote quede segregado a tu nombre en la escritura final.",
      },
      {
        pregunta: "¿Por qué comprar tierra en San Vicente?",
        respuesta:
          "Su ubicación central y la conexión por la Panamericana la hacen " +
          "una zona práctica para vivienda e inversión, con precios más " +
          "accesibles que la capital.",
      },
    ],
  },
  {
    slug: "lotes-en-usulutan",
    nombre: "Lotes en Usulután",
    departamento: "Usulután",
    municipio: null,
    descripcion:
      "Usulután es un departamento del oriente de El Salvador, atravesado " +
      "por la Carretera Litoral y cercano a la Bahía de Jiquilisco. Combina " +
      "zonas agrícolas, acceso a la costa y lotificaciones para vivienda, " +
      "inversión o negocio.",
    contexto:
      "Para la familia salvadoreña en el exterior, Usulután ofrece tierra a " +
      "precios competitivos en una zona conectada por la Litoral, con " +
      "proyectos tanto residenciales como de uso mixto (vivienda y comercio). " +
      "Una opción para construir patrimonio o emprender, con planes de pago " +
      "directos con el desarrollador.",
    ventajas: [
      "Acceso por la Carretera Litoral hacia el oriente del país",
      "Cercanía a la Bahía de Jiquilisco y a la costa",
      "Lotes residenciales y de uso mixto (vivienda y comercio)",
      "Precios competitivos frente a otras zonas del país",
    ],
    titulo: "Lotes en Usulután — Lotificaciones residenciales y de uso mixto | DestinoPropiedades.com",
    metaDescripcion:
      "Lotes en venta en Usulután, El Salvador: lotificaciones residenciales y de uso mixto sobre la Carretera Litoral, cerca de Jiquilisco. Precios y disponibilidad por WhatsApp.",
    faq: [
      {
        pregunta: "¿Cuál es el precio típico de un lote en Usulután?",
        respuesta:
          "Depende del proyecto y del uso (habitacional o comercial), pero " +
          "los lotes pueden iniciar alrededor de $34,000. Consultá el precio " +
          "exacto de cada proyecto por WhatsApp.",
      },
      {
        pregunta: "¿Hay lotes para negocio, no solo para vivienda?",
        respuesta:
          "Sí. En Usulután tenemos lotificaciones de uso mixto con parcelas " +
          "pensadas para centros comerciales, además de lotes habitacionales. " +
          "Consultá la opción que buscás por WhatsApp.",
      },
      {
        pregunta: "¿Qué papeles debo revisar antes de comprar?",
        respuesta:
          "Verificá la escritura matriz, el permiso de lotificación y que el " +
          "lote quede segregado a tu nombre en la escritura final.",
      },
      {
        pregunta: "¿Por qué comprar tierra en Usulután?",
        respuesta:
          "Es una zona del oriente bien conectada por la Litoral y cercana a " +
          "la costa, con tierra a precios competitivos para vivienda, " +
          "inversión o negocio.",
      },
    ],
  },
];

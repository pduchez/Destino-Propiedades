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
  descripcion: string;
  faq: FaqItem[];
}

export const zonas: Zona[] = [
  {
    slug: "lotes-de-playa-sonsonate",
    nombre: "Lotes de playa en Sonsonate",
    departamento: "Sonsonate",
    municipio: null,
    descripcion:
      "Sonsonate es uno de los departamentos costeros más buscados de El " +
      "Salvador, con playas como Los Cóbanos y Acajutla. La zona combina " +
      "acceso a carretera, infraestructura turística en crecimiento y " +
      "precios todavía accesibles frente a otras zonas costeras del país.",
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
    descripcion:
      "La Libertad concentra algunas de las playas más reconocidas del " +
      "país, como El Zonte y Costa del Sol, con fuerte presencia de " +
      "turismo internacional y proyectos residenciales de playa.",
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
];

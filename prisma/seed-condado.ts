/**
 * Seed de ejemplo: deja LISTO el proyecto "Condado del Golfo" con DATOS REALES
 * y VERIFICADOS tomados del portal DestinoPropiedades.com (no inventados).
 *
 * Fuente: ficha real del proyecto en el portal
 * (https://destinopropiedades.com/proyectos/condado-del-golfo/ ·
 *  mirror live: https://pduchez.github.io/Destino-Propiedades/proyectos/condado-del-golfo/).
 * Precio REAL: "Desde $24,693 por lote" (NO $120,000 — eso era un dato de
 * ejemplo equivocado que se corrige aquí). Lógica comercial: se lidera SIEMPRE
 * con el precio de entrada "desde", el más accesible, nunca el más caro.
 *
 * La GENERACIÓN de los posts se hace desde el dashboard (en tiempo real, con la
 * API key del despliegue) para que sea transparente y verificable — no en el
 * build. Se ejecuta en el build de Vercel. Idempotente. Nunca rompe el build.
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_MASTER_INSTRUCTION } from "../src/lib/ai/masterInstruction";

const prisma = new PrismaClient();

const SLUG = "condado-del-golfo";

// URL viva del proyecto en el portal (sirve para "Importar fotos/datos").
const PORTAL_URL =
  "https://pduchez.github.io/Destino-Propiedades/proyectos/condado-del-golfo/";

// WhatsApp real del portal (visible en el encabezado del sitio).
const WHATSAPP = "+503 2439 0900";

// Ficha específica del proyecto con DATOS REALES y lógica comercial.
const FICHA = `PROYECTO: Condado del Golfo (Lotificación residencial Bella Vista "Condado del Golfo").
Desarrollador: Grupo Inmobiliario Chacón.
Ubicación REAL: Conchagua, La Unión, El Salvador — sobre el bulevar, a ½ km de la ciudad de La Unión.
Tipo: Lotificación residencial (261 lotes).

PRECIO REAL (¡dato verificado del portal!): Desde $24,693 por lote.
Rango de lotes: $24,693 (compacto) a $50,726 (gran formato).
LÓGICA COMERCIAL — OBLIGATORIA: se promociona SIEMPRE el precio de ENTRADA "Desde $24,693 por lote" (el más accesible). PROHIBIDO promocionar el precio más caro o un precio que no exista en la lista. El precio bajo de entrada es el gancho de accesibilidad; neutraliza la objeción "me parece caro".
Financiamiento: directo con el desarrollador. NO inventar % de prima, cuotas ni plazos exactos si no están confirmados.

PERSONAS: María (55–72, retiro/legado/nostalgia, "volver a casa") como primaria; Carlos (42–55, inversión y patrimonio en zona en crecimiento) como secundaria. La objeción de precio se vence con el "Desde $24,693" + financiamiento directo.

ÁNGULO: "Volver, invertir y construir patrimonio familiar" con vista al Golfo de Fonseca y a los volcanes. Comunidad real: casa club, ciclovía, zona pet-friendly, áreas verdes, seguridad. Cerca de servicios (Hospital Nacional de La Unión).

AMENIDADES REALES (no agregar otras): caseta de seguridad, factibilidades de servicios básicos, calles asfaltadas, cordón cuneta, aceras, áreas verdes jardinizadas, casa club, ciclovía, estacionamiento de visitas, zona pet-friendly.

TONO: claridad máxima, trato de "usted" para María, fotos cálidas (vista al Golfo, comunidad), cero jerga, CTA simple a WhatsApp.
WhatsApp: ${WHATSAPP}.

NO INVENTAR: disponibilidad exacta por lote (confirmar lote a lote), metros cuadrados exactos, % de financiamiento, ni amenidades fuera de la lista. Usar SOLO la información real del portal.`;

// Fotos REALES del proyecto (tomas aéreas de dron) servidas por el portal.
const IMAGES: { url: string; alt: string }[] = [
  {
    url: "https://pduchez.github.io/Destino-Propiedades/assets/proyectos/condado-del-golfo/panoramica-golfo.webp",
    alt: "Panorámica con vista al Golfo de Fonseca y los volcanes",
  },
  {
    url: "https://pduchez.github.io/Destino-Propiedades/assets/proyectos/condado-del-golfo/vista-aerea.webp",
    alt: "Vista aérea de calles internas y lotes",
  },
  {
    url: "https://pduchez.github.io/Destino-Propiedades/assets/proyectos/condado-del-golfo/entrada-casas.webp",
    alt: "Entrada y casas terminadas",
  },
  {
    url: "https://pduchez.github.io/Destino-Propiedades/assets/proyectos/condado-del-golfo/calles.webp",
    alt: "Calles con cordón cuneta",
  },
  {
    url: "https://pduchez.github.io/Destino-Propiedades/assets/proyectos/condado-del-golfo/obra.webp",
    alt: "Obra en avance",
  },
  {
    url: "https://pduchez.github.io/Destino-Propiedades/assets/proyectos/condado-del-golfo/plano.webp",
    alt: "Plano real de distribución",
  },
];

async function main() {
  // Asegura la Instrucción Madre por defecto.
  const brand = await prisma.brandStrategy.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  if (!brand.masterInstruction || !brand.masterInstruction.trim()) {
    await prisma.brandStrategy.update({
      where: { id: "default" },
      data: { masterInstruction: DEFAULT_MASTER_INSTRUCTION },
    });
  }

  // Upsert del proyecto Condado del Golfo con DATOS REALES.
  // En update también corregimos los campos clave (precio/ubicación/descripción)
  // por si quedó sembrado con los valores antiguos equivocados.
  const realData = {
    location: "Conchagua, La Unión, El Salvador",
    propertyType: "Lotificación residencial",
    status: "active",
    priceFrom: "24,693",
    currency: "USD",
    description:
      'Lotificación residencial Bella Vista "Condado del Golfo", en Conchagua, ' +
      "sobre el bulevar a ½ km de la ciudad de La Unión. Comunidad con calles " +
      "asfaltadas, cordón cuneta, aceras, áreas verdes jardinizadas, casa club, " +
      "ciclovía y zona pet-friendly, con caseta de seguridad y factibilidades de " +
      "servicios básicos. Con vista al Golfo de Fonseca y a los volcanes. Una " +
      "opción para volver, invertir y construir patrimonio familiar, cerca de " +
      "servicios como el Hospital Nacional de La Unión. Desde $24,693 por lote.",
    amenities: JSON.stringify([
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
    ]),
    highlights: JSON.stringify([
      "Desde $24,693 por lote (precio de entrada accesible)",
      "Vista al Golfo de Fonseca y a los volcanes",
      "A ½ km de la ciudad de La Unión, sobre el bulevar",
      "Comunidad con casa club, ciclovía y zona pet-friendly",
      "Financiamiento directo con el desarrollador",
    ]),
    hashtags: JSON.stringify([
      "#CondadoDelGolfo",
      "#Conchagua",
      "#LaUnión",
      "#DestinoPropiedades",
    ]),
    websiteUrl: PORTAL_URL,
    contactInfo: `WhatsApp ${WHATSAPP}`,
    instructionDoc: FICHA,
  };

  const project = await prisma.project.upsert({
    where: { slug: SLUG },
    update: realData,
    create: { name: "Condado del Golfo", slug: SLUG, ...realData },
  });

  // Reemplaza fotos de stock antiguas (Unsplash) por las fotos REALES del portal.
  const existing = await prisma.asset.findMany({
    where: { projectId: project.id },
    select: { url: true },
  });
  const have = new Set(existing.map((a) => a.url));
  // Limpia las imágenes Unsplash de ejemplo si quedaron sembradas antes.
  await prisma.asset.deleteMany({
    where: { projectId: project.id, url: { contains: "unsplash.com" } },
  });
  for (const img of IMAGES) {
    if (have.has(img.url)) continue;
    await prisma.asset.create({
      data: {
        projectId: project.id,
        filename: img.url,
        originalName: img.url.split("/").pop() || "imagen",
        url: img.url,
        mimeType: "image/webp",
        tags: JSON.stringify(["portal", SLUG, img.alt]),
      },
    });
  }

  console.log(
    "[seed-condado] Condado del Golfo con DATOS REALES (Desde $24,693, Conchagua/La Unión) y 6 fotos reales del portal.",
  );
}

main()
  .catch((e) => console.error("[seed-condado] Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });

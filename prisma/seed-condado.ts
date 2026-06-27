/**
 * Seed de ejemplo: deja LISTO el proyecto "Condado del Golfo" (datos de la
 * Instrucción Madre) con su ficha (target María/residencial) e imágenes de
 * stock públicas, para que el operador solo tenga que ir a "Generar".
 *
 * La GENERACIÓN de los posts se hace desde el dashboard (en tiempo real, con la
 * API key del despliegue) para que sea transparente y verificable — no en el
 * build. Así nunca queda contenido "fantasma" generado a ciegas.
 *
 * Se ejecuta en el build de Vercel. Idempotente. Nunca rompe el build.
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_MASTER_INSTRUCTION } from "../src/lib/ai/masterInstruction";

const prisma = new PrismaClient();

const SLUG = "condado-del-golfo";

const FICHA = `Tipo: Residencial. Ubicación: Usulután, El Salvador.
Persona primaria: María (Diáspora Lifestyle, 55–72) — hogar de retiro, nostalgia, legado familiar. Objeción: "me parece muy caro". Gatillo: nostalgia, pertenencia, familia.
Tono: claridad máxima, trato de "usted", fotos cálidas (familia, naturaleza), cero jerga, CTA grande y simple.
Ángulo: "Volver a casa" — un hogar de retiro accesible, con financiamiento a largo plazo. Sube narrativa emocional + confianza; baja datos técnicos.
Acento de color: #84CC16 (residencial/comunidad).
Rango de precio: USD 120,000–250,000.
Destino: WhatsApp (el número exacto está pendiente de confirmar por el operador; usa un CTA genérico a WhatsApp o al portal mientras tanto).
No inventar: financiamiento exacto, m², fotos hero ni número de WhatsApp si no se han confirmado.`;

const IMAGES = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&q=80",
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

  // Upsert del proyecto Condado del Golfo + ficha.
  const project = await prisma.project.upsert({
    where: { slug: SLUG },
    update: { instructionDoc: FICHA },
    create: {
      name: "Condado del Golfo",
      slug: SLUG,
      location: "Usulután, El Salvador",
      propertyType: "Residencial",
      status: "active",
      priceFrom: "120,000",
      currency: "USD",
      description:
        "Proyecto residencial en Usulután, pensado como hogar de retiro accesible para la diáspora salvadoreña. Rango USD 120,000–250,000, con opción de financiamiento a largo plazo.",
      amenities: JSON.stringify(["Comunidad cerrada", "Zonas verdes", "Espacios familiares"]),
      highlights: JSON.stringify([
        "Hogar de retiro accesible",
        "Financiamiento a largo plazo",
        "Volver a casa con tranquilidad",
      ]),
      hashtags: JSON.stringify(["#CondadoDelGolfo", "#Usulután"]),
      websiteUrl: "https://destinopropiedades.com",
      contactInfo: "",
      instructionDoc: FICHA,
    },
  });

  // Imágenes de stock públicas (solo si el proyecto no tiene ninguna).
  const assetCount = await prisma.asset.count({ where: { projectId: project.id } });
  if (assetCount === 0) {
    for (const url of IMAGES) {
      await prisma.asset.create({
        data: {
          projectId: project.id,
          filename: url,
          originalName: url.split("/").pop() || "imagen",
          url,
          mimeType: "image/jpeg",
          tags: JSON.stringify(["residencial"]),
        },
      });
    }
  }

  console.log("[seed-condado] Proyecto e imágenes listos. Genera los posts desde el dashboard.");
}

main()
  .catch((e) => console.error("[seed-condado] Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });

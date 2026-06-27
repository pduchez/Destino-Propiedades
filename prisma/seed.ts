/**
 * Seed inicial: crea la estrategia de marca por defecto, las 4 cuentas sociales
 * (deshabilitadas hasta configurar credenciales) y un proyecto de ejemplo.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Estrategia de marca (singleton)
  await prisma.brandStrategy.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      brandName: "Destino Propiedades",
      portalUrl: "https://destinopropiedades.com",
      mission:
        "Conectar a las personas con el inmueble que transforma su estilo de vida, ofreciendo proyectos seleccionados con confianza y acompañamiento experto.",
      toneOfVoice:
        "Cercano, aspiracional, profesional y confiable. Evita tecnicismos. Habla de estilo de vida, no solo de metros cuadrados.",
      targetAudience:
        "Familias e inversionistas de 28 a 55 años interesados en vivienda propia, segunda vivienda o inversión inmobiliaria.",
      generalInstructions:
        "Resalta beneficios de ubicación, calidad de vida y oportunidad de inversión. Incluye siempre un llamado a la acción claro (agendar visita, escribir por WhatsApp, visitar el portal). No inventes precios ni características que no estén en la ficha del proyecto.",
      defaultHashtags: JSON.stringify([
        "#DestinoPropiedades",
        "#BienesRaíces",
        "#InversiónInmobiliaria",
        "#TuNuevoHogar",
      ]),
      language: "es",
    },
  });

  // Cuentas sociales (deshabilitadas hasta configurar credenciales en /settings)
  const networks: { network: string; displayName: string }[] = [
    { network: "facebook", displayName: "Facebook — Destino Propiedades" },
    { network: "instagram", displayName: "Instagram — @destinopropiedades" },
    { network: "x", displayName: "X — @destinoprop" },
    { network: "tiktok", displayName: "TikTok — @destinopropiedades" },
  ];
  for (const n of networks) {
    await prisma.socialAccount.upsert({
      where: { network: n.network },
      update: {},
      create: { network: n.network, displayName: n.displayName },
    });
  }

  // Proyecto de ejemplo
  const exists = await prisma.project.findUnique({ where: { slug: "mirador-del-valle" } });
  if (!exists) {
    await prisma.project.create({
      data: {
        name: "Mirador del Valle",
        slug: "mirador-del-valle",
        location: "Envigado, Antioquia",
        propertyType: "Apartamento",
        status: "active",
        priceFrom: "320.000.000",
        currency: "COP",
        description:
          "Apartamentos de 2 y 3 alcobas con vista al valle, a 5 minutos del parque principal. Zona en valorización.",
        amenities: JSON.stringify([
          "Piscina",
          "Gimnasio",
          "Coworking",
          "Zonas verdes",
          "Parqueadero de visitantes",
        ]),
        highlights: JSON.stringify([
          "Vista panorámica al valle",
          "Entrega en 2026",
          "Cuota inicial financiada a 24 meses",
        ]),
        hashtags: JSON.stringify(["#MiradorDelValle", "#Envigado"]),
        websiteUrl: "https://destinopropiedades.com/mirador-del-valle",
        contactInfo: "WhatsApp: +57 300 000 0000",
      },
    });
  }

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

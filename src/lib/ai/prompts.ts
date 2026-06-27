import { NETWORK_META, type Network } from "@/lib/networks";

export interface BrandContext {
  brandName: string;
  portalUrl: string;
  mission: string;
  toneOfVoice: string;
  targetAudience: string;
  generalInstructions: string;
  defaultHashtags: string[];
  language: string;
}

export interface ProjectContext {
  name: string;
  location: string;
  propertyType: string;
  priceFrom: string;
  currency: string;
  description: string;
  amenities: string[];
  highlights: string[];
  hashtags: string[];
  websiteUrl: string;
  contactInfo: string;
}

export interface CampaignContext {
  name: string;
  objective: string;
  instructions: string;
}

export interface GenerationInput {
  brand: BrandContext;
  project?: ProjectContext | null;
  campaign?: CampaignContext | null;
  network: Network;
  /** Texto alternativo/descripción de la imagen elegida del stock, si existe. */
  imageHint?: string | null;
}

/** Prompt de sistema: define el rol del agente de mercadeo. */
export function buildSystemPrompt(brand: BrandContext): string {
  const langName = brand.language === "es" ? "español" : brand.language;
  return [
    `Eres el estratega de redes sociales del portal inmobiliario "${brand.brandName}" (${brand.portalUrl}).`,
    `Tu trabajo es redactar publicaciones para redes sociales que generen interés, confianza y contactos (leads).`,
    `Escribe SIEMPRE en ${langName}.`,
    ``,
    `Tono de voz de la marca: ${brand.toneOfVoice || "profesional y cercano"}.`,
    brand.mission ? `Misión: ${brand.mission}` : "",
    brand.targetAudience ? `Audiencia objetivo: ${brand.targetAudience}` : "",
    brand.generalInstructions
      ? `Lineamientos generales de mercadeo: ${brand.generalInstructions}`
      : "",
    ``,
    `Reglas:`,
    `- No inventes precios, fechas de entrega ni características que no aparezcan en los datos del proyecto.`,
    `- Si no hay datos suficientes, mantén el mensaje aspiracional pero genérico.`,
    `- Incluye un llamado a la acción claro.`,
    `- Devuelve EXCLUSIVAMENTE el contenido pedido en el formato estructurado solicitado.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Prompt de usuario: contexto del proyecto/campaña + restricciones de la red. */
export function buildUserPrompt(input: GenerationInput): string {
  const meta = NETWORK_META[input.network];
  const lines: string[] = [];

  lines.push(`Genera UNA publicación para ${meta.label}.`);
  lines.push("");
  lines.push(`Guía de estilo de ${meta.label}: ${meta.styleGuide}`);
  lines.push(
    `Longitud máxima del cuerpo (sin contar hashtags): ${meta.captionLimit} caracteres.`,
  );
  lines.push(
    `Cantidad de hashtags: entre ${meta.hashtagRange[0]} y ${meta.hashtagRange[1]}.`,
  );
  if (meta.requiresVideo) {
    lines.push(
      `Nota: TikTok usa video vertical. El caption debe funcionar como descripción de un reel/video del proyecto.`,
    );
  }
  lines.push("");

  if (input.project) {
    const p = input.project;
    lines.push(`### Proyecto inmobiliario`);
    lines.push(`- Nombre: ${p.name}`);
    if (p.location) lines.push(`- Ubicación: ${p.location}`);
    if (p.propertyType) lines.push(`- Tipo: ${p.propertyType}`);
    if (p.priceFrom) lines.push(`- Precio desde: ${p.priceFrom} ${p.currency}`);
    if (p.description) lines.push(`- Descripción: ${p.description}`);
    if (p.amenities.length) lines.push(`- Amenidades: ${p.amenities.join(", ")}`);
    if (p.highlights.length)
      lines.push(`- Puntos destacados: ${p.highlights.join(", ")}`);
    if (p.contactInfo) lines.push(`- Contacto: ${p.contactInfo}`);
    if (p.websiteUrl) lines.push(`- URL: ${p.websiteUrl}`);
    lines.push("");
  } else {
    lines.push(
      `### Publicación institucional del portal (sin proyecto específico). Habla del portal y su propuesta de valor.`,
    );
    lines.push("");
  }

  if (input.campaign) {
    lines.push(`### Campaña activa`);
    lines.push(`- Nombre: ${input.campaign.name}`);
    lines.push(`- Objetivo: ${input.campaign.objective}`);
    if (input.campaign.instructions)
      lines.push(`- Instrucción específica: ${input.campaign.instructions}`);
    lines.push("");
  }

  if (input.imageHint) {
    lines.push(
      `### Imagen que acompañará el post: ${input.imageHint}. Asegúrate de que el texto sea coherente con ella.`,
    );
    lines.push("");
  }

  // Hashtags sugeridos para que la IA priorice / combine
  const suggested = [
    ...input.brand.defaultHashtags,
    ...(input.project?.hashtags ?? []),
  ];
  if (suggested.length) {
    lines.push(
      `Hashtags de marca/proyecto que puedes incorporar si encajan: ${suggested.join(
        " ",
      )}`,
    );
    lines.push("");
  }

  lines.push(
    `Responde con: el cuerpo del post (caption), una lista de hashtags (sin el cuerpo), y un llamado a la acción (callToAction) breve.`,
  );

  return lines.join("\n");
}

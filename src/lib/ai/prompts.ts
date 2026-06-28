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
  /** Instrucción Madre: prompt raíz estratégico de la marca. */
  masterInstruction?: string;
  /** Aprendizajes del sistema de autoevaluación (ajustes basados en métricas). */
  learnings?: string;
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
  /** Ficha/instrucción específica del proyecto (target, narrativa, persona…). */
  instructionDoc?: string;
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
  const lines: string[] = [
    `Eres el estratega de redes sociales del portal inmobiliario "${brand.brandName}" (${brand.portalUrl}).`,
    `Tu trabajo es redactar publicaciones para redes sociales que generen interés, confianza y contactos (leads).`,
    `Escribe SIEMPRE en ${langName}.`,
    ``,
  ];

  // Instrucción Madre (prompt raíz de marca), si existe: es la autoridad estratégica.
  if (brand.masterInstruction && brand.masterInstruction.trim()) {
    lines.push(
      `### INSTRUCCIÓN MADRE DE LA MARCA (autoridad estratégica — síguela para voz, ángulo, persona y guardrails):`,
      brand.masterInstruction.trim(),
      ``,
      `IMPORTANTE sobre la Instrucción Madre: úsala para definir tono, narrativa, persona y reglas. Pero tu tarea concreta AHORA es redactar el copy de UNA publicación para la red indicada. Ignora cualquier parte del documento que hable de formatos de salida JSON, calendarios o contratos de esquema: eso lo maneja otro módulo.`,
      ``,
    );
  } else {
    if (brand.toneOfVoice)
      lines.push(`Tono de voz de la marca: ${brand.toneOfVoice}.`);
    if (brand.mission) lines.push(`Misión: ${brand.mission}`);
    if (brand.targetAudience)
      lines.push(`Audiencia objetivo: ${brand.targetAudience}`);
    if (brand.generalInstructions)
      lines.push(`Lineamientos generales de mercadeo: ${brand.generalInstructions}`);
    lines.push(``);
  }

  // Aprendizajes del sistema de autoevaluación: ajustan la estrategia con base
  // en el rendimiento real (qué funcionó por red/proyecto).
  if (brand.learnings && brand.learnings.trim()) {
    lines.push(
      ``,
      `### APRENDIZAJES DE RENDIMIENTO (ajustes basados en métricas reales — aplícalos para mejorar el impacto):`,
      brand.learnings.trim(),
      ``,
    );
  }

  lines.push(
    `Reglas de redacción:`,
    `- No inventes precios, fechas de entrega ni características que no aparezcan en los datos del proyecto.`,
    `- Si mencionas precio, usa SIEMPRE el "precio desde" (de entrada, el más accesible) que aparece en los datos. Nunca el más caro ni un rango alto: el precio bajo es el gancho que abre la conversación.`,
    `- Si falta un dato, omítelo con naturalidad. NUNCA escribas marcadores como [REQUIERE_DATO] dentro del texto publicable.`,
    `- Incluye un llamado a la acción claro.`,
    `- Devuelve EXCLUSIVAMENTE el contenido pedido en el formato estructurado solicitado.`,
  );

  return lines.filter((l) => l !== undefined).join("\n");
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
    if (p.priceFrom) {
      lines.push(`- Precio desde (ENTRADA, el más accesible): ${p.priceFrom} ${p.currency}`);
      lines.push(
        `  · Lógica comercial OBLIGATORIA: si mencionas precio, usa EXACTAMENTE este "desde ${p.priceFrom} ${p.currency}". Nunca inventes otra cifra, ni un precio mayor, ni un rango alto.`,
      );
    }
    if (p.description) lines.push(`- Descripción: ${p.description}`);
    if (p.amenities.length) lines.push(`- Amenidades: ${p.amenities.join(", ")}`);
    if (p.highlights.length)
      lines.push(`- Puntos destacados: ${p.highlights.join(", ")}`);
    if (p.contactInfo) lines.push(`- Contacto: ${p.contactInfo}`);
    if (p.websiteUrl) lines.push(`- URL: ${p.websiteUrl}`);
    if (p.instructionDoc && p.instructionDoc.trim()) {
      lines.push("");
      lines.push(
        `### Ficha/instrucción específica de este proyecto (AUTORIDAD: tiene prioridad sobre los defaults generales — respeta su target, persona y narrativa):`,
      );
      lines.push(p.instructionDoc.trim());
    }
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

// URL base del portal para enlaces absolutos (JSON-LD, OG). En la app
// unificada el portal vive en la raíz del dominio de producción.
export const SITE = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://destinopropiedades.com",
);

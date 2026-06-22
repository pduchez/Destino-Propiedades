// Helpers para armar enlaces de WhatsApp consistentes en todo el sitio.

/** Quita espacios y deja solo el + inicial y dígitos, para usar en wa.me/. */
export function normalizarNumero(numero: string): string {
  return numero.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function linkWhatsapp(numero: string, mensaje: string): string {
  const numeroLimpio = normalizarNumero(numero);
  return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
}

export function linkLlamar(numero: string): string {
  return `tel:${normalizarNumero(numero)}`;
}

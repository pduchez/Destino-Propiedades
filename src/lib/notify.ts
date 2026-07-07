/**
 * Envío de mensajes por WhatsApp. Usa la WhatsApp Cloud API de Meta si están
 * configuradas las credenciales (WHATSAPP_TOKEN + WHATSAPP_PHONE_ID). Si no,
 * queda en "modo vista previa": no envía nada real pero devuelve el texto para
 * que el director lo revise. Así el módulo funciona hoy y sólo falta conectar
 * las credenciales para que entregue de verdad.
 */
export interface DeliveryResult {
  delivered: boolean;
  preview: boolean;
  to: string;
  text: string;
  error?: string;
}

export function whatsappConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export async function sendWhatsApp(to: string, text: string): Promise<DeliveryResult> {
  const phone = to.replace(/[^0-9]/g, "");
  if (!phone) return { delivered: false, preview: false, to, text, error: "Sin número destino" };
  if (!whatsappConfigured()) {
    return { delivered: false, preview: true, to: phone, text };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: text },
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { delivered: false, preview: false, to: phone, text, error: `HTTP ${res.status} ${detail.slice(0, 200)}` };
    }
    return { delivered: true, preview: false, to: phone, text };
  } catch (e) {
    return { delivered: false, preview: false, to: phone, text, error: (e as Error).message };
  }
}

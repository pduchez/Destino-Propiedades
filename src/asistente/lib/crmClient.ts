// Cliente del frontend del Asistente hacia la API interna del portal
// (/api/asistente/disponibilidad), que se integra con el CRM de DestinoPropiedades.
// El frontend nunca habla directo con la base de datos: siempre pasa por la API.

export interface DisponibilidadResp {
  loteId: string;
  estado: "libre" | "reservado" | "vendido" | "desconocido";
  modo: "crm" | "autonomo";
  detalle?: string;
  leadId?: string | null;
}

/** Datos que viajan al bloquear un lote (crean/actualizan el lead en el CRM). */
export interface BloqueoPayload {
  loteId: string;
  proyectoId: string;
  proyectoNombre: string;
  poligono: string;
  numero: number;
  precio: number;
  prospecto: string;
  telefono?: string;
  calificacion?: string;
  perfil?: string;
  notas?: string;
}

async function safeJson(res: Response): Promise<DisponibilidadResp | null> {
  try {
    return (await res.json()) as DisponibilidadResp;
  } catch {
    return null;
  }
}

export async function consultarDisponibilidad(
  loteId: string
): Promise<DisponibilidadResp> {
  try {
    const res = await fetch(
      `/api/asistente/disponibilidad?loteId=${encodeURIComponent(loteId)}`,
      { cache: "no-store" }
    );
    const data = await safeJson(res);
    if (data) return data;
  } catch {
    /* la red puede fallar durante la cita; degradamos con gracia */
  }
  return { loteId, estado: "desconocido", modo: "autonomo" };
}

/** Marca el lote como "En trámite / Reservado" y lo registra en el CRM. */
export async function bloquearLote(
  payload: BloqueoPayload
): Promise<DisponibilidadResp> {
  try {
    const res = await fetch(`/api/asistente/disponibilidad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    if (data) return data;
  } catch {
    /* no bloqueamos el cierre por un fallo de red */
  }
  return { loteId: payload.loteId, estado: "desconocido", modo: "autonomo" };
}

// Generación de la "CARTA COMPROMISO DE RESERVACIÓN DE LOTE" con jsPDF.
// El PDF resultante es aplanado (no editable) y lleva timestamp.

import { jsPDF } from "jspdf";
import type { Cotizacion } from "./calc";
import type { Lote, Proyecto } from "@/asistente/data/proyectos";
import { money, fechaLarga } from "./format";

export interface CartaPdfData {
  proyecto: Proyecto;
  lote: Lote;
  cotizacion: Cotizacion;
  nombreCliente: string;
  dui: string;
  fecha: string; // ISO
  montoReservacion: number;
  complementoPrima: number;
  fechaLimiteComplemento: string; // ISO
  comentarios?: string;
  firmaClienteDataUrl: string | null;
  firmaEjecutivoDataUrl: string | null;
}

const MARINO = "#0f2743";
const GRIS = "#4b5563";

export function generarCartaPdf(d: CartaPdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const M = 56; // margen
  let y = 56;

  // --- Encabezado ---
  doc.setFillColor(MARINO);
  doc.rect(0, 0, W, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(MARINO);
  doc.setFontSize(15);
  doc.text("CARTA COMPROMISO DE RESERVACIÓN DE LOTE", W / 2, y, {
    align: "center",
  });
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(GRIS);
  doc.text(d.proyecto.lotificacion, W / 2, y, { align: "center" });
  y += 13;
  doc.setFontSize(8.5);
  doc.text(d.proyecto.ubicacion, W / 2, y, { align: "center" });
  y += 22;

  doc.setDrawColor(210);
  doc.line(M, y, W - M, y);
  y += 22;

  // --- Cuerpo ---
  doc.setTextColor(GRIS);
  doc.setFontSize(10.5);
  const intro = `En la fecha ${fechaLarga(
    d.fecha
  )}, se hace constar que el/la cliente ${d.nombreCliente || "________"}, ` +
    `con Documento Único de Identidad número ${d.dui || "________"}, entrega en concepto de ` +
    `reservación la cantidad de ${money(d.montoReservacion)}, para reservar el lote descrito a continuación:`;
  const introLines = doc.splitTextToSize(intro, W - M * 2);
  doc.text(introLines, M, y);
  y += introLines.length * 14 + 8;

  // --- Tabla de datos ---
  const filas: [string, string][] = [
    ["Lotificación", d.proyecto.lotificacion],
    ["Lote N°", String(d.lote.numero)],
    ["Polígono", d.lote.poligono],
    ["Calle", d.lote.calle],
    ["Pasaje", d.lote.pasaje],
    ["Área", `${d.lote.areaV2.toFixed(2)} V²`],
    ["Precio de venta al contado", money(d.cotizacion.precioContado)],
    ["Prima requerida", money(d.cotizacion.primaRequerida)],
    ["Cantidad recibida (reservación)", money(d.montoReservacion)],
    ["Complemento de prima", money(d.complementoPrima)],
    ["Fecha límite del complemento", fechaLarga(d.fechaLimiteComplemento)],
    [
      "Financiamiento",
      `${d.cotizacion.anos} años (${d.cotizacion.meses} meses)`,
    ],
    ["Cuota mensual", money(d.cotizacion.cuotaMensual)],
    [
      "Valor del inmueble con financiamiento",
      money(d.cotizacion.valorConFinanciamiento),
    ],
  ];

  const rowH = 20;
  const labelW = 240;
  filas.forEach((f, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(M, y - 14, W - M * 2, rowH, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(MARINO);
    doc.setFontSize(9.5);
    doc.text(f[0], M + 6, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(GRIS);
    doc.text(f[1], M + labelW, y);
    y += rowH;
  });

  y += 10;

  // --- Comentarios del vendedor (si los hay) ---
  const comentarios = (d.comentarios || "").trim();
  if (comentarios) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(MARINO);
    doc.text("Comentarios:", M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(GRIS);
    const comLines = doc.splitTextToSize(comentarios, W - M * 2);
    doc.text(comLines, M, y);
    y += comLines.length * 12 + 8;
  }

  doc.setFontSize(8.5);
  doc.setTextColor(GRIS);
  const nota =
    "El complemento de prima deberá completarse en la fecha límite indicada. " +
    "El incumplimiento del pago del complemento deja sin efecto la presente reservación.";
  const notaLines = doc.splitTextToSize(nota, W - M * 2);
  doc.text(notaLines, M, y);
  y += notaLines.length * 12 + 30;

  // --- Firmas ---
  const firmaW = (W - M * 2 - 40) / 2;
  const firmaY = y;
  const firmaBoxH = 60;

  function firmaBox(x: number, dataUrl: string | null, etiqueta: string) {
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", x, firmaY, firmaW, firmaBoxH);
      } catch {
        /* firma inválida: se deja la línea vacía */
      }
    }
    const lineY = firmaY + firmaBoxH + 4;
    doc.setDrawColor(120);
    doc.line(x, lineY, x + firmaW, lineY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(MARINO);
    doc.text(etiqueta, x + firmaW / 2, lineY + 14, { align: "center" });
  }

  firmaBox(M, d.firmaClienteDataUrl, "Cliente");
  firmaBox(M + firmaW + 40, d.firmaEjecutivoDataUrl, "Ejecutivo Inmobiliario");

  // --- Pie con timestamp (documento inmutable) ---
  const stamp = new Date();
  const stampStr = stamp.toLocaleString("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(220);
  doc.line(M, footerY - 10, W - M, footerY - 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(150);
  doc.text(
    `Documento generado el ${stampStr} · Asistente de Cierre · ${d.lote.id}`,
    W / 2,
    footerY,
    { align: "center" }
  );

  return doc;
}

/** Nombre de archivo sugerido. */
export function nombreArchivoCarta(d: CartaPdfData): string {
  const cli = (d.nombreCliente || "cliente").replace(/[^\w]+/g, "-").toLowerCase();
  return `carta-reservacion-${d.lote.id}-${cli}.pdf`;
}

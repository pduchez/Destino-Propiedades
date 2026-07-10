// Generación de la "CARTA COMPROMISO DE RESERVACIÓN DE LOTE" con jsPDF.
// Diseño formal con la marca de DestinoPropiedades + Grupo Inmobiliario Chacón
// (logos en el encabezado y sello oficial junto a la firma del ejecutivo).
// El PDF resultante es aplanado (no editable) y lleva timestamp.

import { jsPDF } from "jspdf";
import type { Cotizacion } from "./calc";
import type { Lote, Proyecto } from "@/asistente/data/proyectos";
import { money, fechaLarga } from "./format";
import { WHATSAPP_DP, CALL_CENTER } from "@/asistente/config/contacto";
import { DP_MARK_PNG, SEAL_NAVY_PNG, SEAL_WHITE_PNG } from "./brand";

export interface CartaPdfData {
  proyecto: Proyecto;
  lote: Lote;
  cotizacion: Cotizacion;
  nombreCliente: string;
  ejecutivo?: string;
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
const DORADO = "#c9a227";
const GRIS = "#4b5563";
const TINTA = "#1a2733";
const LINEA = "#e2e8f0";
const ZEBRA = "#f6f8fb";

export function generarCartaPdf(d: CartaPdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 0;

  // ---------- Encabezado ----------
  doc.setFillColor(MARINO);
  doc.rect(0, 0, W, 98, "F");
  doc.setFillColor(DORADO);
  doc.rect(0, 98, W, 3, "F");
  try {
    doc.addImage(DP_MARK_PNG, "PNG", M, 26, 44, 44);
    doc.addImage(SEAL_WHITE_PNG, "PNG", M + 50, 26, 44, 44);
  } catch {
    /* si una imagen falla, el resto de la carta se genera igual */
  }
  const TX = M + 104;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#ffffff");
  doc.text("Destino", TX, 48);
  const wDest = doc.getTextWidth("Destino");
  doc.setTextColor(DORADO);
  doc.text("Propiedades", TX + wDest, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor("#c7d2e0");
  doc.text("Grupo Inmobiliario Chacón  ·  Real Estate", TX, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(DORADO);
  doc.text("DOCUMENTO DE RESERVACIÓN", W - M, 44, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor("#c7d2e0");
  doc.text(fechaLarga(d.fecha), W - M, 60, { align: "right" });

  // ---------- Título ----------
  y = 134;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15.5);
  doc.setTextColor(MARINO);
  doc.text("CARTA COMPROMISO DE RESERVACIÓN DE LOTE", W / 2, y, {
    align: "center",
  });
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(DORADO);
  doc.text(d.proyecto.lotificacion, W / 2, y, { align: "center" });
  y += 11;
  doc.setFontSize(8);
  doc.setTextColor(GRIS);
  doc.text(d.proyecto.ubicacion, W / 2, y, { align: "center" });

  // ---------- Intro ----------
  y += 24;
  doc.setFontSize(10.5);
  doc.setTextColor(TINTA);
  const intro =
    `En la fecha ${fechaLarga(d.fecha)}, se hace constar que el/la cliente ` +
    `${d.nombreCliente || "________"}, con Documento Único de Identidad N° ` +
    `${d.dui || "________"}, entrega en concepto de reservación la cantidad de ` +
    `${money(d.montoReservacion)}, para reservar el lote que se describe a continuación:`;
  const introL = doc.splitTextToSize(intro, W - M * 2);
  doc.text(introL, M, y);
  y += introL.length * 14 + 10;

  // ---------- Tarjeta de datos ----------
  const rows: [string, string, string, string][] = [
    ["Lote N°", String(d.lote.numero), "Polígono", d.lote.poligono],
    ["Calle", d.lote.calle || "—", "Pasaje", d.lote.pasaje || "—"],
    ["Área", `${d.lote.areaV2.toFixed(2)} V²`, "Precio de contado", money(d.cotizacion.precioContado)],
    ["Prima requerida", money(d.cotizacion.primaRequerida), "Reservación recibida", money(d.montoReservacion)],
    ["Complemento de prima", money(d.complementoPrima), "Fecha límite (máx. 8 días)", fechaLarga(d.fechaLimiteComplemento)],
    ["Financiamiento", `${d.cotizacion.anos} años (${d.cotizacion.meses} meses)`, "Cuota mensual", money(d.cotizacion.cuotaMensual)],
  ];
  const cardX = M;
  const cardW = W - M * 2;
  const rowH = 22;
  const cardY = y;
  const cardH = rowH * rows.length + 8;
  doc.setDrawColor(LINEA);
  doc.setLineWidth(1);
  doc.roundedRect(cardX, cardY, cardW, cardH, 6, 6, "S");
  let ry = cardY + 4;
  const colW = cardW / 2;
  rows.forEach((r, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(ZEBRA);
      doc.rect(cardX + 1, ry, cardW - 2, rowH, "F");
    }
    const ty = ry + 14;
    const cell = (x: number, label: string, val: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(MARINO);
      doc.text(label.toUpperCase(), x + 12, ty - 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(TINTA);
      doc.text(String(val), x + 12, ty + 8);
    };
    cell(cardX, r[0], r[1]);
    cell(cardX + colW, r[2], r[3]);
    doc.setDrawColor("#eef2f7");
    doc.line(cardX + colW, ry + 3, cardX + colW, ry + rowH - 3);
    ry += rowH;
  });
  y = cardY + cardH + 14;

  // Valor con financiamiento — franja dorada
  doc.setFillColor("#faf5e3");
  doc.roundedRect(M, y, cardW, 26, 5, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(MARINO);
  doc.text("VALOR DEL INMUEBLE CON FINANCIAMIENTO", M + 12, y + 17);
  doc.setFontSize(13);
  doc.setTextColor("#a5841c");
  doc.text(money(d.cotizacion.valorConFinanciamiento), W - M - 12, y + 17, {
    align: "right",
  });
  y += 40;

  // Comentarios
  const comentarios = (d.comentarios || "").trim();
  if (comentarios) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(MARINO);
    doc.text("Comentarios:", M, y);
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(GRIS);
    const cl = doc.splitTextToSize(comentarios, W - M * 2);
    doc.text(cl, M, y);
    y += cl.length * 12 + 8;
  }

  // Nota (8 días)
  doc.setFillColor("#fff8e6");
  doc.setDrawColor("#f0e2b8");
  doc.roundedRect(M, y, cardW, 26, 4, 4, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor("#7a5b00");
  doc.text(
    "Nota: el complemento de prima no debe exceder los 8 días. Su incumplimiento deja sin efecto la presente reservación.",
    M + 10,
    y + 16,
    { maxWidth: cardW - 20 }
  );
  y += 48;

  // ---------- Firmas ----------
  const fW = (cardW - 40) / 2;
  const fY = y + 42;
  const firmaBoxH = 40;
  // Trazos de firma (si existen) encima de la línea.
  function firma(x: number, dataUrl: string | null) {
    if (!dataUrl) return;
    try {
      doc.addImage(dataUrl, "PNG", x, fY - firmaBoxH - 2, fW, firmaBoxH);
    } catch {
      /* firma inválida: se deja la línea vacía */
    }
  }
  firma(M, d.firmaClienteDataUrl);
  firma(M + fW + 40, d.firmaEjecutivoDataUrl);
  doc.setDrawColor("#7b8794");
  doc.setLineWidth(1);
  doc.line(M, fY, M + fW, fY);
  doc.line(M + fW + 40, fY, M + fW * 2 + 40, fY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(MARINO);
  doc.text("Cliente", M + fW / 2, fY + 14, { align: "center" });
  doc.text("Ejecutivo Inmobiliario", M + fW + 40 + fW / 2, fY + 14, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(GRIS);
  if (d.nombreCliente)
    doc.text(d.nombreCliente, M + fW / 2, fY + 25, { align: "center" });
  if (d.ejecutivo)
    doc.text(d.ejecutivo, M + fW + 40 + fW / 2, fY + 25, { align: "center" });
  // Sello oficial de Grupo Chacón junto a la firma del ejecutivo.
  try {
    doc.addImage(
      SEAL_NAVY_PNG,
      "PNG",
      M + fW + 40 + fW / 2 - 42,
      fY - 64,
      84,
      71
    );
  } catch {
    /* sin sello: la carta se genera igual */
  }

  // ---------- Pie ----------
  const stamp = new Date();
  const stampStr = stamp.toLocaleString("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const fyy = H - 46;
  doc.setDrawColor(LINEA);
  doc.line(M, fyy - 8, W - M, fyy - 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(MARINO);
  doc.text(`WhatsApp ${WHATSAPP_DP}`, M, fyy + 4);
  doc.text(`Call Center ${CALL_CENTER}`, W - M, fyy + 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor("#9aa5b1");
  doc.text(
    `Documento generado el ${stampStr} · Asistente de Cierre · ${d.lote.id}`,
    W / 2,
    fyy + 18,
    { align: "center" }
  );

  return doc;
}

/** Nombre de archivo sugerido. */
export function nombreArchivoCarta(d: CartaPdfData): string {
  const cli = (d.nombreCliente || "cliente").replace(/[^\w]+/g, "-").toLowerCase();
  return `carta-reservacion-${d.lote.id}-${cli}.pdf`;
}

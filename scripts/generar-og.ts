// Genera imágenes Open Graph de marca (1200x630, JPG) para compartir en
// redes y WhatsApp: foto de fondo + degradado + nombre, ubicación y precio
// del proyecto + marca DestinoPropiedades.
// Herramienta de desarrollo (no es parte del sitio). Correr desde la raíz
// del proyecto con:  npm run og
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { proyectos } from "../src/data/proyectos.ts";
import { zonas } from "../src/data/zonas.ts";

const W = 1200;
const H = 630;
const OUT = "public/assets/og";
await mkdir(OUT, { recursive: true });

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fsPath(publicPath: string): string {
  return "public" + publicPath;
}

// Overlay de texto sobre la foto (o sobre degradado si no hay foto).
function overlay(opts: {
  marcaArriba: string;
  titulo: string;
  subtitulo?: string;
  precio?: string;
  pie?: string;
  conGradienteBase?: boolean;
}): Buffer {
  const tituloSize = opts.titulo.length > 24 ? 50 : 64;
  const base = opts.conGradienteBase
    ? `<rect width="${W}" height="${H}" fill="url(#bg)"/>`
    : "";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f2438"/>
        <stop offset="100%" stop-color="#1c3b59"/>
      </linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="35%" stop-color="rgba(15,36,56,0.15)"/>
        <stop offset="100%" stop-color="rgba(15,36,56,0.95)"/>
      </linearGradient>
    </defs>
    ${base}
    <rect width="${W}" height="${H}" fill="url(#shade)"/>
    <text x="60" y="80" fill="#c9a463" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="bold" letter-spacing="-0.5">${esc(opts.marcaArriba)}</text>
    <text x="60" y="${H - 150}" fill="#faf7f2" font-family="DejaVu Sans, Arial, sans-serif" font-size="${tituloSize}" font-weight="bold" letter-spacing="-1">${esc(opts.titulo)}</text>
    ${opts.subtitulo ? `<text x="60" y="${H - 100}" fill="#faf7f2" font-family="Arial, sans-serif" font-size="32" opacity="0.9">${esc(opts.subtitulo)}</text>` : ""}
    ${opts.precio ? `<text x="60" y="${H - 50}" fill="#c9a463" font-family="Arial, sans-serif" font-size="40" font-weight="bold">${esc(opts.precio)}</text>` : ""}
    ${opts.pie ? `<text x="${W - 60}" y="${H - 40}" text-anchor="end" fill="#faf7f2" font-family="Arial, sans-serif" font-size="24" opacity="0.7">${esc(opts.pie)}</text>` : ""}
  </svg>`);
}

async function generar(outName: string, bgPhoto: string | null, ov: Parameters<typeof overlay>[0]) {
  const out = `${OUT}/${outName}`;
  const svg = overlay({ ...ov, conGradienteBase: !bgPhoto });
  if (bgPhoto && existsSync(fsPath(bgPhoto))) {
    const bg = await sharp(fsPath(bgPhoto)).resize(W, H, { fit: "cover", position: "center" }).toBuffer();
    await sharp(bg).composite([{ input: svg }]).jpeg({ quality: 84 }).toFile(out);
  } else {
    await sharp(svg).jpeg({ quality: 84 }).toFile(out);
  }
  console.log("og:", outName);
}

// Default del sitio
await generar("default.jpg", null, {
  marcaArriba: "DestinoPropiedades.com",
  titulo: "Tu lote en El Salvador",
  subtitulo: "Lotes en lotificaciones confiables para la diáspora salvadoreña",
});

// Por proyecto
for (const p of proyectos) {
  await generar(`${p.slug}.jpg`, p.galeria[0] ?? null, {
    marcaArriba: "DestinoPropiedades.com",
    titulo: p.nombre,
    subtitulo: `${p.municipio}, ${p.departamento}`,
    precio: p.etiquetaPrecio,
    pie: "En alianza con Grupo Inmobiliario Chacón",
  });
}

// Por zona
for (const z of zonas) {
  const proyZona = proyectos.find(
    (p) =>
      p.departamento === z.departamento &&
      (!z.municipio || p.municipio === z.municipio) &&
      (!z.tipo || p.tipo === z.tipo)
  );
  await generar(`zona-${z.slug}.jpg`, proyZona?.galeria[0] ?? null, {
    marcaArriba: "DestinoPropiedades.com",
    titulo: z.nombre,
    subtitulo: "El Salvador",
  });
}

console.log("listo");

// Genera piezas para redes sociales (perfil, portada, post, historia/reel)
// con el logo sol+costa y la foto hero como estándar de marca.
// Herramienta de desarrollo (no es parte del sitio). Correr con:
//   node --experimental-strip-types scripts/generar-social.ts
import sharp, { type Sharp } from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = "public/assets/social";
await mkdir(OUT, { recursive: true });

const HERO = "public/assets/proyectos/condado-del-golfo/panoramica-golfo.webp";
const NAVY = "#0f2438";
const NAVY2 = "#1c3b59";
const SAND = "#c9a463";
const CREAM = "#faf7f2";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Logo sol+costa (arte base en coords 48x48) escalado y centrado en (cx,cy).
function icono(cx: number, cy: number, size: number): string {
  const s = size / 48;
  const tx = cx - size / 2;
  const ty = cy - size / 2;
  return `<g transform="translate(${tx},${ty}) scale(${s})">
    <circle cx="24" cy="20" r="6.5" fill="none" stroke="${SAND}" stroke-width="${(2.6).toFixed(2)}"/>
    <line x1="24" y1="7" x2="24" y2="10.5" stroke="${SAND}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M9 31 Q 16.5 26, 24 31 T 39 31" fill="none" stroke="${CREAM}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M11 37 Q 17.5 33, 24 37 T 37 37" fill="none" stroke="${SAND}" stroke-width="2.6" stroke-linecap="round"/>
  </g>`.replace(/stroke-width="2.6"/g, `stroke-width="${(2.6).toFixed(2)}"`);
}

// Wordmark "DestinoPropiedades.com" en (x,y), anclaje configurable.
function wordmark(x: number, y: number, fs: number, anchor = "start"): string {
  return `<text x="${x}" y="${y}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${fs}" font-weight="bold" letter-spacing="${(-fs * 0.02).toFixed(1)}" text-anchor="${anchor}">
    <tspan fill="${CREAM}">Destino</tspan><tspan fill="${SAND}">Propiedades</tspan><tspan fill="${SAND}" opacity="0.7">.com</tspan>
  </text>`;
}

async function fondoFoto(w: number, h: number): Promise<Buffer> {
  return sharp(HERO).resize(w, h, { fit: "cover", position: "centre" }).toBuffer();
}

async function pieza(name: string, w: number, h: number, svg: string, conFoto: boolean) {
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${svg}</svg>`
  );
  let base: Sharp;
  if (conFoto) {
    base = sharp(await fondoFoto(w, h));
  } else {
    base = sharp({
      create: { width: w, height: h, channels: 3, background: NAVY },
    });
  }
  await base
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(`${OUT}/${name}`);
  console.log("social:", name);
}

// Degradados reutilizables (defs + rects). Se inyectan al inicio del svg.
const defsNavy = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${NAVY}"/><stop offset="100%" stop-color="${NAVY2}"/>
  </linearGradient>
  <linearGradient id="shadeB" x1="0" y1="0" x2="0" y2="1">
    <stop offset="30%" stop-color="rgba(15,36,56,0.10)"/><stop offset="100%" stop-color="rgba(10,26,41,0.92)"/>
  </linearGradient>
  <linearGradient id="shadeFull" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="rgba(10,26,41,0.55)"/><stop offset="55%" stop-color="rgba(10,26,41,0.30)"/><stop offset="100%" stop-color="rgba(10,26,41,0.95)"/>
  </linearGradient>
</defs>`;

// 1) Foto de perfil (1080x1080) — logo centrado sobre navy. Para FB/IG/TikTok.
await pieza(
  "perfil-1080x1080.jpg",
  1080,
  1080,
  `<rect width="1080" height="1080" fill="${NAVY}"/>
   <circle cx="540" cy="540" r="540" fill="url(#bg)"/>
   ${defsNavy}
   ${icono(540, 470, 360)}
   ${wordmark(540, 760, 64, "middle")}
   <text x="540" y="820" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="${CREAM}" opacity="0.7" text-anchor="middle" letter-spacing="2">LOTES EN EL SALVADOR</text>`,
  false
);

// 2) Portada de Facebook (1640x624) — hero + logo + lema.
await pieza(
  "portada-facebook-1640x624.jpg",
  1640,
  624,
  `${defsNavy}
   <rect width="1640" height="624" fill="url(#shadeB)"/>
   ${icono(80, 90, 64)}
   ${wordmark(130, 110, 40)}
   <text x="80" y="470" font-family="DejaVu Sans, Arial, sans-serif" font-size="58" font-weight="bold" fill="${CREAM}" letter-spacing="-1">Tu lote en El Salvador</text>
   <text x="80" y="535" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" fill="${CREAM}" opacity="0.9">a un mensaje de distancia.</text>`,
  true
);

// 3) Post cuadrado feed (1080x1080) — hero + logo + titular.
await pieza(
  "post-cuadrado-1080x1080.jpg",
  1080,
  1080,
  `${defsNavy}
   <rect width="1080" height="1080" fill="url(#shadeFull)"/>
   ${icono(70, 80, 60)}
   ${wordmark(115, 100, 38)}
   <text x="70" y="820" font-family="DejaVu Sans, Arial, sans-serif" font-size="76" font-weight="bold" fill="${CREAM}" letter-spacing="-1.5">Tu lote en</text>
   <text x="70" y="900" font-family="DejaVu Sans, Arial, sans-serif" font-size="76" font-weight="bold" fill="${CREAM}" letter-spacing="-1.5">El Salvador</text>
   <rect x="72" y="930" width="90" height="6" rx="3" fill="${SAND}"/>
   <text x="70" y="1000" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" fill="${CREAM}" opacity="0.9">Lotes en lotificaciones confiables</text>`,
  true
);

// 4) Historia / Reel vertical (1080x1920) — IG stories y TikTok.
await pieza(
  "historia-tiktok-1080x1920.jpg",
  1080,
  1920,
  `${defsNavy}
   <rect width="1080" height="1920" fill="url(#shadeFull)"/>
   ${icono(540, 230, 130)}
   ${wordmark(540, 360, 46, "middle")}
   <text x="540" y="980" font-family="DejaVu Sans, Arial, sans-serif" font-size="92" font-weight="bold" fill="${CREAM}" text-anchor="middle" letter-spacing="-2">Tu lote en</text>
   <text x="540" y="1080" font-family="DejaVu Sans, Arial, sans-serif" font-size="92" font-weight="bold" fill="${CREAM}" text-anchor="middle" letter-spacing="-2">El Salvador</text>
   <text x="540" y="1160" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" fill="${CREAM}" opacity="0.9" text-anchor="middle">a un mensaje de distancia</text>
   <rect x="220" y="1640" width="640" height="100" rx="50" fill="${SAND}"/>
   <text x="540" y="1703" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="bold" fill="${NAVY}" text-anchor="middle">Escribinos por WhatsApp</text>`,
  true
);

// 5) Post de valor (1080x1080) — navy de marca, sin foto.
await pieza(
  "post-confianza-1080x1080.jpg",
  1080,
  1080,
  `<rect width="1080" height="1080" fill="url(#bg)"/>
   ${defsNavy}
   ${icono(540, 230, 150)}
   ${wordmark(540, 360, 44, "middle")}
   <text x="540" y="560" font-family="DejaVu Sans, Arial, sans-serif" font-size="58" font-weight="bold" fill="${SAND}" text-anchor="middle" letter-spacing="-1">Confianza primero</text>
   <text x="540" y="700" font-family="DejaVu Sans, Arial, sans-serif" font-size="40" fill="${CREAM}" text-anchor="middle" opacity="0.92">Proyectos verificados</text>
   <text x="540" y="770" font-family="DejaVu Sans, Arial, sans-serif" font-size="40" fill="${CREAM}" text-anchor="middle" opacity="0.92">Información clara, sin sorpresas</text>
   <text x="540" y="840" font-family="DejaVu Sans, Arial, sans-serif" font-size="40" fill="${CREAM}" text-anchor="middle" opacity="0.92">Atención directa por WhatsApp</text>`,
  false
);

console.log("listo");

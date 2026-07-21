/**
 * Construye la especificación "movie" de JSON2Video a partir del guion y las
 * FOTOS REALES del proyecto. Vertical 9:16 con acabado cuidado:
 *  - resize "cover": la foto (apaisada) LLENA el marco vertical, sin barras.
 *  - Ken Burns: paneo + zoom suave, alternando dirección por escena.
 *  - transiciones (fade) entre escenas.
 *  - texto legible (sombra + franja translúcida), no un recuadro tosco.
 *  - música opcional (env JSON2VIDEO_MUSIC_URL). Sin voz.
 *
 * Campos según la documentación de JSON2Video (image: resize/pan/zoom;
 * scene: transition; text: settings). Si el primer render real necesita un
 * ajuste, el error queda guardado en el RenderJob.
 */
import type { MovieSpec } from "@/lib/video/json2video";
import type { Storyboard } from "@/lib/video/storyboard";

export interface BuildMovieOptions {
  photos: string[]; // URLs de fotos reales (por índice)
  clips?: string[]; // URLs de VIDEO (dron). Si hay, se usan en vez de fotos.
  webhookUrl?: string;
  musicUrl?: string;
  sceneSeconds?: number;
}

function videoElement(src: string, seconds: number): Record<string, unknown> {
  return {
    type: "video",
    src,
    duration: seconds, // recorta el clip a la duración de la escena
    resize: "cover", // llena el marco vertical 9:16
    volume: 0, // sin audio del clip: manda la música de fondo
  };
}

const WIDTH = 1080;
const HEIGHT = 1920; // 9:16

// Direcciones de paneo que se alternan para dar dinamismo (Ken Burns).
const PANS = ["right", "left", "top", "bottom", "top-right", "bottom-left"];

function imageElement(src: string, seconds: number, i: number): Record<string, unknown> {
  return {
    type: "image",
    src,
    duration: seconds,
    // La foto apaisada llena el marco vertical (recorte al centro), sin barras.
    resize: "cover",
    // Movimiento suave: zoom leve + paneo alternado por escena.
    zoom: 2,
    pan: PANS[i % PANS.length],
  };
}

function textElement(text: string, seconds: number): Record<string, unknown> {
  return {
    type: "text",
    text,
    start: 0.2,
    duration: seconds - 0.2,
    position: "bottom-center",
    // Aparición/salida suave.
    fade: { in: 0.3, out: 0.3 },
    settings: {
      "font-family": "Oswald",
      "font-size": "62px",
      "font-weight": "700",
      color: "#ffffff",
      "text-align": "center",
      "text-shadow": "0 3px 10px rgba(0,0,0,0.85)",
      "background-color": "rgba(15,43,68,0.55)",
      "border-radius": "14px",
      padding: "16px 24px",
      "line-height": "1.15",
      "max-width": "88%",
    },
  };
}

/** Ensambla la película con acabado profesional. */
export function buildMovie(storyboard: Storyboard, opts: BuildMovieOptions): MovieSpec {
  const seconds = opts.sceneSeconds ?? 3.4;

  // Si hay clips de VIDEO (dron), se usan; si no, fotos con Ken Burns.
  const usingClips = (opts.clips?.length ?? 0) > 0;
  const sources = usingClips ? (opts.clips as string[]) : opts.photos;
  const visual = (src: string, dur: number, i: number) =>
    usingClips ? videoElement(src, dur) : imageElement(src, dur, i);

  const scenes: Record<string, unknown>[] = storyboard.scenes.map((s, i) => {
    const src = sources[s.photoIndex] ?? sources[i % sources.length] ?? sources[0];
    const elements: Record<string, unknown>[] = [visual(src, seconds, i)];
    if (s.onScreenText) elements.push(textElement(s.onScreenText, seconds));
    return {
      duration: seconds,
      transition: { style: "fade", duration: 0.4 },
      elements,
    };
  });

  // Escena final (tarjeta de cierre con CTA a WhatsApp) sobre el último visual.
  const last = sources[sources.length - 1] ?? sources[0];
  scenes.push({
    duration: seconds + 0.8,
    transition: { style: "fade", duration: 0.4 },
    elements: [
      visual(last, seconds + 0.8, scenes.length),
      textElement(storyboard.endCardText, seconds + 0.8),
    ],
  });

  const movie: MovieSpec = {
    resolution: "custom",
    width: WIDTH,
    height: HEIGHT,
    quality: "high",
    scenes,
  };

  // Música de fondo (opcional): pista libre por URL. Sin voz.
  if (opts.musicUrl) {
    movie.elements = [{ type: "audio", src: opts.musicUrl, volume: 0.35, "fade-out": 2 }];
  }

  // Entrega por webhook al terminar (si hay URL pública).
  if (opts.webhookUrl) {
    movie.exports = [{ destinations: [{ type: "webhook", endpoint: opts.webhookUrl }] }];
  }

  return movie;
}

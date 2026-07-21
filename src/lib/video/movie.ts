/**
 * Construye la especificación "movie" de JSON2Video a partir del guion y las
 * FOTOS REALES del proyecto. Vertical 9:16, cada escena = una foto real con
 * texto en pantalla; escena final con el cierre/CTA; música opcional (sin voz).
 *
 * Nota: los nombres de campos siguen la estructura documentada de JSON2Video
 * (movie → scenes → elements; text/image/audio). Si en el primer render real
 * algún campo necesita ajuste, el error queda guardado en el RenderJob.
 */
import type { MovieSpec } from "@/lib/video/json2video";
import type { Storyboard } from "@/lib/video/storyboard";

export interface BuildMovieOptions {
  photos: string[]; // URLs de fotos reales (por índice)
  webhookUrl?: string; // JSON2Video llama aquí al terminar
  musicUrl?: string; // pista libre opcional (env JSON2VIDEO_MUSIC_URL)
  sceneSeconds?: number; // duración por escena
}

const WIDTH = 1080;
const HEIGHT = 1920; // 9:16

function textElement(text: string, seconds: number): Record<string, unknown> {
  return {
    type: "text",
    text,
    start: 0,
    duration: seconds,
    position: "bottom-center",
    settings: {
      "font-family": "Oswald",
      "font-size": "68px",
      "font-weight": "700",
      color: "#ffffff",
      "text-align": "center",
      "background-color": "#0f2b44cc",
      padding: "18px 26px",
      "line-height": "1.15",
    },
  };
}

function imageElement(src: string, seconds: number): Record<string, unknown> {
  return {
    type: "image",
    src,
    duration: seconds,
    position: "center-center",
    zoom: 2, // efecto de acercamiento suave (Ken Burns)
  };
}

/** Ensambla la película. Devuelve el objeto listo para POST /v2/movies. */
export function buildMovie(storyboard: Storyboard, opts: BuildMovieOptions): MovieSpec {
  const seconds = opts.sceneSeconds ?? 3.2;

  const scenes: Record<string, unknown>[] = storyboard.scenes.map((s) => {
    const src = opts.photos[s.photoIndex] ?? opts.photos[0];
    const elements: Record<string, unknown>[] = [imageElement(src, seconds)];
    if (s.onScreenText) elements.push(textElement(s.onScreenText, seconds));
    return { duration: seconds, elements };
  });

  // Escena final (tarjeta de cierre con CTA a WhatsApp) sobre la última foto.
  const lastPhoto = opts.photos[opts.photos.length - 1] ?? opts.photos[0];
  scenes.push({
    duration: seconds + 0.6,
    elements: [
      imageElement(lastPhoto, seconds + 0.6),
      textElement(storyboard.endCardText, seconds + 0.6),
    ],
  });

  const movie: MovieSpec = {
    width: WIDTH,
    height: HEIGHT,
    quality: "high",
    scenes,
  };

  // Música de fondo (opcional): pista libre por URL. Sin voz.
  const globalElements: Record<string, unknown>[] = [];
  if (opts.musicUrl) {
    globalElements.push({ type: "audio", src: opts.musicUrl, volume: 0.35 });
  }
  if (globalElements.length) movie.elements = globalElements;

  // Entrega por webhook cuando el render termine (si tenemos URL pública).
  if (opts.webhookUrl) {
    movie.exports = [{ destinations: [{ type: "webhook", endpoint: opts.webhookUrl }] }];
  }

  return movie;
}

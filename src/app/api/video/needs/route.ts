/**
 * Detecta cuándo ARS necesita que el operador suba VIDEO crudo.
 * TikTok (y reels) requieren video vertical. Si un proyecto en autopiloto va a
 * publicar en una red de video pero no tiene material crudo en su stock, ARS lo
 * marca aquí para pedir que subas videos. GET -> lista de necesidades.
 */
import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { parseArray } from "@/lib/json";
import { isNetwork, NETWORK_META, type Network } from "@/lib/networks";

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;

export const GET = withAuth(async () => {
  const cfg = await prisma.automation.findUnique({ where: { id: "default" } });
  const defaultNets = (parseArray(cfg?.dailyNetworks).filter(isNetwork) as Network[]);
  const videoNetworks = (Object.keys(NETWORK_META) as Network[]).filter(
    (n) => NETWORK_META[n].requiresVideo,
  );

  const projects = await prisma.project.findMany({
    where: { status: "active", autoPost: true },
    include: { assets: true },
  });

  const needs: { projectId: string; projectName: string; networks: string[] }[] = [];
  for (const p of projects) {
    const own = (parseArray(p.postNetworks).filter(isNetwork) as Network[]);
    const nets = own.length ? own : defaultNets;
    const needsVideoFor = nets.filter((n) => videoNetworks.includes(n));
    if (needsVideoFor.length === 0) continue;

    const hasVideo = p.assets.some(
      (a) => a.mimeType.startsWith("video/") || VIDEO_EXT.test(a.filename),
    );
    if (!hasVideo) {
      needs.push({
        projectId: p.id,
        projectName: p.name,
        networks: needsVideoFor.map((n) => NETWORK_META[n].label),
      });
    }
  }

  return json({ needs, videoProvider: cfg?.videoProvider ?? "" });
});

export const dynamic = "force-dynamic";

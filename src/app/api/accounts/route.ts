import { prisma } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { parseObject } from "@/lib/json";
import { NETWORKS } from "@/lib/networks";
import { getAdapter } from "@/lib/social";

export const GET = withAuth(async () => {
  // Asegura que existan las 4 cuentas
  for (const network of NETWORKS) {
    await prisma.socialAccount.upsert({
      where: { network },
      update: {},
      create: { network },
    });
  }
  const accounts = await prisma.socialAccount.findMany({
    orderBy: { network: "asc" },
  });
  // No exponer secretos: solo indicar qué claves están presentes.
  const safe = accounts.map((a) => {
    const config = parseObject<Record<string, string>>(a.config, {});
    const adapter = getAdapter(a.network as (typeof NETWORKS)[number]);
    return {
      id: a.id,
      network: a.network,
      displayName: a.displayName,
      enabled: a.enabled,
      autoPublish: a.autoPublish,
      configuredKeys: Object.keys(config),
      readyToPublish: adapter ? adapter.isConfigured(config) : false,
    };
  });
  return json(safe);
});

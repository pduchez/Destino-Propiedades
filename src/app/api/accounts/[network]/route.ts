import { prisma } from "@/lib/db";
import { json, errorJson, withAuth } from "@/lib/api";
import { parseObject, stringify } from "@/lib/json";
import { isNetwork } from "@/lib/networks";

type Ctx = { params: { network: string } };

/** PATCH: actualizar nombre, enabled, autoPublish y/o credenciales (config). */
export const PATCH = withAuth(async (req, { params }: Ctx) => {
  if (!isNetwork(params.network)) return errorJson("Red inválida", 400);
  const body = (await req.json()) as Record<string, unknown>;

  const existing = await prisma.socialAccount.findUnique({
    where: { network: params.network },
  });
  const config = existing
    ? parseObject<Record<string, string>>(existing.config, {})
    : {};

  // Merge de credenciales: solo se actualizan las claves enviadas y no vacías.
  if (body.config && typeof body.config === "object") {
    for (const [k, v] of Object.entries(body.config as Record<string, unknown>)) {
      if (v === "" || v === null) {
        delete config[k]; // permitir borrar una credencial
      } else if (typeof v === "string") {
        config[k] = v;
      }
    }
  }

  const data: Record<string, unknown> = { config: stringify(config) };
  if (typeof body.displayName === "string") data.displayName = body.displayName;
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.autoPublish === "boolean") data.autoPublish = body.autoPublish;

  const account = await prisma.socialAccount.upsert({
    where: { network: params.network },
    update: data,
    create: { network: params.network, ...data },
  });

  return json({
    network: account.network,
    enabled: account.enabled,
    autoPublish: account.autoPublish,
    configuredKeys: Object.keys(config),
  });
});

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { requireUser, crmRoute } from "@/lib/crmServer";
import { projectOptions } from "@/lib/crm";

export const dynamic = "force-dynamic";

/** GET /api/crm/meta — catálogos para formularios (proyectos y vendedores). */
export const GET = crmRoute(async () => {
  const user = await requireUser();
  const projects = projectOptions();
  // Sólo el director necesita la lista de vendedores (para asignar/reasignar).
  const vendors =
    user.role === "admin"
      ? (
          await prisma.user.findMany({
            where: { role: "sales" },
            select: { id: true, username: true, displayName: true },
            orderBy: { username: "asc" },
          })
        ).map((v) => ({ id: v.id, name: v.displayName || v.username }))
      : [];
  return Response.json({ projects, vendors });
});

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/users";
import FaqAdmin from "@/components/asistente/FaqAdmin";

export const dynamic = "force-dynamic";

/** Administración de preguntas frecuentes — exclusivo del Director (admin). */
export default async function FaqAdminPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/inicio");
  if (user.role !== "admin") redirect("/asistente");
  return <FaqAdmin />;
}

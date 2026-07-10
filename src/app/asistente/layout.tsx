import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/users";
import IdleLogout from "@/components/IdleLogout";

export const metadata: Metadata = {
  title: "Asistente de Cierre — Ventas | DestinoPropiedades.com",
  robots: { index: false, follow: false },
};

/**
 * Área privada del Asistente de Cierre. Accesible a los 6 usuarios de Acceso
 * Ventas (Director1 y ventas1..5). Sin sesión válida → login unificado (/inicio).
 */
export default async function AsistenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/inicio");
  return (
    <div className="min-h-[100dvh] bg-marino-50">
      <IdleLogout />
      {children}
    </div>
  );
}

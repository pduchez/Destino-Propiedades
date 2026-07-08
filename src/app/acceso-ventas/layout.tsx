import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import AuthGate from "@/components/AuthGate";
import { getCurrentUser } from "@/lib/users";

// Sección PRIVADA: panel del ARS (agente de redes) para Director1.
// Protegida por AuthGate (login). No afecta la autonomía del ARS: los loops
// automáticos corren por /api/cron/tick con CRON_SECRET, independientes del
// login del panel.
export const metadata: Metadata = {
  title: "Acceso ventas — ARS | DestinoPropiedades.com",
  robots: { index: false, follow: false },
};

export default async function AccesoVentasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Los usuarios de ventas no acceden al ARS: se dirigen al CRM.
  const user = await getCurrentUser().catch(() => null);
  if (user && user.role !== "admin") redirect("/crm");
  return (
    <AuthGate>
      <Nav>{children}</Nav>
    </AuthGate>
  );
}

import type { Metadata } from "next";
import Nav from "@/components/Nav";
import AuthGate from "@/components/AuthGate";

// Sección PRIVADA: panel del ARS (agente de redes) para Director1.
// Protegida por AuthGate (login). No afecta la autonomía del ARS: los loops
// automáticos corren por /api/cron/tick con CRON_SECRET, independientes del
// login del panel.
export const metadata: Metadata = {
  title: "Acceso ventas — ARS | DestinoPropiedades.com",
  robots: { index: false, follow: false },
};

export default function AccesoVentasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="flex min-h-screen">
        <Nav />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </main>
      </div>
    </AuthGate>
  );
}

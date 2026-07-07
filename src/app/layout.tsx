import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "ARS — Agente de Redes Sociales",
  description:
    "ARS: genera, publica, mide y mejora el contenido de redes sociales de un portal inmobiliario. Reutilizable por proyecto.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthGate>
          <div className="flex min-h-screen">
            <Nav />
            <main className="flex-1 overflow-x-hidden">
              <div className="mx-auto max-w-6xl p-6">{children}</div>
            </main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}

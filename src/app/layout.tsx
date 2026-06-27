import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Destino — Agente de Redes Sociales",
  description:
    "Generación y publicación automatizada de contenido para redes sociales del portal Destinopropiedades.com",
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

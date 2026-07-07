import type { Metadata } from "next";
import "./globals.css";

// Layout RAÍZ: cáscara mínima para el portal público. La sección privada del
// ARS trae su propio chrome (Nav + AuthGate) en src/app/acceso-ventas/layout.tsx.
export const metadata: Metadata = {
  title: "DestinoPropiedades.com — Lotes en El Salvador",
  description:
    "Portal inmobiliario para la diáspora salvadoreña y compradores locales: lotes en lotificaciones confiables en El Salvador.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

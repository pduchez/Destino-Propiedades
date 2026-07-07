import type { Metadata } from "next";
import { Outfit, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Fuentes de marca del portal (titulares Outfit, cuerpo Hanken Grotesk).
// Se exponen como variables CSS y las usa Tailwind (font-display / font-sans).
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Layout RAÍZ: cáscara mínima para el portal público. La sección privada del
// ARS trae su propio chrome (Nav + AuthGate) en src/app/acceso-ventas/layout.tsx.
export const metadata: Metadata = {
  metadataBase: new URL("https://destinopropiedades.com"),
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
    <html lang="es" className={`${outfit.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}

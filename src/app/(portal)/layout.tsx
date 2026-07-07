import { Header } from "@/portal/components/Header";
import { Footer } from "@/portal/components/Footer";
import { BotonWhatsappFlotante } from "@/portal/components/ui";
import { Medicion, FavoritosScript } from "@/portal/components/Scripts";

// Layout del PORTAL público (grupo de rutas (portal)). Aporta el chrome del
// sitio (header/footer/WhatsApp/favoritos/medición) y la piel de marca
// (fondo cream, tipografías). No afecta a /acceso-ventas (panel ARS), que
// tiene su propio layout.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal font-sans bg-cream text-ink min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <BotonWhatsappFlotante />
      <FavoritosScript />
      <Medicion />
    </div>
  );
}

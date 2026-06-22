// Configuración del tenant (plataforma + desarrollador actual).
// Cambiar estos datos cambia el sitio entero: no hardcodear nada de esto
// en componentes ni páginas.

export interface Desarrollador {
  id: string;
  nombre: string;
  logo: string;
  web: string;
  /** Marca explícitamente que este desarrollador es reemplazable por otro. */
  intercambiable: boolean;
}

export interface Sitio {
  marcaPlataforma: string;
  desarrolladorActual: Desarrollador;
  contacto: {
    whatsapp: string;
    telefono: string;
    correo: string;
  };
  redes: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  colores: {
    primario: string;
    acento: string;
    fondo: string;
  };
  jurisdiccionLegal: string;
}

export const sitio: Sitio = {
  marcaPlataforma: "DestinoPropiedades.com",
  desarrolladorActual: {
    id: "grupo-chacon",
    nombre: "Grupo Inmobiliario Chacón",
    logo: "/assets/branding/chacon-logo.webp", // PENDIENTE: reemplazar con logo real
    web: "https://gichacon.com",
    intercambiable: true,
  },
  contacto: {
    // PENDIENTE: reemplazar con número real de WhatsApp (formato +503XXXXXXXX)
    whatsapp: "+50300000000",
    // PENDIENTE: reemplazar con número real de teléfono
    telefono: "+50300000000",
    // PENDIENTE: reemplazar con correo real
    correo: "contacto@destinopropiedades.com",
  },
  redes: {
    // Dejar vacío ("") si no existe el perfil. El sitio oculta el ícono
    // cuando el valor está vacío — nunca enlaza a "#".
    // PENDIENTE: pegar aquí las URLs reales de las redes (canal principal
    // de promoción: Instagram, TikTok, Facebook).
    facebook: "",
    instagram: "",
    tiktok: "",
  },
  colores: {
    primario: "#0f2438", // navy
    acento: "#c9a463", // dorado/arena
    fondo: "#faf7f2", // cream
  },
  jurisdiccionLegal: "El Salvador",
};

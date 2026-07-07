import Link from "next/link";

// Home PÚBLICA (temporal). En la Etapa 3 se porta aquí el portal real
// (hero, buscador, proyectos destacados…) desde el sitio Astro. Por ahora
// deja clara la estructura unificada: público aquí, ARS en /acceso-ventas.
export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(160% 120% at 50% 0%, #1c3b59, #0f2438)",
        color: "#faf7f2",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <p style={{ letterSpacing: ".14em", textTransform: "uppercase", color: "#c9a463", fontSize: 13, fontWeight: 700 }}>
          DestinoPropiedades.com
        </p>
        <h1 style={{ fontSize: 34, lineHeight: 1.1, margin: "12px 0 10px", fontWeight: 800 }}>
          Portal unificado en construcción
        </h1>
        <p style={{ color: "rgba(250,247,242,.72)", fontSize: 16 }}>
          El portal público (propiedades) se está integrando en esta misma app,
          junto al panel de ventas. Etapa 1 de la unificación: estructura lista.
        </p>
        <Link
          href="/acceso-ventas"
          style={{
            display: "inline-block",
            marginTop: 22,
            background: "#c9a463",
            color: "#0f2438",
            fontWeight: 700,
            textDecoration: "none",
            padding: "12px 22px",
            borderRadius: 999,
          }}
        >
          Acceso ventas (ARS) →
        </Link>
      </div>
    </main>
  );
}

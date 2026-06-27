# 🚀 Desplegar en Vercel (URL pública)

Guía paso a paso para poner el dashboard en línea con una URL navegable como
`https://destino-agente.vercel.app`. Tiempo estimado: ~15 minutos. Todo lo que
se usa tiene plan gratuito para empezar.

## Requisitos previos

1. El código en GitHub (ya está: este repositorio).
2. Una cuenta en [vercel.com](https://vercel.com) (puedes entrar con GitHub).

---

## Paso 1 — Crear la base de datos Postgres

Opción más simple desde Vercel:

1. En Vercel, entra a tu proyecto (lo crearás en el Paso 3) → pestaña
   **Storage** → **Create Database** → **Postgres** (o **Neon**).
2. Vercel crea la base y **añade automáticamente** la variable `DATABASE_URL`
   (y relacionadas) al proyecto. No tienes que copiar nada a mano.

> Alternativa: crear una base gratis en [neon.tech](https://neon.tech), copiar la
> *connection string* y pegarla como variable `DATABASE_URL` en el Paso 3.

## Paso 2 — Crear el almacenamiento de imágenes (Vercel Blob)

1. En el proyecto → **Storage** → **Create Database** → **Blob**.
2. Vercel añade automáticamente la variable `BLOB_READ_WRITE_TOKEN`.

## Paso 3 — Importar el proyecto en Vercel

1. Vercel → **Add New… → Project** → importa este repositorio de GitHub.
2. Vercel detecta **Next.js** automáticamente. **No cambies** el build command:
   el proyecto define `vercel-build` (`prisma generate && prisma db push && next build`),
   que crea las tablas en la primera publicación.
3. En **Environment Variables**, añade (las de DB y Blob ya están si hiciste los
   pasos 1 y 2):

   | Variable | Valor |
   |---|---|
   | `ANTHROPIC_API_KEY` | Tu API key de Claude (para generar copys con IA) |
   | `AI_MODEL` | `claude-opus-4-8` (opcional) |
   | `STORAGE_DRIVER` | `blob` |
   | `DASHBOARD_PASSWORD` | Una contraseña larga para proteger el panel |
   | `PUBLIC_BASE_URL` | La URL final, p.ej. `https://destino-agente.vercel.app` |
   | `META_*`, `X_*`, `TIKTOK_*` | Credenciales de redes (cuando publiques) |

4. **Deploy**. En unos minutos tendrás tu URL pública.

> `PUBLIC_BASE_URL` solo importa para publicar en redes; si aún no la sabes,
> déjala vacía y complétala tras el primer deploy con la URL real.

## Paso 4 — Primer ingreso

1. Abre tu URL. Te pedirá la `DASHBOARD_PASSWORD` que definiste.
2. Ve a **Configuración**, revisa la estrategia de marca, crea tus **Proyectos**,
   sube imágenes al **Stock** y empieza a **Generar**.

---

## Notas

- **Migraciones / tablas**: se crean solas en cada deploy vía `prisma db push`.
  No necesitas correr seeds: la estrategia de marca y las 4 cuentas se crean
  automáticamente la primera vez que entras a Configuración.
- **Imágenes**: con `STORAGE_DRIVER=blob` se guardan en Vercel Blob y se sirven
  desde su URL pública (necesario para que Meta/TikTok puedan leerlas al publicar).
- **Costos**: Postgres (Neon/Vercel) y Blob tienen plan gratuito. El costo de IA
  depende del uso de la API de Claude.
- **Otro proveedor** (Railway/Render/Fly.io): funciona igual; usa una Postgres y
  un almacenamiento S3-compatible. Avísame y te dejo la variante.

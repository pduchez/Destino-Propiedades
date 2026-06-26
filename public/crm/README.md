# Acceso Ventas — Panel administrativo / CRM

Esta carpeta (`public/crm/`) es el lugar reservado para el **panel
administrativo / CRM** de DestinoPropiedades.com, que usará la fuerza de
ventas. Cualquier archivo que se ponga aquí se publica tal cual (sin
procesar) en la ruta **`<dominio>/crm/`** del sitio.

- Producción (cuando el dominio esté activo): `https://destinopropiedades.com/crm/`
- Preview actual de revisión: `https://pduchez.github.io/Destino-Propiedades/crm/`

El enlace **"Acceso ventas"** del menú del sitio ya apunta a esta ruta.

---

## Instrucciones para el desarrollador del CRM

**Reemplazá el contenido de esta carpeta por el _build estático_ de tu
panel** (su `index.html` y la carpeta de `assets`/`js`/`css`). Al hacer
`push` a la rama, GitHub Pages lo publica en vivo automáticamente.

### Importante — qué SÍ funciona aquí y qué NO

GitHub Pages **solo sirve archivos estáticos** (HTML/CSS/JS/imágenes). No
ejecuta código de servidor.

- ✅ **SÍ funciona:** un frontend estático (SPA en React/Vue/Angular/Svelte,
  o HTML+JS) que se autentique y consuma datos llamando por API/HTTPS a tu
  backend (por ejemplo el que hoy está en `api.pedrovende.lat`). El backend
  sigue viviendo en su servidor; aquí va solo la **interfaz**.
- ❌ **NO funciona aquí:** un backend dinámico que renderice en el servidor
  (PHP/Laravel, Node/Express con vistas, Django, etc.) ni una base de datos.
  Eso necesita un servidor propio; en ese caso, avisá y el menú "Acceso
  ventas" se apunta directo a esa URL en vez de a `/crm/`.

### Detalles técnicos a tener en cuenta

1. **Rutas relativas.** El sitio puede servirse bajo un subdirectorio
   (`/Destino-Propiedades/` en el preview). Configurá el `base` / `publicPath`
   de tu build en **`/crm/`**, o usá **rutas relativas** (`./assets/...`),
   para que los archivos carguen bien.
2. **SPA con rutas internas.** Si usás rutas del lado del cliente, agregá un
   `404.html` (copia de tu `index.html`) en esta carpeta para que el refresco
   de subrutas funcione en GitHub Pages.
3. **CORS.** Tu backend (`api.pedrovende.lat` u otro) debe permitir
   solicitudes desde el dominio del sitio (`destinopropiedades.com` y, para
   pruebas, `pduchez.github.io`).
4. **Secretos.** No subás tokens, contraseñas ni llaves privadas a esta
   carpeta: todo lo que esté aquí es público. Las credenciales y la lógica
   sensible van en el backend, no en el frontend estático.

### Enlace para compartir con el desarrollador

```
https://github.com/pduchez/destino-propiedades/tree/claude/determined-curie-u890uo/public/crm
```

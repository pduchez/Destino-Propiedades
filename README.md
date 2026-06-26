# DestinoPropiedades.com

Portal inmobiliario premium para la diáspora salvadoreña en EE.UU.
Ver `CLAUDE.md` para el contexto completo del proyecto (negocio, stack,
modelo de datos, convenciones).

## Cómo correr el sitio en tu computadora

```sh
npm install
npm run dev
```

Esto abre el sitio en `http://localhost:4321`. Dejá la terminal abierta
mientras lo estés viendo; cerrarla apaga el servidor local (no afecta nada
publicado).

## Estructura

```
src/
  data/        ← toda la información editable (sitio, proyectos, zonas)
  pages/       ← las páginas del sitio
  styles/      ← colores y tipografías globales
public/
  assets/      ← imágenes y logos
```

# Estudio Técnico Soregaroli — sitio web

Sitio de una sola página para el estudio técnico de ascensores. La página funciona como un **viaje en ascensor 3D**: a medida que se hace scroll, la cabina sube de piso y cada piso es una sección (PB Inicio · 1 Servicios · 2 Gestoría · 3 Nosotros · 4 Contacto).

## Tecnología

- **Astro 7**: HTML estático, carga instantánea y buen SEO.
- **React Three Fiber, Drei y Three.js**: escena 3D (cabina, puertas, pasadizo, contrapeso), modelada por código sin archivos pesados.
- **@react-three/postprocessing**: bloom y viñeta en escritorio.
- **GSAP ScrollTrigger y Lenis**: scroll suave y animaciones de entrada.
- **Tailwind CSS 4**, tipografías **Inter** y **Space Grotesk** alojadas en el propio sitio.

## Comandos

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # genera /dist listo para publicar
npm run preview   # sirve /dist localmente
npm run brand     # regenera el logo y las imágenes de /brand y /public
```

## Dónde cambiar cada cosa

| Qué | Archivo |
|---|---|
| Teléfono, WhatsApp, emails, años, servicios del formulario | `src/config/site.ts` |
| Textos de cada sección | `src/components/sections/*.astro` |
| Colores y estilos base | `src/styles/global.css` |
| Escena 3D | `src/three/` |
| Logo (diseño) | `scripts/build-logo.mjs` y luego `npm run brand` |
| Dominio definitivo | `site` en `astro.config.mjs` |

Identidad visual (logo, colores, tipografías): `http://localhost:4321/marca`. Esa página no se indexa en buscadores.

## Formulario de cotización

Usa [FormSubmit](https://formsubmit.co). Los mensajes llegan a `estudiosoregaroli@gmail.com` con copia a `estudiosoregaroli@hotmail.com`.

**Importante:** el primer envío manda un email de activación a la casilla de Gmail. Hay que abrirlo y confirmar. Desde ese momento, los envíos llegan a las dos casillas.

## Rendimiento y accesibilidad

- El contenido es HTML puro y se ve aunque el 3D no cargue. El 3D llega después, con una transición suave.
- En celulares se desactivan los efectos de posprocesado y se baja la resolución. Si el equipo no rinde, se degrada solo.
- Con "reducir movimiento" activado en el sistema, se desactivan el scroll suave, las partículas y las animaciones.
- Si no hay WebGL, se muestra un fondo degradado.

## Publicación

Es un sitio estático: sirve cualquier hosting gratuito (Vercel, Netlify o Cloudflare Pages), con build `npm run build` y carpeta de salida `dist`.

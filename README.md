# Mariana Soregaroli & Asoc. — sitio web

Sitio de una sola página para el estudio técnico de ascensores, con estética de **plano técnico** (azul de plano, trazo blanco). Un ascensor 3D dibujado como corte técnico acompaña el recorrido: a medida que se hace scroll la cabina sube, abre sus puertas con campanilla en cada piso, y cada piso es una sección (PB Inicio · 1 Gestoría · 2 Servicios · 3 Nosotros · 4 Contacto).

## Tecnología

- **Astro 7**: HTML estático, carga instantánea y buen SEO.
- **React Three Fiber, Drei y Three.js**: escena 3D en líneas de plano (cabina, puertas, pasadizo, contrapeso, sala de máquinas con polea y cables), dibujada por código sin archivos pesados.
- **Web Audio**: campanilla de llegada sintetizada (se puede silenciar desde el cajetín).
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

Usa [FormSubmit](https://formsubmit.co), sin registro ni costo. Los mensajes llegan a `estudiosoregaroli@hotmail.com` (principal) con copia a `estudiosoregaroli@gmail.com`.

**Activación (una sola vez):** hacer un envío de prueba desde el formulario. Llega a Hotmail un email de FormSubmit ("Action Required: Activate Form"); abrirlo y tocar **Activate Form**. Revisar también la carpeta de correo no deseado. Si al publicar en el dominio definitivo llega otro email de activación, confirmarlo de nuevo.

## Rendimiento y accesibilidad

- El contenido es HTML puro y se ve aunque el 3D no cargue. El 3D llega después, con una transición suave.
- En celulares el plano 3D vive al pie de la portada y deja de dibujarse cuando sale de pantalla.
- Con "reducir movimiento" activado en el sistema, se desactivan el scroll suave y las animaciones.
- Si el navegador no soporta WebGL, se sigue viendo el fondo de plano, sin el ascensor.

## Publicación

Publicado en **Cloudflare Workers** como sitio estático (`estudiomarianasoregaroli`), conectado a este repositorio: cada `git push` a `main` publica automáticamente.

- URL actual: https://estudiomarianasoregaroli.estudiosoregaroli.workers.dev
- Build: `npm run build` · deploy: `npx wrangler deploy` (usa `wrangler.jsonc`) · Node 22 (`.node-version`).
- Dominio propio: en Cloudflare, *Workers & Pages → estudiomarianasoregaroli → Settings → Domains & Routes → Add → Custom domain*. Después actualizar `site` en `astro.config.mjs` y hacer push.

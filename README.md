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

Publicado en **Cloudflare Workers** (sitio estático) como , conectado a este repositorio: cada  a  publica automáticamente.

- URL actual: https://estudiomarianasoregaroli.estudiosoregaroli.workers.dev
- Build:  · deploy: 
╭─────────────────────────────────╮
│ Did you mean "wrangler deploy"? │
╰─────────────────────────────────╯

wrangler

COMMANDS
  wrangler docs [search..]        📚 Open Wrangler's command documentation in your browser
  wrangler complete [shell]       ⌨️ Generate and handle shell completions

  wrangler email                  Manage Cloudflare Email services [open beta]

ACCOUNT
  wrangler auth                   🔐 Manage authentication
  wrangler login                  🔓 Login to Cloudflare
  wrangler logout                 🚪 Logout from Cloudflare
  wrangler whoami                 🕵️ Retrieve your user information

COMPUTE & AI
  wrangler agent-memory           🧠 Manage Agent Memory namespaces [private beta]
  wrangler ai                     🤖 Manage AI models
  wrangler ai-search              🔍 Manage AI Search instances [open beta]
  wrangler browser                🌐 Manage Browser Run sessions [open beta]
  wrangler containers             📦 Manage Containers
  wrangler delete [name]          🗑️ Delete a Worker from Cloudflare
  wrangler deploy [path]          🆙 Deploy a Worker to Cloudflare
  wrangler deployments            🚢 List and view the current and past deployments for your Worker
  wrangler dev [script]           👂 Start a local server for developing your Worker
  wrangler dispatch-namespace     🏗️ Manage dispatch namespaces
  wrangler flagship               🚩 Manage Flagship apps and feature flags [open beta]
  wrangler init [name]            📥 Initialize a basic Worker
  wrangler pages                  ⚡️ Configure Cloudflare Pages
  wrangler preview [script]       👀 Create a Preview deployment of the current Worker [open beta]
  wrangler queues                 📬 Manage Workers Queues
  wrangler rollback [version-id]  🔙 Rollback a deployment for a Worker
  wrangler secret                 🤫 Generate a secret that can be referenced in a Worker
  wrangler setup                  🪄 Setup a project to work on Cloudflare
  wrangler tail [worker]          🦚 Start a log tailing session for a Worker
  wrangler triggers               🎯 Updates the triggers of your current deployment [experimental]
  wrangler types [path]           📝 Generate types from your Worker configuration
  wrangler versions               🫧 List, view, upload and deploy Versions of your Worker to Cloudflare
  wrangler vpc                    🌐 Manage VPC [open beta]
  wrangler workflows              🔁 Manage Workflows

STORAGE & DATABASES
  wrangler artifacts              🧱 Manage Artifacts namespaces and repos [private beta]
  wrangler d1                     🗄️ Manage Workers D1 databases
  wrangler hyperdrive             🚀 Manage Hyperdrive databases
  wrangler kv                     🗂️ Manage Workers KV Namespaces
  wrangler pipelines              🚰 Manage Cloudflare Pipelines [open beta]
  wrangler r2                     📦 Manage R2 buckets & objects
  wrangler secrets-store          🔐 Manage the Secrets Store [open beta]
  wrangler vectorize              🧮 Manage Vectorize indexes

NETWORKING & SECURITY
  wrangler cert                   🪪 Manage client mTLS certificates and CA certificate chains used for secured connections [open beta]
  wrangler mtls-certificate       🪪 Manage certificates used for mTLS connections
  wrangler tunnel                 🚇 Manage Cloudflare Tunnels [experimental]
  wrangler turnstile              🛡️ Manage Turnstile widgets [alpha]

GLOBAL FLAGS
  -c, --config          Path to Wrangler configuration file  [string]
      --cwd             Run as if Wrangler was started in the specified directory instead of the current working directory  [string]
  -e, --env             Environment to use for operations, and for selecting .env and .dev.vars files  [string]
      --env-file        Path to an .env file to load - can be specified multiple times - values from earlier files are overridden by values in later files  [array]
  -h, --help            Show help  [boolean]
      --install-skills  Install Cloudflare skills for detected AI coding agents before running the command  [boolean] [default: false]
      --profile         Use a specific auth profile  [string]
  -v, --version         Show version number  [boolean]

Please report any issues to https://github.com/cloudflare/workers-sdk/issues/new/choose (usa ) · Node 22 ().
- Dominio propio: en Cloudflare, *Workers & Pages → estudiomarianasoregaroli → Settings → Domains & Routes → Add → Custom domain*. Después actualizar  en  y hacer push.

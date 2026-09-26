// Punto de entrada del Worker: unifica todas las direcciones en https://estudiomarianasoregaroli.com
// (www, http y la URL de workers.dev) y sirve el sitio estático generado por Astro.
const HOST = 'estudiomarianasoregaroli.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!isLocal && (url.hostname !== HOST || url.protocol !== 'https:')) {
      url.protocol = 'https:';
      url.hostname = HOST;
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};

// Genera el logo del estudio con el texto convertido a trazos (no depende de fuentes instaladas)
// y exporta las variantes a /brand y /public. Uso: npm run brand
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import opentype from 'opentype.js';
import sharp from 'sharp';

const fontDir = 'node_modules/@fontsource/space-grotesk/files';
const load = (w) => {
  const buf = readFileSync(`${fontDir}/space-grotesk-latin-${w}-normal.woff`);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const bold = load(600);
const medium = load(500);

const C = {
  ink: '#0A0E13',
  navy: '#111A26',
  steel: '#D5DBE3',
  steelDark: '#1C2735',
  muted: '#8995A6',
  mutedDark: '#5B6778',
  amber: '#F2A93B',
};

// toPathData() de opentype.js 2.0 genera datos que librsvg no interpreta bien; serializamos a mano.
const r = (n) => +n.toFixed(2);
function pathData(p) {
  return p.commands
    .map((c) => {
      if (c.type === 'M' || c.type === 'L') return `${c.type}${r(c.x)} ${r(c.y)}`;
      if (c.type === 'Q') return `Q${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`;
      if (c.type === 'C') return `C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`;
      return 'Z';
    })
    .join('');
}

// Texto -> path con tracking manual (em) y kerning.
function textPath(font, text, x, y, size, tracking = 0) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  let cx = x;
  let d = '';
  glyphs.forEach((g, i) => {
    d += pathData(g.getPath(cx, y, size));
    cx += g.advanceWidth * scale;
    if (i < glyphs.length - 1) {
      cx += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking * size;
    }
  });
  return { d, width: cx - x };
}

// Isotipo: marco de ascensor, indicador de subida y puertas entreabiertas con luz.
function mark({ frame, door, accent, bg = null }, t = '') {
  return `<g${t ? ` transform="${t}"` : ''}>
    ${bg ? `<rect x="0" y="0" width="64" height="64" rx="15" fill="${bg}"/>` : ''}
    <rect x="4.5" y="4.5" width="55" height="55" rx="12" fill="none" stroke="${frame}" stroke-width="3"/>
    <path d="M32 11 L36.8 17.2 H27.2 Z" fill="${accent}"/>
    <path d="M12.5 50.5 V20.5 H51.5 V50.5" fill="none" stroke="${frame}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="16" y="23" width="14.4" height="27.5" rx="0.6" fill="${door}"/>
    <rect x="33.6" y="23" width="14.4" height="27.5" rx="0.6" fill="${door}"/>
    <rect x="30.4" y="23" width="3.2" height="27.5" fill="${accent}"/>
    <path d="M30.4 50.5 H33.6 L42 55.5 H22 Z" fill="${accent}" opacity="0.45"/>
    <rect x="10" y="50.5" width="44" height="1.6" rx="0.8" fill="${frame}"/>
  </g>`;
}

const NAME = 'MARIANA SOREGAROLI';
const ASOC = '& ASOC.';
const SUB = 'ESTUDIO TÉCNICO DE ASCENSORES';
const LABEL = 'Mariana Soregaroli &amp; Asoc.'; // escapado para XML
const TRACK = 0.05;

// Texto con tracking calculado para ocupar exactamente `width`.
function fitted(font, text, x, baseline, size, width) {
  const raw = textPath(font, text, 0, 0, size, 0).width;
  return textPath(font, text, x, baseline, size, (width - raw) / (text.length - 1) / size);
}

const palette = (dark) => ({
  mark: { frame: dark ? '#FFFFFF' : C.steelDark, door: dark ? '#FFFFFF' : C.steelDark, accent: C.amber },
  word: dark ? '#FFFFFF' : C.navy,
  sub: dark ? '#BCD6F3' : C.mutedDark,
});

// Una línea: "MARIANA SOREGAROLI & ASOC." + subtítulo del mismo ancho.
function wordmark(x, baseline, size, colors) {
  const n = textPath(bold, NAME, x, baseline, size, TRACK);
  const a = textPath(medium, ASOC, x + n.width + size * 0.34, baseline, size, TRACK);
  const width = n.width + size * 0.34 + a.width;
  const s = fitted(medium, SUB, x, baseline + size * 0.62, size * 0.3, width);
  return {
    svg: `<path d="${n.d}" fill="${colors.word}"/><path d="${a.d}" fill="${colors.word}" fill-opacity="0.82"/><path d="${s.d}" fill="${colors.sub}"/>`,
    width,
  };
}

function horizontal(theme) {
  const p = palette(theme === 'dark');
  const wm = wordmark(84, 37, 33, p);
  const W = Math.ceil(84 + wm.width + 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 64" role="img" aria-label="${LABEL}">${mark(p.mark)}${wm.svg}</svg>`;
}

// Dos líneas, para celulares y la barra flotante: nombre arriba, "& ASOC. · ESTUDIO TÉCNICO" abajo.
function compact(theme) {
  const p = palette(theme === 'dark');
  const size = 25;
  const n = textPath(bold, NAME, 82, 27, size, TRACK);
  const a = textPath(bold, ASOC, 82, 56, size, TRACK);
  const subX = 82 + a.width + 12;
  const s = fitted(medium, 'ESTUDIO TÉCNICO', subX, 55, 10.5, n.width - a.width - 12);
  const W = Math.ceil(82 + n.width + 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 64" role="img" aria-label="${LABEL}">${mark(p.mark)}<path d="${n.d}" fill="${p.word}"/><path d="${a.d}" fill="${p.word}" fill-opacity="0.82"/><path d="${s.d}" fill="${p.sub}"/></svg>`;
}

function stacked(theme) {
  const p = palette(theme === 'dark');
  const size = 40;
  const nw = textPath(bold, NAME, 0, 0, size, TRACK).width;
  const aw = textPath(bold, ASOC, 0, 0, size, TRACK).width;
  const W = Math.ceil(nw + 8);
  const n = textPath(bold, NAME, 4, 142, size, TRACK);
  const a = textPath(bold, ASOC, (W - aw) / 2, 190, size, TRACK);
  const s = fitted(medium, SUB, 4, 222, 12, nw);
  const m = mark(p.mark, `translate(${(W - 88) / 2} 8) scale(1.375)`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 232" role="img" aria-label="${LABEL}">${m}<path d="${n.d}" fill="${p.word}"/><path d="${a.d}" fill="${p.word}" fill-opacity="0.82"/><path d="${s.d}" fill="${p.sub}"/></svg>`;
}

const isotipo = (theme) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${LABEL}">${mark({
    frame: theme === 'dark' ? C.steel : C.steelDark,
    door: theme === 'dark' ? C.steel : C.steelDark,
    accent: C.amber,
  })}</svg>`;

// Ícono de app / favicon: fondo sólido para que se lea en cualquier pestaña.
const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${mark({
  frame: C.steel,
  door: C.steel,
  accent: C.amber,
  bg: '#174E8A',
})}</svg>`;

function ogImage() {
  const W = 1200, H = 630;
  // Lámina de plano azul, igual que la portada del sitio.
  const lockup = `<g transform="translate(96 96)">${mark({ frame: '#FFFFFF', door: '#FFFFFF', accent: C.amber }, 'scale(1.35)')}<g transform="translate(118 50)">${wordmark(0, 0, 44, { word: '#FFFFFF', sub: '#BCD6F3' }).svg}</g></g>`;
  const h1 = textPath(bold, 'Habilitaciones y gestoría', 96, 380, 64, -0.01);
  const h2 = textPath(bold, 'de ascensores en CABA', 96, 452, 64, -0.01);
  const sub = textPath(medium, 'OBLEA QR RES. 430  ·  PERMISO DE CONSERVADOR  ·  +15 AÑOS', 96, 530, 20, 0.12);
  const lines = (step, op) =>
    `<g stroke="#ffffff" stroke-opacity="${op}">` +
    Array.from({ length: Math.ceil(W / step) + 1 }, (_, i) => `<line x1="${i * step}" y1="0" x2="${i * step}" y2="${H}"/>`).join('') +
    Array.from({ length: Math.ceil(H / step) + 1 }, (_, i) => `<line x1="0" y1="${i * step}" x2="${W}" y2="${i * step}"/>`).join('') +
    '</g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#113C6D"/><stop offset="0.55" stop-color="#18528F"/><stop offset="1" stop-color="#1F5F9F"/></linearGradient>
      <radialGradient id="glow" cx="0.8" cy="0.25" r="0.6"><stop offset="0" stop-color="#4C91DC" stop-opacity="0.55"/><stop offset="1" stop-color="#4C91DC" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    ${lines(24, 0.05)}${lines(120, 0.12)}
    <rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="14" fill="none" stroke="#ffffff" stroke-opacity="0.25"/>
    ${lockup}
    <path d="${h1.d}" fill="#FFFFFF"/><path d="${h2.d}" fill="#FFFFFF"/>
    <path d="${sub.d}" fill="#FFC56B"/>
  </svg>`;
}

mkdirSync('brand', { recursive: true });
mkdirSync('public', { recursive: true });

const files = {
  'brand/logo-horizontal-oscuro.svg': horizontal('dark'),
  'brand/logo-horizontal-claro.svg': horizontal('light'),
  'brand/logo-vertical-oscuro.svg': stacked('dark'),
  'brand/logo-vertical-claro.svg': stacked('light'),
  'brand/logo-compacto-oscuro.svg': compact('dark'),
  'brand/logo-compacto-claro.svg': compact('light'),
  'brand/isotipo-oscuro.svg': isotipo('dark'),
  'brand/isotipo-claro.svg': isotipo('light'),
  'brand/icono-app.svg': appIcon,
  'public/favicon.svg': appIcon,
  'public/logo.svg': horizontal('dark'),
  'public/logo-claro.svg': horizontal('light'),
  'public/logo-compacto.svg': compact('dark'),
  'public/logo-compacto-claro.svg': compact('light'),
  'public/logo-vertical.svg': stacked('dark'),
  'public/logo-vertical-claro.svg': stacked('light'),
  'public/isotipo.svg': isotipo('dark'),
  'public/isotipo-claro.svg': isotipo('light'),
};
for (const [path, svg] of Object.entries(files)) writeFileSync(path, svg);

await sharp(Buffer.from(ogImage())).png().toFile('public/og-image.png');
await sharp(Buffer.from(appIcon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(appIcon)).resize(512, 512).png().toFile('brand/icono-app-512.png');
await sharp(Buffer.from(horizontal('light'))).resize({ width: 1600 }).png().toFile('brand/logo-horizontal-claro.png');
await sharp(Buffer.from(horizontal('dark'))).resize({ width: 1600 }).png().toFile('brand/logo-horizontal-oscuro.png');

console.log('Logo generado:', Object.keys(files).length, 'SVG + PNGs');

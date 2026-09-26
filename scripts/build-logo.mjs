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

const WORD = 'SOREGAROLI';
const SUB = 'ESTUDIO TÉCNICO · ASCENSORES';

function wordmark(x, baseline, size, colors) {
  const w = textPath(bold, WORD, x, baseline, size, 0.06);
  // Subtítulo con tracking calculado para igualar el ancho de la marca.
  const subSize = size * 0.3;
  const raw = textPath(medium, SUB, 0, 0, subSize, 0).width;
  const gaps = SUB.length - 1;
  const tracking = (w.width - raw) / gaps / subSize;
  const s = textPath(medium, SUB, x, baseline + size * 0.62, subSize, tracking);
  return {
    svg: `<path d="${w.d}" fill="${colors.word}"/><path d="${s.d}" fill="${colors.sub}"/>`,
    width: w.width,
  };
}

function horizontal(theme) {
  const dark = theme === 'dark';
  const m = mark({ frame: dark ? C.steel : C.steelDark, door: dark ? C.steel : C.steelDark, accent: C.amber });
  const wm = wordmark(84, 37, 33, { word: dark ? C.steel : C.navy, sub: dark ? C.muted : C.mutedDark });
  const W = Math.ceil(84 + wm.width + 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 64" width="${W * 3}" height="192" role="img" aria-label="Estudio Técnico Soregaroli">${m}${wm.svg}</svg>`;
}

function stacked(theme) {
  const dark = theme === 'dark';
  const probe = wordmark(0, 0, 40, { word: '', sub: '' }).width;
  const W = Math.ceil(probe + 8);
  const wm = wordmark(4, 140, 40, { word: dark ? C.steel : C.navy, sub: dark ? C.muted : C.mutedDark });
  const m = mark(
    { frame: dark ? C.steel : C.steelDark, door: dark ? C.steel : C.steelDark, accent: C.amber },
    `translate(${(W - 88) / 2} 8) scale(1.375)`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 170" role="img" aria-label="Estudio Técnico Soregaroli">${m}${wm.svg}</svg>`;
}

const isotipo = (theme) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Soregaroli">${mark({
    frame: theme === 'dark' ? C.steel : C.steelDark,
    door: theme === 'dark' ? C.steel : C.steelDark,
    accent: C.amber,
  })}</svg>`;

// Ícono de app / favicon: fondo sólido para que se lea en cualquier pestaña.
const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${mark({
  frame: C.steel,
  door: C.steel,
  accent: C.amber,
  bg: C.ink,
})}</svg>`;

function ogImage() {
  const W = 1200, H = 630;
  const lockup = `<g transform="translate(96 96)">${mark({ frame: C.steel, door: C.steel, accent: C.amber }, 'scale(1.35)')}<g transform="translate(118 50)">${wordmark(0, 0, 44, { word: C.steel, sub: C.muted }).svg}</g></g>`;
  const h1 = textPath(bold, 'Habilitaciones y gestoría', 96, 380, 64, -0.01);
  const h2 = textPath(bold, 'de ascensores en CABA', 96, 452, 64, -0.01);
  const sub = textPath(medium, 'OBLEA QR RES. 430  ·  PERMISO DE CONSERVADOR  ·  +40 AÑOS', 96, 530, 20, 0.12);
  const grid = Array.from({ length: 13 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${H}"/>`).join('') +
    Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 100 + 15}" x2="${W}" y2="${i * 100 + 15}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <radialGradient id="g" cx="0.85" cy="0.2" r="0.9"><stop offset="0" stop-color="#1B2636"/><stop offset="1" stop-color="${C.ink}"/></radialGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.amber}" stop-opacity="0"/><stop offset="0.5" stop-color="${C.amber}" stop-opacity="0.9"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <g stroke="#ffffff" stroke-opacity="0.04">${grid}</g>
    <rect x="1010" y="0" width="3" height="${H}" fill="url(#beam)"/>
    ${lockup}
    <path d="${h1.d}" fill="#F3F5F8"/><path d="${h2.d}" fill="#F3F5F8"/>
    <path d="${sub.d}" fill="${C.amber}"/>
  </svg>`;
}

mkdirSync('brand', { recursive: true });
mkdirSync('public', { recursive: true });

const files = {
  'brand/logo-horizontal-oscuro.svg': horizontal('dark'),
  'brand/logo-horizontal-claro.svg': horizontal('light'),
  'brand/logo-vertical-oscuro.svg': stacked('dark'),
  'brand/logo-vertical-claro.svg': stacked('light'),
  'brand/isotipo-oscuro.svg': isotipo('dark'),
  'brand/isotipo-claro.svg': isotipo('light'),
  'brand/icono-app.svg': appIcon,
  'public/favicon.svg': appIcon,
  'public/logo.svg': horizontal('dark'),
  'public/logo-claro.svg': horizontal('light'),
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

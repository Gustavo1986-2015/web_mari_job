import * as THREE from 'three';

export const FLOOR_H = 4.2; // altura entre pisos (m)
export const CABIN = { w: 2.4, h: 2.6, d: 2.0 };
export const DISPLAY_FONT = '"Space Grotesk Variable", "Inter Variable", system-ui, sans-serif';

// Textura de acero cepillado generada por código (sin descargar imágenes).
function brushedTexture(vertical = false) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgb(118,118,118)';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3000; i++) {
    const v = 100 + Math.random() * 40;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.15 + Math.random() * 0.25})`;
    ctx.fillRect(0, Math.random() * size, size, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  if (vertical) {
    tex.rotation = Math.PI / 2;
    tex.center.set(0.5, 0.5);
  }
  return tex;
}

export function createMaterials() {
  const brushedH = brushedTexture(false);
  const brushedV = brushedTexture(true);

  return {
    steel: new THREE.MeshStandardMaterial({
      color: '#c3ccd8',
      metalness: 1,
      roughness: 0.78,
      roughnessMap: brushedH,
    }),
    doorSteel: new THREE.MeshStandardMaterial({
      color: '#b9c3cf',
      metalness: 1,
      roughness: 0.8,
      roughnessMap: brushedV,
    }),
    darkSteel: new THREE.MeshStandardMaterial({ color: '#2b3542', metalness: 0.85, roughness: 0.42 }),
    frame: new THREE.MeshStandardMaterial({ color: '#4a5563', metalness: 0.75, roughness: 0.45 }),
    rail: new THREE.MeshStandardMaterial({ color: '#8b96a3', metalness: 1, roughness: 0.3 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#171c24', metalness: 0.1, roughness: 0.92 }),
    floorStone: new THREE.MeshStandardMaterial({ color: '#1d232c', metalness: 0.3, roughness: 0.25 }),
    glass: new THREE.MeshStandardMaterial({
      color: '#a7bbd0',
      metalness: 0.9,
      roughness: 0.06,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
    cable: new THREE.MeshStandardMaterial({ color: '#5d6773', metalness: 1, roughness: 0.4 }),
    // Emisivos con valores > 1 para que el bloom los haga brillar.
    amber: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.55, 0.45), toneMapped: false }),
    amberDim: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.52, 0.16), toneMapped: false }),
    warmLight: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.7), toneMapped: false }),
  };
}

export type Materials = ReturnType<typeof createMaterials>;

// Textura de texto (para números de piso y el display de la cabina).
export function drawLabel(
  canvas: HTMLCanvasElement,
  text: string,
  opts: { color: string; bg?: string; size: number; arrow?: 'up' | 'down' | null },
) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = opts.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${opts.size}px ${DISPLAY_FONT}`;
  const cx = opts.arrow ? canvas.width * 0.6 : canvas.width / 2;
  ctx.fillText(text, cx, canvas.height / 2 + opts.size * 0.04);
  if (opts.arrow) {
    const s = canvas.height * 0.22;
    const ax = canvas.width * 0.22;
    const ay = canvas.height / 2;
    ctx.beginPath();
    if (opts.arrow === 'up') {
      ctx.moveTo(ax, ay - s);
      ctx.lineTo(ax + s, ay + s * 0.7);
      ctx.lineTo(ax - s, ay + s * 0.7);
    } else {
      ctx.moveTo(ax, ay + s);
      ctx.lineTo(ax + s, ay - s * 0.7);
      ctx.lineTo(ax - s, ay - s * 0.7);
    }
    ctx.closePath();
    ctx.fill();
  }
}

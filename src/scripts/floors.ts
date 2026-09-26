// Traduce la posición de scroll a un "piso" continuo (0 = PB, 1, 2...).
// La cabina se queda quieta mientras se lee una sección y viaja en el tramo
// final antes de que aparezca la siguiente. Lo usan la escena 3D y el indicador.

export const FLOOR_LABELS = ['PB', '1', '2', '3', '4'];

let anchors: number[] = [];
let vh = 1;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function measureFloors() {
  vh = window.innerHeight;
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-floor]'));
  anchors = sections.map((el, i) =>
    i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY - vh * 0.4,
  );
}

export function floorAt(scroll: number) {
  if (anchors.length < 2) return 0;
  for (let i = 0; i < anchors.length - 1; i++) {
    const end = anchors[i + 1];
    if (scroll < end) {
      const start = Math.max(anchors[i], end - vh * 0.85);
      return i + smoothstep(start, end, scroll);
    }
  }
  return anchors.length - 1;
}

export function floorCount() {
  return Math.max(anchors.length, FLOOR_LABELS.length);
}

let observing = false;
export function watchFloors() {
  measureFloors();
  if (observing) return;
  observing = true;
  // Las alturas cambian al cargar fuentes/imágenes o al rotar el teléfono.
  new ResizeObserver(() => measureFloors()).observe(document.body);
  window.addEventListener('resize', measureFloors, { passive: true });
}
